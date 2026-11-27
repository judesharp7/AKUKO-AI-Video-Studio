import { NextRequest, NextResponse } from "next/server";
import { getActiveUser, readDb, writeDb } from "@/lib/db/store";
import { runSceneGeneration } from "@/lib/workflow/pipeline";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const scene = db.scenes.find((s) => s.id === id);
  if (!scene) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Scene not found." } }, { status: 404 });
  }

  const user = getActiveUser(db);
  const projectScenes = db.scenes.filter((s) => s.project_id === scene.project_id).sort((a, b) => a.position - b.position);
  const idx = projectScenes.findIndex((s) => s.id === scene.id);
  const prevScene = idx > 0 ? projectScenes[idx - 1] : undefined;

  const result = await runSceneGeneration(db, scene, user.id, prevScene);
  writeDb(db);

  return NextResponse.json({ scene: result.scene, takeId: result.takeId, creditBalance: user.credit_balance });
}

