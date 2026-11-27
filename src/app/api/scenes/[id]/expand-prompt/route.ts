import { NextRequest, NextResponse } from "next/server";
import { moderatePrompt } from "@/lib/providers";
import { readDb, writeDb } from "@/lib/db/store";
import { expandScenePrompt } from "@/lib/workflow/pipeline";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const db = readDb();
  const scene = db.scenes.find((s) => s.id === id);
  if (!scene) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Scene not found." } }, { status: 404 });
  }

  if (body.text) {
    scene.visual_prompt = body.text;
  }

  const mod = moderatePrompt(scene.visual_prompt || scene.action);
  if (!mod.allowed) {
    return NextResponse.json({ error: { code: mod.reasonCode, userMessage: mod.userMessage } }, { status: 400 });
  }

  const expanded = await expandScenePrompt(db, scene);
  scene.ai_prompt = expanded;
  scene.updated_at = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ original: scene.visual_prompt, ai_prompt: expanded, scene });
}

