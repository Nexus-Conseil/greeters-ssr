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
const EMAILIT_API_URL = "https://api.emailit.com/v2/emails";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getContactConfig() {
  const apiKey = process.env.EMAILIT_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const fromName = process.env.CONTACT_FROM_NAME;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !fromEmail || !fromName || !toEmail) {
    throw new ContactServiceError(
      500,
      "La configuration email du formulaire de contact est incomplète.",
    );
  }

  return { apiKey, fromEmail, fromName, toEmail };
}

function buildContactRequestBody(
  payload: ContactPayload,
  fromEmail: string,
  fromName: string,
  toEmail: string,
) {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");

  return {
    from: `${fromName} <${fromEmail}>`,
    to: [toEmail],
    reply_to: `${payload.name} <${payload.email}>`,
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
    tracking: {
      loads: false,
      clicks: false,
    },
  };
}

function getEmailitErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as {
    message?: string;
    error?: string;
    detail?: string;
    errors?: Array<{
      message?: string;
    }>;
  };

  return candidate.message ?? candidate.error ?? candidate.detail ?? candidate.errors?.[0]?.message ?? fallback;
}

function parseMaybeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toUserFacingContactError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("credit") || normalized.includes("quota") || normalized.includes("rate limit")) {
    return new ContactServiceError(
      429,
      "L'envoi email est temporairement indisponible : le compte Emailit a atteint son quota ou sa limite d'envoi.",
    );
  }

  if (normalized.includes("forbidden") || normalized.includes("unauthorized") || normalized.includes("permission") || normalized.includes("invalid api key")) {
    return new ContactServiceError(
      502,
      "L'envoi email est refusé par Emailit. Vérifiez la clé API et l'expéditeur configuré.",
    );
  }

  if (normalized.includes("domain") || normalized.includes("sender") || normalized.includes("from")) {
    return new ContactServiceError(
      502,
      "L'adresse d'expédition Emailit n'est pas acceptée. Vérifiez la configuration du domaine expéditeur.",
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
  const { apiKey, fromEmail, fromName, toEmail } = getContactConfig();

  try {
    const response = await fetch(EMAILIT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildContactRequestBody(payload, fromEmail, fromName, toEmail)),
    });

    const rawBody = await response.text();
    const parsedBody = rawBody ? parseMaybeJson(rawBody) : null;

    if (!response.ok) {
      throw new ContactServiceError(
        response.status >= 400 ? response.status : 502,
        getEmailitErrorMessage(parsedBody, rawBody || "Réponse Emailit inconnue."),
      );
    }
  } catch (error) {
    const errorMessage = error instanceof ContactServiceError ? error.message : error instanceof Error ? error.message : "Erreur Emailit inconnue.";

    console.error("Échec Emailit pour le formulaire de contact", {
      message: errorMessage,
      email: payload.email,
      subject: payload.subject,
    });

    throw toUserFacingContactError(errorMessage);
  }
}