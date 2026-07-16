import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
  getPublicUploadRoot,
  imageContentType,
  resolveUploadPath,
} from "@/lib/upload-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;

  try {
    const filePath = resolveUploadPath(getPublicUploadRoot(), parts);
    const bytes = await readFile(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": imageContentType(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("inválida")) {
      return NextResponse.json({ error: "Archivo inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }
}
