import { NextRequest, NextResponse } from "next/server";
import { modelRegistry } from "@/lib/providers";
import { readDb, writeDb } from "@/lib/db/store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = readDb();
  const idx = db.scenes.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Scene not found." } }, { status: 404 });
  }

  if (typeof body.duration_seconds === "number") {
    const check = modelRegistry.validateSceneDuration(body.duration_seconds);
    if (!check.valid) {
      return NextResponse.json({ error: { code: "DURATION_LIMIT", userMessage: check.message } }, { status: 400 });
    }
  }

  db.scenes[idx] = {
    ...db.scenes[idx],
    ...body,
    id,
    updated_at: new Date().toISOString(),
  };
  writeDb(db);
  return NextResponse.json({ scene: db.scenes[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  db.scenes = db.scenes.filter((s) => s.id !== id);
  writeDb(db);
  return NextResponse.json({ deleted: true });
}

