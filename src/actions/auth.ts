"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  clearCustomerSession,
  assertSameOrigin,
  createAdminSession,
  createCustomerSession,
  verifyPassword,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { flushPendingAdminPushNotifications } from "@/lib/push";

export type LoginState = {
  error?: string;
};

const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

function loginKey(identifier: string) {
  return identifier.toLowerCase().slice(0, 120);
}

function isLoginBlocked(identifier: string) {
  const entry = loginAttempts.get(loginKey(identifier));
  return Boolean(entry && entry.count >= MAX_LOGIN_ATTEMPTS && entry.blockedUntil > Date.now());
}

function recordLoginFailure(identifier: string) {
  const key = loginKey(identifier);
  const current = loginAttempts.get(key);
  const count = current && current.blockedUntil > Date.now() ? current.count + 1 : 1;
  loginAttempts.set(key, {
    count,
    blockedUntil: Date.now() + LOGIN_WINDOW_MS,
  });
}

function clearLoginFailures(identifier: string) {
  loginAttempts.delete(loginKey(identifier));
}

export async function loginUnifiedAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  await assertSameOrigin();
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");
  let redirectTo: "/admin" | "/cuenta" | null = null;

  if (!identifier || !password) {
    return { error: "Ingresa tu nombre y contraseña." };
  }
  if (isLoginBlocked(identifier)) {
    return { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
  }

  try {
    const prisma = getPrisma();

    if (identifier.includes("@")) {
      const email = identifier.toLowerCase();
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      if (!admin || !admin.isActive) {
        recordLoginFailure(identifier);
        return { error: "Credenciales inválidas." };
      }

      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) {
        recordLoginFailure(identifier);
        return { error: "Credenciales inválidas." };
      }

      await clearCustomerSession();
      await createAdminSession(admin.id);
      await flushPendingAdminPushNotifications().catch(() => undefined);
      clearLoginFailures(identifier);
      redirectTo = "/admin";
    } else {
      const customer = await prisma.customerUser.findUnique({ where: { name: identifier } });
      if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
        recordLoginFailure(identifier);
        return { error: "Credenciales inválidas." };
      }

      await clearAdminSession();
      await createCustomerSession(customer.id);
      clearLoginFailures(identifier);
      redirectTo = "/cuenta";
    }
  } catch {
    return { error: "No se pudo conectar con la base de datos." };
  }

  if (redirectTo) redirect(redirectTo);
  return { error: "Credenciales inválidas." };
}

export async function logoutAdminAction() {
  await assertSameOrigin();
  await clearAdminSession();
  redirect("/login");
}
