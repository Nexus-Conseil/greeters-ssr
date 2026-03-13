"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

type LoginFormProps = {
  redirectTo: string;
};

export const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitLogin(attempt = 0) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const rawBody = await response.text();
    let detail = "Connexion impossible.";

    try {
      const parsed = JSON.parse(rawBody) as { detail?: string };
      detail = parsed.detail ?? detail;
    } catch {
      if (rawBody.trim()) {
        detail = rawBody.trim();
      }
    }

    if (!response.ok && response.status >= 500 && attempt === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      return submitLogin(1);
    }

    if (!response.ok) {
      throw new Error(detail);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await submitLogin();
      router.push((redirectTo || "/admin") as Route);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 lg:px-6" data-testid="admin-login-page">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]" data-testid="admin-login-panel">
        <div className="rounded-[32px] bg-[#111827] px-8 py-10 text-white shadow-xl">
          <img src="/logo_greeters.png" alt="Paris Greeters" className="h-12 w-auto rounded-md bg-white px-3 py-2" data-testid="admin-login-logo" />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#b9df74]" data-testid="admin-login-eyebrow">Référence CSR</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight" data-testid="admin-login-title">Connectez-vous pour piloter l’administration Greeters depuis la SSR.</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-200" data-testid="admin-login-description">Une seule coquille admin, des modules métier spécialisés, et une continuité visuelle alignée sur la version CSR validée.</p>
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm leading-7 text-slate-100">
            <p>• Gestion éditoriale centralisée</p>
            <p>• Sessions sécurisées côté serveur</p>
            <p>• Modules chatbot, pages, validations et futurs outils admin dans une interface unique</p>
          </div>
        </div>

        <form className="rounded-[32px] bg-white p-8 shadow-xl" onSubmit={handleSubmit} data-testid="admin-login-form">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7daa2f]">Connexion</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Espace administration</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">Entrez vos identifiants pour accéder au CMS, au chatbot admin et aux prochains modules de parité.</p>
          </div>

          <label className="mt-6 block" data-testid="admin-login-email-field">
            <span data-testid="admin-login-email-label">Email</span>
            <input
              data-testid="admin-login-email-input"
              type="email"
              autoComplete="email"
              placeholder="admin@greeters.paris"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>

          <label className="mt-5 block" data-testid="admin-login-password-field">
            <span data-testid="admin-login-password-label">Mot de passe</span>
            <div className="mt-2 flex rounded-xl border border-slate-200" data-testid="admin-login-password-row">
              <input
                data-testid="admin-login-password-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="min-w-0 flex-1 rounded-l-xl px-4 py-3 text-sm"
              />
              <button
                data-testid="admin-login-password-toggle"
                type="button"
                className="rounded-r-xl px-4 text-sm font-medium text-slate-600"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </label>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="admin-login-error-message">
              {error}
            </div>
          ) : null}

          <button
            data-testid="admin-login-submit-button"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#8bc34a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7daa2f]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
};