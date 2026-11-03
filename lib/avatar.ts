import "server-only";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

const MAX = 2 * 1024 * 1024;

function detect(b: Buffer) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b.subarray(0, 4).toString("hex") === "89504e47") return { ext: "png", type: "image/png" };
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

export async function uploadAvatar(file: FormDataEntryValue | null): Promise<{ url: string | null; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return { url: null };
  if (file.size > MAX) return { url: null, error: "Photo must be smaller than 2 MB" };
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detect(buf); // checks the real file bytes, not just the name
  if (!kind) return { url: null, error: "Photo must be a JPG, PNG or WebP image" };
  try {
    const blob = await put(`avatars/${randomUUID()}.${kind.ext}`, buf, { access: "public", contentType: kind.type });
    return { url: blob.url };
  } catch {
    return { url: null, error: "Photo upload failed. Check BLOB_READ_WRITE_TOKEN." };
  }
}

export async function deleteAvatar(url?: string | null) {
  if (!url) return;
  try {
    await del(url);
  } catch {
    // ignore: the file may already be gone
  }
}