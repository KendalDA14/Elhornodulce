import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clearAdminSession,
  clearCustomerSession,
  createAdminSession,
  createCustomerSession,
  verifyPassword,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { flushPendingAdminPushNotifications } from "@/lib/push";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return NextResponse.json({ ok: false, message: "Ingresa tu nombre y contraseña." }, { status: 400 });
    }

    const prisma = getPrisma();

    if (identifier.includes("@")) {
      const email = identifier.toLowerCase();
      const admin = await prisma.adminUser.findUnique({ where: { email } });

      if (!admin || !admin.isActive || !(await verifyPassword(password, admin.passwordHash))) {
        return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
      }

      await clearCustomerSession();
      await createAdminSession(admin.id);
      await flushPendingAdminPushNotifications().catch(() => undefined);

      return NextResponse.json({ ok: true, redirectTo: "/admin" });
    }

    const customer = await prisma.customerUser.findUnique({ where: { name: identifier } });
    if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
      return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
    }

    await clearAdminSession();
    await createCustomerSession(customer.id);

    return NextResponse.json({ ok: true, redirectTo: "/cuenta" });
  } catch (error) {
    console.error("[auth/login]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo iniciar sesión. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
