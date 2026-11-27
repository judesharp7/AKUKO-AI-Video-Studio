import crypto from "crypto";

export interface SignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT
  );
}

export function createSignedUploadUrl(userId: string, filename: string, contentType: string): SignedUrlResult {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `users/${userId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${cleanName}`;
  const expiresInSeconds = 900; // 15 minutes

  if (isR2Configured()) {
    const endpoint = process.env.R2_ENDPOINT!.replace(/\/$/, "");
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicUrl = `${endpoint}/${bucket}/${storageKey}`;
    return {
      uploadUrl: `${publicUrl}?X-Amz-Expires=${expiresInSeconds}&content-type=${encodeURIComponent(contentType)}`,
      publicUrl,
      storageKey,
      expiresInSeconds,
    };
  }

  return {
    uploadUrl: `/api/assets/upload-url?key=${encodeURIComponent(storageKey)}`,
    publicUrl: `/api/assets/download?key=${encodeURIComponent(storageKey)}`,
    storageKey,
    expiresInSeconds,
  };
}

