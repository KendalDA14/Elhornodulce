import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const contentTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  await requireAdmin();
  const { path: parts } = await context.params;
  const safeParts = parts.filter((part) => /^[a-zA-Z0-9._-]+$/.test(part));
  if (safeParts.length !== parts.length) {
    return NextResponse.json({ error: "Archivo invalido." }, { status: 400 });
  }

  const root = path.resolve(process.cwd(), "private_uploads");
  const filePath = path.resolve(root, ...safeParts);
  if (!filePath.startsWith(root)) {
    return NextResponse.json({ error: "Archivo invalido." }, { status: 400 });
  }

  try {
    const bytes = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }
}
