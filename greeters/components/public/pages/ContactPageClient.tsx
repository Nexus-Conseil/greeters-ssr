"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export const ContactPageClient = ({ introText }: { introText: string }) => {
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/contact/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { message?: string; detail?: string };

      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Une erreur est survenue.");
      }

      setFeedback({ type: "success", message: data.message ?? "Votre message a bien été envoyé." });
      setFormData(INITIAL_STATE);
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Impossible d'envoyer votre message." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site-content-shell-narrow site-content-section" data-testid="contact-page-content">
      <div className="site-info-panel" data-testid="contact-page-intro-panel">
        {introText}
      </div>

      <form className="site-contact-form" onSubmit={handleSubmit} data-testid="contact-page-form">
        <h2 className="site-contact-form-title" data-testid="contact-page-form-title">
          <span className="site-contact-form-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2v.5l9 5.63 9-5.63V7l-9 5.63L3 7.01Zm18 10V9.84l-8.47 5.3a1 1 0 0 1-1.06 0L3 9.84V17h18Z" fill="currentColor" />
            </svg>
          </span>
          Formulaire de contact
        </h2>
        <div className="site-contact-grid">
          <div className="site-contact-column">
            <label className="site-field-label" htmlFor="contact-name">Nom</label>
            <input id="contact-name" name="name" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} className="site-field-input" data-testid="contact-page-name-input" required />

            <label className="site-field-label" htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" name="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} className="site-field-input" data-testid="contact-page-email-input" required />

            <label className="site-field-label" htmlFor="contact-subject">Sujet</label>
            <input id="contact-subject" name="subject" value={formData.subject} onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))} className="site-field-input" data-testid="contact-page-subject-input" required />
          </div>

          <div className="site-contact-column">
            <label className="site-field-label" htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" value={formData.message} onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))} className="site-field-textarea" data-testid="contact-page-message-input" required />
            <button type="submit" className="site-cta-button site-contact-submit site-glow-button" disabled={submitting} data-testid="contact-page-submit-button">
              <span className="site-glow-button-label">{submitting ? "Envoi en cours..." : "Envoyer"}</span>
            </button>
          </div>
        </div>

        {feedback ? (
          <div className={`site-feedback-banner is-${feedback.type}`} data-testid={`contact-page-feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        ) : null}
      </form>
    </div>
  );
};