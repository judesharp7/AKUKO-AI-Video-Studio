import { NextResponse } from "next/server";
import { readDb } from "@/lib/db/store";

const VIDEO_HOST = "commondatastorage.googleapis.com";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; exportId: string }> },
) {
  const { id, exportId } = await params;
  const db = readDb();
  const exportRecord = db.exports.find((item) => item.id === exportId && item.project_id === id);
  if (!exportRecord?.download_url) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", userMessage: "Video export not found." } },
      { status: 404 },
    );
  }

  let source: URL;
  try {
    source = new URL(exportRecord.download_url);
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_VIDEO_URL", userMessage: "The video download URL is invalid." } },
      { status: 502 },
    );
  }

  if (source.protocol !== "https:" || source.hostname !== VIDEO_HOST || source.username || source.password) {
    return NextResponse.json(
      { error: { code: "UNSUPPORTED_VIDEO_HOST", userMessage: "This video cannot be downloaded from its source." } },
      { status: 502 },
    );
  }

  let video: Response;
  try {
    video = await fetch(source, { redirect: "manual" });
  } catch {
    return NextResponse.json(
      { error: { code: "VIDEO_UNAVAILABLE", userMessage: "The video source is temporarily unavailable." } },
      { status: 502 },
    );
  }

  if (!video.ok || !video.body) {
    return NextResponse.json(
      { error: { code: "VIDEO_UNAVAILABLE", userMessage: "The video source is temporarily unavailable." } },
      { status: 502 },
    );
  }

  const project = db.projects.find((item) => item.id === id);
  const filename = encodeURIComponent(`${project?.name || "akuko-video"}.mp4`).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return new NextResponse(video.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="video.mp4"; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
