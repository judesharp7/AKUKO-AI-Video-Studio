import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb } from "@/lib/db/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const scripts = db.scripts.filter((s) => s.project_id === id).sort((a, b) => b.version - a.version);
  return NextResponse.json({ scripts, latest: scripts[0] ?? null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { story_json?: unknown; script_text?: string };
  const db = readDb();
  const existing = db.scripts.filter((s) => s.project_id === id);
  const nextVersion = existing.reduce((max, s) => Math.max(max, s.version), 0) + 1;

  const record = {
    id: crypto.randomUUID(),
    project_id: id,
    version: nextVersion,
    story_json: (body.story_json as never) ?? existing[0]?.story_json ?? null,
    script_text: body.script_text ?? existing[0]?.script_text ?? "",
    created_at: new Date().toISOString(),
  };

  db.scripts.unshift(record);
  writeDb(db);
  return NextResponse.json({ script: record }, { status: 201 });
}

