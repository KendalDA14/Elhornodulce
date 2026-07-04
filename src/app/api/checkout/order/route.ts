import { NextResponse } from "next/server";
import {
  createOrderAction,
  createSinpeOrderWhatsappAction,
  createSinpeOrderWithProofAction,
} from "@/actions/public";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { ok: false, message: "La solicitud del pedido no es válida." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const intent = String(formData.get("intent") || "cash");
    formData.delete("intent");

    const result =
      intent === "sinpe-proof"
        ? await createSinpeOrderWithProofAction(formData)
        : intent === "sinpe-whatsapp"
          ? await createSinpeOrderWhatsappAction(formData)
          : await createOrderAction(formData);

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pedido.";
    console.error("[checkout/order]", message);
    return NextResponse.json(
      { ok: false, message },
      { status: 400 },
    );
  }
}
