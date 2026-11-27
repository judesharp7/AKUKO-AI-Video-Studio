import { NextRequest, NextResponse } from "next/server";
import { appendLedger, readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    eventId?: string;
    userId?: string;
    credits?: number;
    gateway?: "paystack" | "stripe" | "flutterwave";
  };

  if (!body.eventId || !body.userId || !body.credits) {
    return NextResponse.json({ error: "Missing required webhook fields" }, { status: 400 });
  }

  const db = readDb();
  const dedupeKey = `payment:${body.eventId}`;
  if (db.processedWebhooks.includes(dedupeKey)) {
    return NextResponse.json({ deduplicated: true });
  }

  db.processedWebhooks.push(dedupeKey);
  appendLedger(db, {
    user_id: body.userId,
    delta: body.credits,
    reason: "purchase",
    description: `${body.gateway ?? "stripe"} credit purchase`,
  });
  writeDb(db);

  return NextResponse.json({ processed: true });
}

