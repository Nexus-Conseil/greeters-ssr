import { redirect } from "next/navigation";

import { getAuthenticatedSession } from "./session";

export async function getCurrentUser() {
  const session = await getAuthenticatedSession();
  return session?.user ?? null;
}

export async function requireCurrentUser() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session.user;
}