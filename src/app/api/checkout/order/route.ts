import { NextResponse } from "next/server";
import {
  createOrderAction,
  createSinpeOrderWhatsappAction,
  createSinpeOrderWithProofAction,
} from "@/actions/public";

export async function POST(request: Request) {
  try {
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
    console.error("[checkout/order]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el pedido. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
