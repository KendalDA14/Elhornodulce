import { NextResponse } from "next/server";
import { assertSameOrigin, hashPassword, SameOriginError } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { clientIpFromHeaders, consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { readBoundedText, RequestBodyTooLargeError } from "@/lib/http-body";

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const MAX_REGISTER_ATTEMPTS = 5;
const MAX_REGISTER_ATTEMPTS_PER_IP = 12;
const MAX_AUTH_BODY_SIZE = 16 * 1024;

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
    name: formData.get("name") || "",
    password: formData.get("password") || "",
    confirm: formData.get("confirm") || "",
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
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const confirm = String(body.confirm || "");

    if (name.length < 2) {
      return NextResponse.json({ ok: false, message: "Indica tu nombre." }, { status: 400 });
    }
    if (name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) {
      return NextResponse.json({ ok: false, message: "Usa un nombre más corto." }, { status: 400 });
    }
    if (name.includes("@")) {
      return NextResponse.json({ ok: false, message: "Usa tu nombre sin correo electrónico." }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { ok: false, message: "La contraseña debe tener entre 8 y 128 caracteres." },
        { status: 400 },
      );
    }
    if (password !== confirm) {
      return NextResponse.json({ ok: false, message: "Las contraseñas no coinciden." }, { status: 400 });
    }
    const clientIp = clientIpFromHeaders(request.headers);
    if (
      !consumeRateLimit(
        rateLimitKey("register-ip", clientIp),
        MAX_REGISTER_ATTEMPTS_PER_IP,
        REGISTER_WINDOW_MS,
      ) ||
      !consumeRateLimit(
        rateLimitKey("register", `${clientIp}:${name}`),
        MAX_REGISTER_ATTEMPTS,
        REGISTER_WINDOW_MS,
      )
    ) {
      return NextResponse.json(
        { ok: false, message: "Demasiados intentos de registro. Espera unos minutos e intenta de nuevo." },
        { status: 429 },
      );
    }

    await getPrisma().customerUser.create({
      data: { name, passwordHash: await hashPassword(password) },
    });

    return NextResponse.json({
      ok: true,
      message: "Te has registrado con éxito. Ahora puedes iniciar sesión.",
    });
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

    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "Ese nombre ya está registrado. Prueba con otro." },
        { status: 409 },
      );
    }

    console.error("[auth/register]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "No se pudo crear la cuenta. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
