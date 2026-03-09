import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

import { LoginForm } from "@/components/admin/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : "/admin";

  return <LoginForm redirectTo={redirectTo} />;
}