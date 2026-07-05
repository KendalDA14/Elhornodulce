import { NextResponse } from "next/server";
import { updateProductAction } from "@/actions/admin";
import { assertSameOrigin, getAdminSession } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin();
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ ok: false, message: "Sesión de administrador requerida." }, { status: 401 });
    }

    const { id } = await context.params;
    const formData = await request.formData();
    formData.set("id", id);
    const result = await updateProductAction({ ok: false, message: "" }, formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el producto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
