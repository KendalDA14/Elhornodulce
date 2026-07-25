import { NextResponse } from "next/server";
import {
  createOrderAction,
  createSinpeOrderWhatsappAction,
  createSinpeOrderWithProofAction,
} from "@/actions/public";
import { SameOriginError } from "@/lib/auth";
import { readBoundedFormData, RequestBodyTooLargeError } from "@/lib/http-body";

const MAX_CHECKOUT_BODY_BYTES = 6 * 1024 * 1024;
const checkoutIntents = new Set(["cash", "sinpe-proof", "sinpe-whatsapp"]);

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { ok: false, message: "La solicitud del pedido no es válida." },
        { status: 400 },
      );
    }

    const formData = await readBoundedFormData(request, MAX_CHECKOUT_BODY_BYTES);
    const intent = String(formData.get("intent") || "");
    if (!checkoutIntents.has(intent)) {
      return NextResponse.json(
        { ok: false, message: "La forma de confirmar el pedido no es válida." },
        { status: 400 },
      );
    }
    formData.delete("intent");

    const result =
      intent === "sinpe-proof"
        ? await createSinpeOrderWithProofAction(formData)
        : intent === "sinpe-whatsapp"
          ? await createSinpeOrderWhatsappAction(formData)
          : await createOrderAction(formData);

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { ok: false, message: "El comprobante supera el tamaño permitido." },
        { status: 413 },
      );
    }
    if (error instanceof SameOriginError) {
      return NextResponse.json({ ok: false, message: "Solicitud no permitida." }, { status: 403 });
    }

    console.error("[checkout/order]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el pedido. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
