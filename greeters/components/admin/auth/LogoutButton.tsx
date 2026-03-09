"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const LogoutButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="secondary-button"
      onClick={handleLogout}
      disabled={loading}
      data-testid="admin-logout-button"
    >
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
};