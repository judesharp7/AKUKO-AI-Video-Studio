import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { ExportResolution } from "@/types/database";
import { getActiveUser, readDb, writeDb } from "@/lib/db/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const exportsList = db.exports.filter((e) => e.project_id === id);
  return NextResponse.json({ exports: exportsList });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { resolution?: ExportResolution };
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }

  const user = getActiveUser(db);
  const isFree = user.plan === "free";
  const resolution: ExportResolution = isFree ? "720p" : body.resolution ?? "1080p";
  const latestTimeline = db.timelines.filter((t) => t.project_id === id).sort((a, b) => b.version - a.version)[0];
  const scenes = db.scenes.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position);
  const firstVideo = scenes.find((s) => s.preview_url)?.preview_url ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  const now = new Date().toISOString();
  const exportRecord = {
    id: crypto.randomUUID(),
    project_id: id,
    timeline_version: latestTimeline?.version ?? 1,
    resolution,
    format: "mp4" as const,
    status: "complete" as const,
    watermarked: isFree,
    download_url: firstVideo,
    created_at: now,
    completed_at: now,
  };

  db.exports.unshift(exportRecord);
  project.status = "completed";
  project.current_step = "export";
  project.updated_at = now;
  writeDb(db);

  return NextResponse.json({ export: exportRecord }, { status: 201 });
}

