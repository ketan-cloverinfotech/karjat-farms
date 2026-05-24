import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Vercel / most serverless hosts have a read-only filesystem. Local disk uploads
// only work in dev. In prod, owners can paste image URLs (Cloudinary, Unsplash,
// Imgur, etc.) — the PhotoUpload component already supports that fallback.
// To enable real uploads in prod, swap in Vercel Blob / S3 / UploadThing here.
function isServerlessReadOnlyFs(): boolean {
  return Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (isServerlessReadOnlyFs()) {
    return NextResponse.json(
      {
        error:
          "File upload is disabled on this host. Paste an image URL instead (or configure Vercel Blob storage).",
      },
      { status: 501 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 5 MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP, or GIF allowed." },
      { status: 415 }
    );
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buf);

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
