import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

import { LoginForm } from "@/components/admin/auth/LoginForm";

export const metadata: Metadata = {
  title: "Connexion admin — Paris Greeters",
  robots: "noindex,nofollow",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : "/admin";
  const user = await getCurrentUser();

  if (user) {
    redirect(redirectTo as Route);
  }

  return <LoginForm redirectTo={redirectTo} />;
}