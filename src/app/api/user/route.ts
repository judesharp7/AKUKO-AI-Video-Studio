import { NextRequest, NextResponse } from "next/server";
import { appendLedger, getActiveUser, readDb, writeDb } from "@/lib/db/store";

export async function GET() {
  const db = readDb();
  const user = getActiveUser(db);
  const ledger = db.credit_ledger.filter((e) => e.user_id === user.id).slice(0, 25);
  return NextResponse.json({ user, ledger });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { action?: string; credits?: number; plan?: "free" | "creator" | "studio"; name?: string };
  const db = readDb();
  const user = getActiveUser(db);

  if (body.action === "purchase" && typeof body.credits === "number" && body.credits > 0) {
    appendLedger(db, {
      user_id: user.id,
      delta: body.credits,
      reason: "purchase",
      description: `Purchased ${body.credits} Studio Credits`,
    });
    if (user.plan === "free") user.plan = "creator";
  }

  if (body.plan) {
    user.plan = body.plan;
  }
  if (body.name) {
    user.name = body.name;
  }
  user.updated_at = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ user });
}

