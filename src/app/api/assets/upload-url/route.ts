import { NextRequest, NextResponse } from "next/server";
import { createSignedUploadUrl } from "@/lib/storage/r2";
import { getActiveUser, readDb } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { filename?: string; contentType?: string };
  const db = readDb();
  const user = getActiveUser(db);
  const signed = createSignedUploadUrl(user.id, body.filename || "asset.bin", body.contentType || "application/octet-stream");
  return NextResponse.json(signed);
}

