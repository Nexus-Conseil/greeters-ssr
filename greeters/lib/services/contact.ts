import sgMail, { type MailDataRequired } from "@sendgrid/mail";

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export class ContactServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ContactServiceError";
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getContactConfig() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const toEmail = process.env.SENDGRID_TO_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    throw new ContactServiceError(
      500,
      "La configuration email du formulaire de contact est incomplète.",
    );
  }

  return { apiKey, fromEmail, toEmail };
}

function buildContactMail(payload: ContactPayload, fromEmail: string, toEmail: string): MailDataRequired {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");

  return {
    to: toEmail,
    from: {
      email: fromEmail,
      name: "Paris Greeters",
    },
    replyTo: {
      email: payload.email,
      name: payload.name,
    },
    subject: `[Paris Greeters] ${payload.subject}`,
    text: [
      "Nouvelle demande depuis le formulaire de contact Paris Greeters",
      "",
      `Nom : ${payload.name}`,
      `Email : ${payload.email}`,
      `Sujet : ${payload.subject}`,
      "",
      payload.message,
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; color: #183129; line-height: 1.7;">
        <h2 style="margin: 0 0 16px; color: #183129;">Nouvelle demande depuis le formulaire de contact</h2>
        <p style="margin: 0 0 8px;"><strong>Nom :</strong> ${safeName}</p>
        <p style="margin: 0 0 8px;"><strong>Email :</strong> ${safeEmail}</p>
        <p style="margin: 0 0 20px;"><strong>Sujet :</strong> ${safeSubject}</p>
        <div style="padding: 16px 18px; border-radius: 16px; background: #f6f0e1; border: 1px solid #dfd0aa;">
          ${safeMessage}
        </div>
      </div>
    `,
  };
}

function getSendGridErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Erreur SendGrid inconnue.";
  }

  const sendGridError = error as Error & {
    response?: {
      body?: {
        errors?: Array<{
          message?: string;
        }>;
      };
    };
  };

  const firstApiMessage = sendGridError.response?.body?.errors?.[0]?.message;
  return firstApiMessage ?? error.message;
}

function toUserFacingContactError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("credit") || normalized.includes("quota") || normalized.includes("rate limit")) {
    return new ContactServiceError(
      429,
      "L'envoi email est temporairement indisponible : le compte SendGrid a atteint son quota/crédit.",
    );
  }

  if (normalized.includes("forbidden") || normalized.includes("unauthorized") || normalized.includes("permission")) {
    return new ContactServiceError(
      502,
      "L'envoi email est refusé par SendGrid. Vérifiez la clé API et l'expéditeur configuré.",
    );
  }

  return new ContactServiceError(
    502,
    "L'envoi de votre message a échoué. Merci de réessayer dans quelques instants.",
  );
}

export function validateContactPayload(input: unknown): ContactPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Le formulaire de contact est invalide.");
  }

  const candidate = input as Record<string, unknown>;
  const payload = {
    name: String(candidate.name ?? "").trim(),
    email: String(candidate.email ?? "").trim().toLowerCase(),
    subject: String(candidate.subject ?? "").trim(),
    message: String(candidate.message ?? "").trim(),
  } satisfies ContactPayload;

  if (!payload.name || !payload.subject || !payload.message || !EMAIL_REGEX.test(payload.email)) {
    throw new Error("Merci de renseigner un nom, un email valide, un sujet et un message.");
  }

  return payload;
}

export async function sendContactEmail(payload: ContactPayload) {
  const { apiKey, fromEmail, toEmail } = getContactConfig();

  sgMail.setApiKey(apiKey);

  try {
    await sgMail.send(buildContactMail(payload, fromEmail, toEmail));
  } catch (error) {
    const errorMessage = getSendGridErrorMessage(error);

    console.error("Échec SendGrid pour le formulaire de contact", {
      message: errorMessage,
      email: payload.email,
      subject: payload.subject,
    });

    throw toUserFacingContactError(errorMessage);
  }
}