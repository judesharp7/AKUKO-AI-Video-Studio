import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb } from "@/lib/db/store";
import { parseScriptToScenes } from "@/lib/workflow/pipeline";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { parseScenes?: boolean };
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }

  const latest = db.scripts.filter((s) => s.project_id === id).sort((a, b) => b.version - a.version)[0];
  const story = latest?.story_json;

  const characters = story?.characters ?? [{ name: "Lead", role: "Protagonist", description: "" }];
  const events = story?.events ?? ["Opening scene establishes the world.", "Conflict rises.", "Final resolution."];

  const scriptLines = events.map((evt, idx) => {
    const speaker = characters[idx % characters.length]?.name.toUpperCase() || "NARRATOR";
    return `SCENE ${idx + 1} - LOCATION ${idx + 1} - DAY\n${evt}\n${speaker}: This is the moment we have been waiting for.`;
  });

  if (story?.climax) {
    scriptLines.push(`SCENE ${events.length + 1} - CLIMAX ARENA - NIGHT\n${story.climax}\n${characters[0].name.toUpperCase()}: Everything depends on this!`);
  }
  if (story?.ending) {
    scriptLines.push(`SCENE ${events.length + 2} - RESOLUTION - GOLDEN HOUR\n${story.ending}\n${characters[0].name.toUpperCase()}: We made it.`);
  }

  const scriptText = scriptLines.join("\n\n");
  const nextVersion = (latest?.version ?? 0) + 1;
  const scriptRecord = {
    id: crypto.randomUUID(),
    project_id: id,
    version: nextVersion,
    story_json: story ?? null,
    script_text: scriptText,
    created_at: new Date().toISOString(),
  };

  db.scripts.unshift(scriptRecord);

  let createdScenes = db.scenes.filter((s) => s.project_id === id);
  if (body.parseScenes !== false) {
    const userCharIds = db.characters.filter((c) => c.user_id === project.user_id && c.locked).map((c) => c.id).slice(0, 2);
    const newScenes = parseScriptToScenes(id, scriptText, project.target_duration_seconds, userCharIds);
    db.scenes = [...db.scenes.filter((s) => s.project_id !== id), ...newScenes];
    createdScenes = newScenes;
    project.current_step = "scenes";
  }

  project.updated_at = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ script: scriptRecord, scenes: createdScenes });
}

