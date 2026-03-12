"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section className="py-12" data-testid="contact-page-content">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-gray-50 rounded-lg p-6 mb-8" data-testid="contact-page-intro-panel">
          <p className="text-gray-700 leading-relaxed">{introText}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="contact-page-form-wrapper">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center justify-center gap-2" data-testid="contact-page-form-title">
            <Mail className="w-5 h-5 text-[#558b2f]" />
            Formulaire de contact
          </h3>

          <form onSubmit={handleSubmit} data-testid="contact-page-form">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Colonne gauche : Nom, Email, Sujet */}
              <div className="space-y-4 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact-name">Nom</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8bc34a]"
                    data-testid="contact-page-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8bc34a]"
                    data-testid="contact-page-email-input"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact-subject">Sujet</label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8bc34a]"
                    data-testid="contact-page-subject-input"
                  />
                </div>
              </div>

              {/* Colonne droite : Message + Bouton */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full flex-1 min-h-[140px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8bc34a] resize-none"
                  data-testid="contact-page-message-input"
                />
                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#558b2f] hover:bg-[#33691e] text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-md transition-colors"
                    data-testid="contact-page-submit-button"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {feedback?.type === "success" && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2 text-green-700" data-testid="contact-page-feedback-success">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feedback.message}</span>
              </div>
            )}

            {feedback?.type === "error" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-700" data-testid="contact-page-feedback-error">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feedback.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
