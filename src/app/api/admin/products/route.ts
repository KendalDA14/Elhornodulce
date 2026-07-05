import { NextResponse } from "next/server";
import { createProductAction } from "@/actions/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await createProductAction({ ok: false, message: "" }, formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el producto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
