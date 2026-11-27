import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { llmProvider } from "@/lib/providers";
import { readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { idea?: string };
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }

  const targetMinutes = Math.max(1, Math.round(project.target_duration_seconds / 60));
  const story = await llmProvider.generateStory(body.idea || project.name, project.type, targetMinutes);

  const existing = db.scripts.filter((s) => s.project_id === id);
  const nextVersion = existing.reduce((max, s) => Math.max(max, s.version), 0) + 1;

  const scriptRecord = {
    id: crypto.randomUUID(),
    project_id: id,
    version: nextVersion,
    story_json: story,
    script_text: existing[0]?.script_text ?? "",
    created_at: new Date().toISOString(),
  };

  db.scripts.unshift(scriptRecord);
  project.current_step = "story";
  project.updated_at = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ story, script: scriptRecord });
}

