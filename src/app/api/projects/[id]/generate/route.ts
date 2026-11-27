import { NextRequest, NextResponse } from "next/server";
import { getActiveUser, readDb, writeDb } from "@/lib/db/store";
import { runSceneGeneration } from "@/lib/workflow/pipeline";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }

  const user = getActiveUser(db);
  const scenes = db.scenes.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position);

  for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].status !== "complete" && scenes[i].status !== "approved") {
      await runSceneGeneration(db, scenes[i], user.id, i > 0 ? scenes[i - 1] : undefined);
    }
  }

  project.current_step = "generate";
  project.status = "in_progress";
  project.updated_at = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ scenes, creditBalance: user.credit_balance });
}

