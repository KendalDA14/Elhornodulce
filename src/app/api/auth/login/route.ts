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
import {
  clearRateLimit,
  clientIpFromHeaders,
  consumeRateLimit,
  rateLimitKey,
} from "@/lib/rate-limit";
import { readBoundedText, RequestBodyTooLargeError } from "@/lib/http-body";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const MAX_LOGIN_ATTEMPTS_PER_IP = 40;
const MAX_LOGIN_ATTEMPTS_PER_ACCOUNT = 20;
const MAX_AUTH_BODY_SIZE = 16 * 1024;
const DUMMY_PASSWORD_HASH = "$2b$12$/qaeOLnO4GteXCeg4q2T.uaD4kOlBbCW1MQMMdDJMuwfv6SBNF8.C";

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const rawBody = await readBoundedText(request, MAX_AUTH_BODY_SIZE);

  if (contentType.includes("application/json")) {
    const body = JSON.parse(rawBody) as unknown;
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  }

  if (!contentType.includes("application/x-www-form-urlencoded")) {
    throw new TypeError("AUTH_CONTENT_TYPE");
  }

  const formData = new URLSearchParams(rawBody);
  return {
    identifier: formData.get("identifier") || "",
    password: formData.get("password") || "",
  };
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_AUTH_BODY_SIZE) {
      return NextResponse.json({ ok: false, message: "La solicitud es demasiado grande." }, { status: 413 });
    }

    const body = await readBody(request);
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password || identifier.length > 191 || password.length > 128) {
      return NextResponse.json({ ok: false, message: "Ingresa tu nombre y contraseña." }, { status: 400 });
    }
    const clientIp = clientIpFromHeaders(request.headers);
    const attemptKey = rateLimitKey("login", `${clientIp}:${identifier}`);
    const ipAttemptKey = rateLimitKey("login-ip", clientIp);
    const accountAttemptKey = rateLimitKey("login-account", identifier);
    if (!consumeRateLimit(ipAttemptKey, MAX_LOGIN_ATTEMPTS_PER_IP, LOGIN_WINDOW_MS)) {
      return NextResponse.json(
        { ok: false, message: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
        { status: 429 },
      );
    }
    if (!consumeRateLimit(attemptKey, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
      return NextResponse.json(
        { ok: false, message: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
        { status: 429 },
      );
    }
    if (!consumeRateLimit(accountAttemptKey, MAX_LOGIN_ATTEMPTS_PER_ACCOUNT, LOGIN_WINDOW_MS)) {
      return NextResponse.json(
        { ok: false, message: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
        { status: 429 },
      );
    }

    const prisma = getPrisma();

    if (identifier.includes("@")) {
      const email = identifier.toLowerCase();
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      const passwordMatches = await verifyPassword(password, admin?.passwordHash || DUMMY_PASSWORD_HASH);

      if (!admin || !admin.isActive || !passwordMatches) {
        return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
      }

      await clearCustomerSession();
      await createAdminSession(admin.id, admin.updatedAt.getTime());
      await flushPendingAdminPushNotifications().catch(() => undefined);
      clearRateLimit(attemptKey);
      clearRateLimit(accountAttemptKey);

      return NextResponse.json({ ok: true, redirectTo: "/admin" });
    }

    const customer = await prisma.customerUser.findUnique({ where: { name: identifier } });
    const passwordMatches = await verifyPassword(password, customer?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!customer || !passwordMatches) {
      return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
    }

    await clearAdminSession();
    await createCustomerSession(customer.id);
    clearRateLimit(attemptKey);
    clearRateLimit(accountAttemptKey);

    return NextResponse.json({ ok: true, redirectTo: "/cuenta" });
  } catch (error) {
    if (error instanceof SameOriginError) {
      return NextResponse.json({ ok: false, message: "Solicitud no permitida." }, { status: 403 });
    }
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ ok: false, message: "La solicitud es demasiado grande." }, { status: 413 });
    }
    if (
      (error instanceof TypeError && error.message === "AUTH_CONTENT_TYPE") ||
      error instanceof SyntaxError
    ) {
      return NextResponse.json({ ok: false, message: "La solicitud no es válida." }, { status: 400 });
    }

    console.error("[auth/login]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo iniciar sesión. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
