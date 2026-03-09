"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/ai-pages", label: "IA Pages" },
  { href: "/admin/pending", label: "Validations" },
];

type AdminSidebarProps = {
  userName: string;
  userRole: string;
  onLogout: () => void;
  loggingOut: boolean;
};

export const AdminSidebar = ({ userName, userRole, onLogout, loggingOut }: AdminSidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar" data-testid="admin-sidebar">
      <div className="dashboard-sidebar-block" data-testid="admin-sidebar-brand-block">
        <p className="eyebrow" data-testid="admin-sidebar-eyebrow">
          Greeters CMS
        </p>
        <h2 className="dashboard-sidebar-title" data-testid="admin-sidebar-title">
          Shell admin Next.js
        </h2>
        <p className="dashboard-sidebar-copy" data-testid="admin-sidebar-copy">
          Navigation prête pour le portage progressif du CMS métier.
        </p>
      </div>

      <nav className="dashboard-nav" data-testid="admin-sidebar-navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={`dashboard-nav-link${active ? " is-active" : ""}`}
              data-testid={`admin-sidebar-link-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              <span data-testid={`admin-sidebar-link-label-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-sidebar-block" data-testid="admin-sidebar-user-block">
        <p className="status-label" data-testid="admin-sidebar-user-label">
          Session
        </p>
        <h3 className="dashboard-user-name" data-testid="admin-sidebar-user-name">
          {userName}
        </h3>
        <p className="dashboard-user-role" data-testid="admin-sidebar-user-role">
          {userRole}
        </p>

        <div className="dashboard-sidebar-actions" data-testid="admin-sidebar-actions">
          <Link href="/" className="secondary-button dashboard-inline-button" data-testid="admin-sidebar-site-link">
            Voir le site
          </Link>
          <button
            type="button"
            className="primary-button dashboard-inline-button"
            onClick={onLogout}
            disabled={loggingOut}
            data-testid="admin-sidebar-logout-button"
          >
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>
    </aside>
  );
};