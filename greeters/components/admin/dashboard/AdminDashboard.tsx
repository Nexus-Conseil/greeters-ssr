import Link from "next/link";
import type { Route } from "next";
import { CheckCircle, FileText, FolderOpen, MessageSquare, Users } from "lucide-react";

const DASHBOARD_CARDS = [
  {
    key: "pages",
    title: "Pages du site",
    description: "Éditez les pages, suivez les contenus publiés et préparez les évolutions éditoriales.",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    key: "validations",
    title: "Validations",
    description: "Suivez les previews en attente et validez les soumissions avant publication.",
    href: "/admin/pending",
    icon: CheckCircle,
  },
  {
    key: "chatbot",
    title: "Chatbot",
    description: "Analysez les conversations, ajustez les consignes et mesurez l’impact des réponses générées.",
    href: "/admin/chatbot",
    icon: MessageSquare,
  },
  {
    key: "documents",
    title: "Documents",
    description: "Préparez la prochaine étape de parité SSR avec la gestion documentaire de référence CSR.",
    href: "/admin/documents",
    icon: FolderOpen,
  },
];

const QUICK_ACTIONS = [
  { href: "/admin/pages/new", title: "Nouvelle page", description: "Créer une nouvelle page", icon: FileText },
  { href: "/admin/menu", title: "Gérer le menu", description: "Modifier la navigation publique", icon: CheckCircle },
  { href: "/admin/users", title: "Utilisateurs", description: "Préparer la gestion des comptes", icon: Users },
];

export const AdminDashboard = () => {
  return (
    <main className="p-6 lg:p-8" data-testid="admin-dashboard-page">
      <section className="mb-8" data-testid="admin-dashboard-hero">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bc34a]" data-testid="admin-dashboard-eyebrow">
          Tableau de bord
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900" data-testid="admin-dashboard-title">
          Bonjour, le back-office SSR reprend maintenant le langage visuel de la version CSR.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600" data-testid="admin-dashboard-description">
          Utilisez cette coquille unifiée pour piloter le CMS, le chatbot, la navigation et les futurs modules de parité admin.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-testid="admin-dashboard-card-grid">
        {DASHBOARD_CARDS.map((card) => (
          <Link href={card.href as Route} className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md" key={card.key} data-testid={`admin-dashboard-card-${card.key}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500" data-testid={`admin-dashboard-card-label-${card.key}`}>{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700" data-testid={`admin-dashboard-card-description-${card.key}`}>{card.description}</p>
              </div>
              <div className="rounded-xl bg-[#8bc34a] p-3 text-white">
                <card.icon size={22} />
              </div>
            </div>
            <p className="mt-6 text-sm font-semibold text-[#5d8120]" data-testid={`admin-dashboard-card-link-${card.key}`}>
              Ouvrir le module
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-dashboard-actions-card">
        <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-dashboard-actions-title">
          Actions rapides
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href as Route}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#8bc34a] hover:bg-[#f6fbe9]"
              data-testid={`admin-dashboard-action-${action.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              <div className="rounded-xl bg-[#eef6dd] p-3 text-[#5d8120]">
                <action.icon size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{action.title}</p>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};