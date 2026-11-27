import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { SubtitleCue, SubtitlePreset } from "@/types/database";
import { readDb, writeDb } from "@/lib/db/store";
import { generateSubtitlesFromScenes } from "@/lib/workflow/pipeline";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const sub = db.subtitles.find((s) => s.project_id === id) ?? null;
  return NextResponse.json({ subtitle: sub });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    style_preset?: SubtitlePreset;
    cues?: SubtitleCue[];
    autoGenerate?: boolean;
  };
  const db = readDb();

  const scenes = db.scenes.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position);
  const cues = body.cues ?? generateSubtitlesFromScenes(scenes);
  const existingIdx = db.subtitles.findIndex((s) => s.project_id === id);

  const record = {
    id: existingIdx !== -1 ? db.subtitles[existingIdx].id : crypto.randomUUID(),
    project_id: id,
    cues,
    style_preset: body.style_preset ?? (existingIdx !== -1 ? db.subtitles[existingIdx].style_preset : "clean"),
    created_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    db.subtitles[existingIdx] = record;
  } else {
    db.subtitles.unshift(record);
  }
  writeDb(db);
  return NextResponse.json({ subtitle: record });
}

