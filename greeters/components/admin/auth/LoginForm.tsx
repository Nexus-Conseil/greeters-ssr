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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { detail?: string };

      if (!response.ok) {
        throw new Error(data.detail ?? "Connexion impossible.");
      }

      router.push((redirectTo || "/admin") as Route);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell" data-testid="admin-login-page">
      <section className="auth-panel" data-testid="admin-login-panel">
        <div className="auth-heading-group">
          <p className="eyebrow" data-testid="admin-login-eyebrow">
            Espace administration
          </p>
          <h1 className="auth-title" data-testid="admin-login-title">
            Connectez-vous pour piloter la migration Greeters.
          </h1>
          <p className="auth-copy" data-testid="admin-login-description">
            La session est maintenant sécurisée côté serveur avec cookie HTTP-only et contrôle d’accès sur les routes admin.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} data-testid="admin-login-form">
          <label className="auth-field" data-testid="admin-login-email-field">
            <span data-testid="admin-login-email-label">Email</span>
            <input
              data-testid="admin-login-email-input"
              type="email"
              autoComplete="email"
              placeholder="admin@greeters.paris"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-field" data-testid="admin-login-password-field">
            <span data-testid="admin-login-password-label">Mot de passe</span>
            <div className="password-row" data-testid="admin-login-password-row">
              <input
                data-testid="admin-login-password-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                data-testid="admin-login-password-toggle"
                type="button"
                className="ghost-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </label>

          {error ? (
            <div className="auth-error" data-testid="admin-login-error-message">
              {error}
            </div>
          ) : null}

          <button
            data-testid="admin-login-submit-button"
            className="primary-button"
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