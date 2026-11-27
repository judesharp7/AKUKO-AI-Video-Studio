import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    request_id?: string;
    provider_job_id?: string;
    status?: "complete" | "failed" | "blocked";
    output_url?: string;
  };

  const requestId = body.request_id || body.provider_job_id;
  if (!requestId) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  const db = readDb();
  const dedupeKey = `${provider}:${requestId}`;
  if (db.processedWebhooks.includes(dedupeKey)) {
    return NextResponse.json({ deduplicated: true });
  }

  db.processedWebhooks.push(dedupeKey);
  const take = db.takes.find((t) => t.provider_job_id === body.provider_job_id);
  if (take && body.status) {
    take.status = body.status;
    if (body.output_url) take.output_url = body.output_url;
    take.completed_at = new Date().toISOString();
  }
  writeDb(db);

  return NextResponse.json({ received: true, provider, requestId });
}

