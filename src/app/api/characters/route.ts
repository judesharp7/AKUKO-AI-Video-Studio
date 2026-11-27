import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getActiveUser, readDb, writeDb } from "@/lib/db/store";

const CreateCharacterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  age: z.number().optional().nullable(),
  gender: z.string().optional().nullable(),
  appearance: z.string().min(3, "Appearance description is required"),
  clothing: z.string().default("Contemporary casual"),
  personality: z.string().default("Expressive and engaging"),
  voice_settings: z
    .object({
      voiceId: z.string(),
      voiceName: z.string(),
      accent: z.enum(["nigerian_english", "pidgin", "american", "british", "neutral"]),
      emotion: z.enum(["neutral", "warm", "dramatic", "energetic", "calm"]),
      speed: z.number().min(0.7).max(1.3),
    })
    .optional(),
});

export async function GET() {
  const db = readDb();
  const user = getActiveUser(db);
  const characters = db.characters.filter((c) => c.user_id === user.id);
  return NextResponse.json({ characters });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CreateCharacterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", userMessage: parsed.error.issues[0]?.message ?? "Invalid character data" } },
        { status: 400 }
      );
    }

    const db = readDb();
    const user = getActiveUser(db);
    const now = new Date().toISOString();

    const character = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: parsed.data.name,
      age: parsed.data.age ?? null,
      gender: parsed.data.gender ?? null,
      appearance: parsed.data.appearance,
      clothing: parsed.data.clothing,
      personality: parsed.data.personality,
      voice_id: parsed.data.voice_settings?.voiceId ?? "ng_amara",
      voice_settings: parsed.data.voice_settings ?? {
        voiceId: "ng_amara",
        voiceName: "Amara (Nigerian English)",
        accent: "nigerian_english" as const,
        emotion: "warm" as const,
        speed: 1.0,
      },
      reference_asset_ids: [],
      reference_urls: [],
      locked: false,
      consistency_thumbs_up: 0,
      consistency_total: 0,
      created_at: now,
      updated_at: now,
    };

    db.characters.unshift(character);
    writeDb(db);
    return NextResponse.json({ character }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", userMessage: "Failed to create character." } },
      { status: 500 }
    );
  }
}

