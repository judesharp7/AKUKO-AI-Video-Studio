import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { modelRegistry } from "@/lib/providers";
import { readDb, writeDb } from "@/lib/db/store";
import { parseScriptToScenes } from "@/lib/workflow/pipeline";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const scenes = db.scenes.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position);
  return NextResponse.json({ scenes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }

  if (body.action === "parse_script" && typeof body.script_text === "string") {
    const newScenes = parseScriptToScenes(id, body.script_text, project.target_duration_seconds);
    db.scenes = [...db.scenes.filter((s) => s.project_id !== id), ...newScenes];
    writeDb(db);
    return NextResponse.json({ scenes: newScenes }, { status: 201 });
  }

  const duration = Number(body.duration_seconds ?? 10);
  const validation = modelRegistry.validateSceneDuration(duration);
  if (!validation.valid) {
    return NextResponse.json({ error: { code: "DURATION_LIMIT", userMessage: validation.message } }, { status: 400 });
  }

  const existing = db.scenes.filter((s) => s.project_id === id);
  const maxPos = existing.reduce((m, s) => Math.max(m, s.position), 0);
  const now = new Date().toISOString();

  const scene = {
    id: crypto.randomUUID(),
    project_id: id,
    position: maxPos + 1000,
    duration_seconds: duration,
    location_name: body.location_name || "Studio Location",
    character_ids: Array.isArray(body.character_ids) ? body.character_ids : [],
    action: body.action || "New scene action",
    dialogue: body.dialogue || "",
    camera: body.camera || "Medium shot",
    mood: body.mood || "Cinematic",
    visual_prompt: body.visual_prompt || body.action || "New scene visual",
    ai_prompt: body.ai_prompt || null,
    status: "draft" as const,
    created_at: now,
    updated_at: now,
  };

  db.scenes.push(scene);
  writeDb(db);
  return NextResponse.json({ scene }, { status: 201 });
}

