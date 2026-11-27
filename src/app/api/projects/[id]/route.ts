import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }
  const scenes = db.scenes.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position);
  return NextResponse.json({ project: { ...project, scene_count: scenes.length } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = readDb();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Project not found." } }, { status: 404 });
  }
  db.projects[idx] = {
    ...db.projects[idx],
    ...body,
    id,
    updated_at: new Date().toISOString(),
  };
  writeDb(db);
  return NextResponse.json({ project: db.projects[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.scenes = db.scenes.filter((s) => s.project_id !== id);
  db.scripts = db.scripts.filter((sc) => sc.project_id !== id);
  writeDb(db);
  return NextResponse.json({ deleted: true });
}

