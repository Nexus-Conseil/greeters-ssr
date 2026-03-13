"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { CheckCircle, FileText, FolderOpen, Home, LayoutDashboard, LogOut, Menu, MessageSquare, Sparkles, Users } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/chatbot", label: "Chatbot", icon: MessageSquare },
  { href: "/admin/menu", label: "Menu", icon: Menu },
  { href: "/admin/ai-pages", label: "IA Pages", icon: Sparkles },
  { href: "/admin/pending", label: "Validations", icon: CheckCircle },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
];

type AdminSidebarProps = {
  userName: string;
  userRole: string;
  onLogout: () => void;
  loggingOut: boolean;
};

export const AdminSidebar = ({ userName, userRole, onLogout, loggingOut }: AdminSidebarProps) => {
  const pathname = usePathname();
  const initial = userName?.charAt(0)?.toUpperCase() || "G";

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex" data-testid="admin-sidebar">
      <div className="border-b border-slate-200 px-5 py-5" data-testid="admin-sidebar-brand-block">
        <Link href="/" className="inline-flex items-center" data-testid="admin-sidebar-home-link">
          <img src="/logo_greeters.png" alt="Paris Greeters" className="h-10 w-auto" data-testid="admin-sidebar-logo" />
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#7daa2f]" data-testid="admin-sidebar-eyebrow">Espace admin</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900" data-testid="admin-sidebar-title">Coquille éditoriale SSR</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500" data-testid="admin-sidebar-copy">Pages, chatbot, documents et workflow réunis dans une interface inspirée de la référence CSR.</p>
      </div>

      <nav className="flex-1 px-4 py-5" data-testid="admin-sidebar-navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href as Route}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-[#8bc34a] text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}
                  data-testid={`admin-sidebar-link-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                >
                  <Icon size={18} />
                  <span data-testid={`admin-sidebar-link-label-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 px-4 py-5" data-testid="admin-sidebar-user-block">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8bc34a] text-base font-semibold text-white" data-testid="admin-sidebar-user-initial">{initial}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900" data-testid="admin-sidebar-user-name">{userName}</p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500" data-testid="admin-sidebar-user-role">{userRole}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2" data-testid="admin-sidebar-actions">
          <Link href="/" className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100" data-testid="admin-sidebar-site-link">
            <Home size={16} />
            Voir le site
          </Link>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            onClick={onLogout}
            disabled={loggingOut}
            data-testid="admin-sidebar-logout-button"
          >
            <LogOut size={16} />
            {loggingOut ? "Déconnexion..." : "Quitter"}
          </button>
        </div>
      </div>
    </aside>
  );
};