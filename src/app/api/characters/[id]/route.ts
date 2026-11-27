import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const character = db.characters.find((c) => c.id === id);
  if (!character) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Character not found." } }, { status: 404 });
  }
  return NextResponse.json({ character });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = readDb();
  const idx = db.characters.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", userMessage: "Character not found." } }, { status: 404 });
  }
  if (db.characters[idx].locked && body.reference_urls) {
    return NextResponse.json(
      { error: { code: "CHARACTER_LOCKED", userMessage: "Unlock character before modifying reference images." } },
      { status: 400 }
    );
  }
  db.characters[idx] = { ...db.characters[idx], ...body, id, updated_at: new Date().toISOString() };
  writeDb(db);
  return NextResponse.json({ character: db.characters[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  db.characters = db.characters.filter((c) => c.id !== id);
  writeDb(db);
  return NextResponse.json({ deleted: true });
}

