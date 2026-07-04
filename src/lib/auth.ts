import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

const COOKIE_NAME = "horno_admin_session";
const CUSTOMER_COOKIE_NAME = "horno_customer_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;
const CUSTOMER_SESSION_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres en produccion.");
  }

  return new TextEncoder().encode(secret || "dev-secret-change-before-production");
}

function shouldUseSecureCookies() {
  const configured = process.env.AUTH_COOKIE_SECURE;
  if (configured === "true") return true;
  if (configured === "false") return false;

  return process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true;
}

export async function assertSameOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (!origin) return;

  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  if (!host) throw new Error("Solicitud invalida.");

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("Solicitud invalida.");
  }

  if (originHost !== host) {
    throw new Error("Solicitud no permitida.");
  }
}

export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const adminId = payload.adminId;
    if (typeof adminId !== "string") return null;

    const admin = await getPrisma().adminUser.findFirst({
      where: { id: adminId, isActive: true },
      select: { id: true, email: true, name: true },
    });

    return admin;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) redirect("/login");
  return admin;
}

export async function requireAdminAction() {
  await assertSameOrigin();
  return requireAdmin();
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function createCustomerSession(customerId: string) {
  const token = await new SignJWT({ customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: CUSTOMER_SESSION_SECONDS,
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_COOKIE_NAME);
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const customerId = payload.customerId;
    if (typeof customerId !== "string") return null;

    return getPrisma().customerUser.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    });
  } catch {
    return null;
  }
}
