import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { imageProvider } from "@/lib/providers";
import { readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { count?: number; regenerateIndex?: number };
  const db = readDb();
  const idx = db.characters.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Character not found." } }, { status: 404 });
  }

  const char = db.characters[idx];
  if (char.locked) {
    return NextResponse.json(
      { error: { code: "CHARACTER_LOCKED", userMessage: "Character is locked. Unlock to regenerate references." } },
      { status: 400 }
    );
  }

  const prompt = `${char.name}, ${char.age ?? 28}yo ${char.gender ?? ""}, ${char.appearance}, wearing ${char.clothing}`;

  if (typeof body.regenerateIndex === "number" && char.reference_urls && char.reference_urls[body.regenerateIndex]) {
    const res = await imageProvider.generateImage({ prompt: `${prompt} (variant ${Date.now() % 100})`, count: 2 });
    const updatedUrls = [...char.reference_urls];
    updatedUrls[body.regenerateIndex] = res.imageUrls[0];
    char.reference_urls = updatedUrls;
  } else {
    const count = Math.min(Math.max(body.count ?? 4, 2), 6);
    const res = await imageProvider.generateImage({ prompt, count });
    char.reference_urls = res.imageUrls;
    char.reference_asset_ids = res.imageUrls.map(() => crypto.randomUUID());
  }

  char.updated_at = new Date().toISOString();
  writeDb(db);
  return NextResponse.json({ character: char });
}

