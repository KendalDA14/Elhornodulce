import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clearAdminSession,
  clearCustomerSession,
  createAdminSession,
  createCustomerSession,
  SameOriginError,
  verifyPassword,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { flushPendingAdminPushNotifications } from "@/lib/push";
import { clearRateLimit, consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  return {
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  };
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const body = await readBody(request);
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return NextResponse.json({ ok: false, message: "Ingresa tu nombre y contraseña." }, { status: 400 });
    }
    const attemptKey = rateLimitKey("login", identifier);
    if (!consumeRateLimit(attemptKey, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
      return NextResponse.json(
        { ok: false, message: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
        { status: 429 },
      );
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
      clearRateLimit(attemptKey);

      return NextResponse.json({ ok: true, redirectTo: "/admin" });
    }

    const customer = await prisma.customerUser.findUnique({ where: { name: identifier } });
    if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
      return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
    }

    await clearAdminSession();
    await createCustomerSession(customer.id);
    clearRateLimit(attemptKey);

    return NextResponse.json({ ok: true, redirectTo: "/cuenta" });
  } catch (error) {
    if (error instanceof SameOriginError) {
      return NextResponse.json({ ok: false, message: "Solicitud no permitida." }, { status: 403 });
    }

    console.error("[auth/login]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo iniciar sesión. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
