import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { uploadBlobFile } from "@/lib/blob";

const allowedKinds = new Set(["products", "site", "custom-requests"]);

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
  } catch {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido." }, { status: 400 });
  }
  if (!allowedKinds.has(kind)) {
    return NextResponse.json({ error: "Tipo de carga no permitido." }, { status: 400 });
  }

  try {
    const uploaded = await uploadBlobFile(file, kind);
    return NextResponse.json(uploaded);
  } catch {
    return NextResponse.json({ error: "No se pudo subir el archivo." }, { status: 400 });
  }
}
