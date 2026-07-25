function publicSetting(name: string, developmentFallback: string) {
  const publicValues: Record<string, string | undefined> = {
    NEXT_PUBLIC_SINPE_NUMBER: process.env.NEXT_PUBLIC_SINPE_NUMBER,
    NEXT_PUBLIC_SINPE_HOLDER: process.env.NEXT_PUBLIC_SINPE_HOLDER,
    NEXT_PUBLIC_SINPE_INSTRUCTIONS: process.env.NEXT_PUBLIC_SINPE_INSTRUCTIONS,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  };
  const value = publicValues[name]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} es obligatoria en producción.`);
  }
  return developmentFallback;
}

export function sinpeSettings() {
  return {
    number: publicSetting("NEXT_PUBLIC_SINPE_NUMBER", "0000 0000"),
    holder: publicSetting("NEXT_PUBLIC_SINPE_HOLDER", "Titular SINPE"),
    instructions:
      publicSetting(
        "NEXT_PUBLIC_SINPE_INSTRUCTIONS",
        "Realiza el SINPE por el monto total y adjunta el comprobante.",
      ),
  };
}

export function whatsappSettings() {
  const number = publicSetting("NEXT_PUBLIC_WHATSAPP_NUMBER", "50600000000");
  return {
    number,
    display: number.startsWith("506") ? `+506 ${number.slice(3)}` : number,
    baseUrl: `https://wa.me/${number}`,
  };
}

export function whatsappUrl(message: string) {
  return `${whatsappSettings().baseUrl}?text=${encodeURIComponent(message)}`;
}
