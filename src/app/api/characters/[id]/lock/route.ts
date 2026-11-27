import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { locked?: boolean };
  const db = readDb();
  const char = db.characters.find((c) => c.id === id);
  if (!char) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Character not found." } }, { status: 404 });
  }

  const targetLocked = body.locked ?? !char.locked;
  if (targetLocked && char.reference_asset_ids.length < 2) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_REFS", userMessage: "Generate at least 2 reference images before locking character." } },
      { status: 400 }
    );
  }

  char.locked = targetLocked;
  char.updated_at = new Date().toISOString();
  writeDb(db);
  return NextResponse.json({ character: char });
}

