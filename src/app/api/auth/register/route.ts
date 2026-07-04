import { NextResponse } from "next/server";
import { assertSameOrigin, hashPassword } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  return {
    name: formData.get("name"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  };
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const body = await readBody(request);
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const confirm = String(body.confirm || "");

    if (name.length < 2) {
      return NextResponse.json({ ok: false, message: "Indica tu nombre." }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ ok: false, message: "Usa un nombre más corto." }, { status: 400 });
    }
    if (name.includes("@")) {
      return NextResponse.json({ ok: false, message: "Usa tu nombre sin correo electrónico." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, message: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }
    if (password !== confirm) {
      return NextResponse.json({ ok: false, message: "Las contraseñas no coinciden." }, { status: 400 });
    }

    await getPrisma().customerUser.create({
      data: { name, passwordHash: await hashPassword(password) },
    });

    return NextResponse.json({
      ok: true,
      message: "Te has registrado con éxito. Ahora puedes iniciar sesión.",
    });
  } catch (error) {
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
