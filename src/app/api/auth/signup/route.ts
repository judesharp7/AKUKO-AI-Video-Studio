import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isDisposableEmail } from "@/lib/providers/moderation";
import { appendLedger, readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; name?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: { code: "INVALID_EMAIL", userMessage: "Please enter a valid email address." } },
        { status: 400 }
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: "DISPOSABLE_EMAIL_BLOCKED",
            userMessage: "Disposable email addresses are not permitted. Please use a permanent email address.",
          },
        },
        { status: 400 }
      );
    }

    const db = readDb();
    const existing = db.users.find((u) => u.email === email);
    if (existing) {
      return NextResponse.json({ user: existing, message: "Signed in to existing account." });
    }

    const now = new Date().toISOString();
    const newUser = {
      id: crypto.randomUUID(),
      email,
      name: body.name?.trim() || email.split("@")[0],
      plan: "free" as const,
      credit_balance: 0,
      email_verified: false,
      created_at: now,
      updated_at: now,
    };

    db.users.push(newUser);
    appendLedger(db, {
      user_id: newUser.id,
      delta: 50,
      reason: "bonus",
      description: "Free Tier Welcome Bonus",
    });
    writeDb(db);

    return NextResponse.json({ user: newUser, verificationRequired: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SIGNUP_FAILED", userMessage: "Unable to create account right now." } },
      { status: 500 }
    );
  }
}

