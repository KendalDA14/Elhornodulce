import { NextResponse } from "next/server";
import { updateProductAction } from "@/actions/admin";
import { assertSameOrigin, getAdminSession, SameOriginError } from "@/lib/auth";
import { readBoundedFormData, RequestBodyTooLargeError } from "@/lib/http-body";

const MAX_PRODUCT_BODY_BYTES = 32 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin();
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ ok: false, message: "Sesión de administrador requerida." }, { status: 401 });
    }

    const { id } = await context.params;
    const formData = await readBoundedFormData(request, MAX_PRODUCT_BODY_BYTES);
    formData.set("id", id);
    const result = await updateProductAction({ ok: false, message: "" }, formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { ok: false, message: "Las imágenes seleccionadas superan el tamaño permitido." },
        { status: 413 },
      );
    }
    if (error instanceof SameOriginError) {
      return NextResponse.json({ ok: false, message: "Solicitud no permitida." }, { status: 403 });
    }

    console.error("[admin/products/update]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo guardar el producto." },
      { status: 500 },
    );
  }
}
