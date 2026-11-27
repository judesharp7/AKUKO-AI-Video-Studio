import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getActiveUser, readDb, writeDb } from "@/lib/db/store";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(120),
  type: z.enum(["story", "tutorial", "advert", "documentary"]).default("story"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  target_duration_seconds: z.number().min(60).max(7200).default(1800),
});

export async function GET() {
  const db = readDb();
  const user = getActiveUser(db);
  const projects = db.projects
    .filter((p) => p.user_id === user.id)
    .map((p) => ({
      ...p,
      scene_count: db.scenes.filter((s) => s.project_id === p.id).length,
    }));
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CreateProjectSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", userMessage: parsed.error.issues[0]?.message ?? "Invalid project data" } },
        { status: 400 }
      );
    }

    const db = readDb();
    const user = getActiveUser(db);
    const now = new Date().toISOString();

    const project = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      aspect_ratio: parsed.data.aspect_ratio,
      target_duration_seconds: parsed.data.target_duration_seconds,
      style_bible: {
        visualStyle: "Cinematic 35mm film, warm natural lighting",
        colorPalette: "Deep slate, amber gold, rich contrast",
        lighting: "Soft directional key light",
      },
      status: "draft" as const,
      current_step: "characters" as const,
      scene_count: 0,
      created_at: now,
      updated_at: now,
    };

    db.projects.unshift(project);
    writeDb(db);

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", userMessage: "Could not create project." } },
      { status: 500 }
    );
  }
}

