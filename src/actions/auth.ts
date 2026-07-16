"use server";

import { redirect } from "next/navigation";
import { assertSameOrigin, clearAdminSession } from "@/lib/auth";

export async function logoutAdminAction() {
  await assertSameOrigin();
  await clearAdminSession();
  redirect("/login");
}
