import http from "http";
import { execFile } from "child_process";

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", worker: "ffmpeg" }));
    return;
  }

  if (req.url === "/render" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        execFile("ffmpeg", ["-version"], (err, stdout) => {
          if (err) {
            res.writeHead(500, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "FFmpeg unavailable", details: err.message }));
            return;
          }
          res.writeHead(202, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              accepted: true,
              projectId: payload.projectId,
              resolution: payload.resolution || "1080p",
              ffmpegVersion: stdout.split("\n")[0],
            })
          );
        });
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`AKUKO FFmpeg worker listening on port ${PORT}`);
});

