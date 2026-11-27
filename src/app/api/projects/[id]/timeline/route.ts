import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { EditDecisionList, TimelineClip } from "@/types/database";
import { readDb, writeDb } from "@/lib/db/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }

  const latest = db.timelines.filter((t) => t.project_id === id).sort((a, b) => b.version - a.version)[0];
  if (latest) {
    return NextResponse.json({ timeline: latest });
  }

  // Auto-construct initial timeline from scenes
  const scenes = db.scenes.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position);
  let cursor = 0;
  const clips: TimelineClip[] = [];

  for (const scene of scenes) {
    clips.push({
      id: crypto.randomUUID(),
      sceneId: scene.id,
      track: "video",
      label: scene.location_name || "Scene",
      startTime: cursor,
      duration: scene.duration_seconds,
      trimStart: 0,
      trimEnd: 0,
      assetUrl: scene.preview_url ?? undefined,
      transition: "dissolve",
      volume: 1,
    });

    if (scene.dialogue) {
      clips.push({
        id: crypto.randomUUID(),
        sceneId: scene.id,
        track: "voice",
        label: scene.dialogue.slice(0, 32),
        startTime: cursor,
        duration: scene.duration_seconds,
        trimStart: 0,
        trimEnd: 0,
        assetUrl: scene.voice_url ?? undefined,
        volume: 1,
      });
    }

    cursor += scene.duration_seconds;
  }

  if (cursor > 0) {
    clips.push({
      id: crypto.randomUUID(),
      track: "music",
      label: "Lagos Horizon (Afro-Cinematic)",
      startTime: 0,
      duration: cursor,
      trimStart: 0,
      trimEnd: 0,
      volume: 0.35,
    });
  }

  const edl: EditDecisionList = {
    clips,
    musicTrack: { id: "trk_afrobeat_cinematic", title: "Lagos Horizon (Afro-Cinematic)", mood: "african", volume: 0.35 },
    aspectRatio: project.aspect_ratio,
    totalDuration: cursor,
  };

  const record = {
    id: crypto.randomUUID(),
    project_id: id,
    version: 1,
    edit_decision_list: edl,
    created_at: new Date().toISOString(),
  };
  db.timelines.unshift(record);
  writeDb(db);

  return NextResponse.json({ timeline: record });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { edit_decision_list: EditDecisionList };
  const db = readDb();

  const existing = db.timelines.filter((t) => t.project_id === id);
  const nextVersion = existing.reduce((m, t) => Math.max(m, t.version), 0) + 1;

  const record = {
    id: crypto.randomUUID(),
    project_id: id,
    version: nextVersion,
    edit_decision_list: body.edit_decision_list,
    created_at: new Date().toISOString(),
  };

  db.timelines.unshift(record);
  writeDb(db);
  return NextResponse.json({ timeline: record }, { status: 201 });
}

