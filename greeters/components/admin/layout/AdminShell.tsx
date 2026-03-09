"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AdminSidebar } from "./AdminSidebar";

type MeResponse = {
  name: string;
  role: string;
};

export const AdminShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session indisponible.");
        }

        return (await response.json()) as MeResponse;
      })
      .then((payload) => {
        if (active) {
          setUser(payload);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-shell" data-testid="admin-shell-layout">
      <AdminSidebar
        userName={user?.name ?? (loading ? "Chargement..." : "Session protégée")}
        userRole={user?.role ?? (loading ? "Connexion en cours" : "Accès restreint")}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <div className="dashboard-main" data-testid="admin-shell-main">
        {children}
      </div>
    </div>
  );
};