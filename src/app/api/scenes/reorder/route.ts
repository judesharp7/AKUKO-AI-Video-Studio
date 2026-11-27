import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { sceneIds?: string[] };
  const ids = body.sceneIds ?? [];
  if (!ids.length) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", userMessage: "sceneIds array required" } }, { status: 400 });
  }

  const db = readDb();
  const now = new Date().toISOString();
  ids.forEach((sceneId, index) => {
    const scene = db.scenes.find((s) => s.id === sceneId);
    if (scene) {
      scene.position = (index + 1) * 1000;
      scene.updated_at = now;
    }
  });
  writeDb(db);
  return NextResponse.json({ reordered: true });
}

