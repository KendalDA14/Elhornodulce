import { existsSync } from "node:fs";
import { join } from "node:path";
import { getAdminSession, getCustomerSession } from "@/lib/auth";
import { PublicHeader } from "@/components/public/public-header";

export async function PublicHeaderShell({ promoOffset = false }: { promoOffset?: boolean }) {
  const [admin, customer] = await Promise.all([getAdminSession(), getCustomerSession()]);
  const logoCandidates = [
    { file: "logo.jpeg", src: "/brand/logo.jpeg" },
    { file: "logo.jpg", src: "/brand/logo.jpg" },
    { file: "logo.png", src: "/brand/logo.png" },
  ];
  const logoSrc =
    logoCandidates.find((candidate) =>
      existsSync(join(process.cwd(), "public", "brand", candidate.file)),
    )?.src || null;

  return (
    <PublicHeader
      isAdmin={Boolean(admin)}
      customerName={customer?.name || null}
      logoSrc={logoSrc}
      promoOffset={promoOffset}
    />
  );
}
