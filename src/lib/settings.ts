export function sinpeSettings() {
  return {
    number: process.env.NEXT_PUBLIC_SINPE_NUMBER || "7010 4855",
    holder: process.env.NEXT_PUBLIC_SINPE_HOLDER || "Anahi Quesada Zuniga",
    instructions:
      process.env.NEXT_PUBLIC_SINPE_INSTRUCTIONS ||
      "Realiza el SINPE por el monto total y sube el comprobante o envialo por WhatsApp.",
  };
}

export function whatsappSettings() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50670104855";
  return {
    number,
    display: "+506 7010 4855",
    baseUrl: `https://wa.me/${number}`,
  };
}

export function whatsappUrl(message: string) {
  return `${whatsappSettings().baseUrl}?text=${encodeURIComponent(message)}`;
}
