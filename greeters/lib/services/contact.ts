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

type EmailitRequestBody = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  text: string;
  html: string;
  tracking: {
    loads: boolean;
    clicks: boolean;
  };
};

type ContactConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  siteUrl: string;
};

const EMAIL_BRAND = {
  pageBackground: "#f5f3ec",
  cardBackground: "#ffffff",
  brandGreen: "#7da33b",
  brandGreenDark: "#36543a",
  softGreen: "#edf4e3",
  softSand: "#f8f1e5",
  textPrimary: "#183129",
  textMuted: "#5f6d66",
  border: "#d8e2cf",
  radius: "0.25rem",
  headingFont: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  bodyFont: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

function buildEmailIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 7.5L11.058 12.086C11.648 12.469 12.352 12.469 12.942 12.086L20 7.5" stroke="#36543a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="3.15" y="5.15" width="17.7" height="13.7" rx="2.85" stroke="#36543a" stroke-width="1.7"/></svg>`;
}

function buildGlobeIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="8.25" stroke="#36543a" stroke-width="1.7"/><path d="M3.75 12H20.25" stroke="#36543a" stroke-width="1.7" stroke-linecap="round"/><path d="M12 3.75C14.517 6.473 15.947 9.99 16.029 13.699C15.947 17.408 14.517 20.925 12 23.648C9.483 20.925 8.053 17.408 7.971 13.699C8.053 9.99 9.483 6.473 12 3.75Z" stroke="#36543a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getContactConfig(): ContactConfig {
  const apiKey = process.env.EMAILIT_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const fromName = process.env.CONTACT_FROM_NAME;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const siteUrl = process.env.PUBLIC_SITE_URL;

  if (!apiKey || !fromEmail || !fromName || !toEmail || !siteUrl) {
    throw new ContactServiceError(
      500,
      "La configuration email du formulaire de contact est incomplète.",
    );
  }

  return { apiKey, fromEmail, fromName, toEmail, siteUrl };
}

function buildEmailShell({
  eyebrow,
  title,
  intro,
  body,
  footerLabel,
  footerEmail,
  footerUrl,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  footerLabel: string;
  footerEmail: string;
  footerUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const safeFooterEmail = escapeHtml(footerEmail);
  const safeFooterUrl = escapeHtml(footerUrl);
  const safeCtaHref = ctaHref ? escapeHtml(ctaHref) : "";
  const logoUrl = `${footerUrl.replace(/\/$/, "")}/images/logo_greeters.png`;

  return `
    <div style="margin: 0; padding: 32px 16px; background: ${EMAIL_BRAND.pageBackground}; font-family: ${EMAIL_BRAND.bodyFont}; color: ${EMAIL_BRAND.textPrimary};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; margin: 0 auto; border-collapse: collapse;">
        <tr>
          <td>
            <div style="background: #ffffff; border: 1px solid ${EMAIL_BRAND.border}; border-bottom: none; border-radius: ${EMAIL_BRAND.radius} ${EMAIL_BRAND.radius} 0 0; padding: 28px 32px; text-align: center;">
              <img src="${logoUrl}" alt="Paris Greeters" width="200" style="display: block; width: 200px; max-width: 100%; height: auto; margin: 0 auto;" />
            </div>
            <div style="background: ${EMAIL_BRAND.cardBackground}; border: 1px solid ${EMAIL_BRAND.border}; border-top: none; border-radius: 0 0 ${EMAIL_BRAND.radius} ${EMAIL_BRAND.radius}; padding: 32px; box-shadow: 0 14px 36px rgba(24, 49, 41, 0.06);">
              <p style="margin: 0 0 12px; color: ${EMAIL_BRAND.brandGreen}; letter-spacing: 0.14em; font-size: 11px; text-transform: uppercase;">
                ${eyebrow}
              </p>
              <h1 style="margin: 0 0 16px; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_BRAND.headingFont}; font-size: 34px; line-height: 1.12; font-weight: 400;">
                ${title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 17px; line-height: 1.8; color: ${EMAIL_BRAND.textPrimary};">
                ${intro}
              </p>
              ${body}
              ${ctaLabel && ctaHref ? `
                <div style="margin-top: 28px; text-align: center;">
                  <a href="${safeCtaHref}" style="display: inline-block; padding: 14px 22px; border-radius: ${EMAIL_BRAND.radius}; background: ${EMAIL_BRAND.brandGreen}; color: #ffffff; text-decoration: none; font-family: ${EMAIL_BRAND.headingFont}; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase;">
                    ${ctaLabel}
                  </a>
                </div>
              ` : ""}
              <div style="margin-top: 32px; padding-top: 22px; border-top: 1px solid ${EMAIL_BRAND.border}; color: ${EMAIL_BRAND.textMuted}; font-size: 14px; line-height: 1.8;">
                <strong style="color: ${EMAIL_BRAND.textPrimary};">${footerLabel}</strong><br />
                <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; color: ${EMAIL_BRAND.textPrimary};">
                  <span style="display: inline-flex; width: 18px; height: 18px; vertical-align: middle;">${buildEmailIconSvg()}</span>
                  <a href="mailto:${safeFooterEmail}" style="color: ${EMAIL_BRAND.brandGreenDark}; text-decoration: none;">${safeFooterEmail}</a>
                </div>
                <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px; color: ${EMAIL_BRAND.textPrimary};">
                  <span style="display: inline-flex; width: 18px; height: 18px; vertical-align: middle;">${buildGlobeIconSvg()}</span>
                  <a href="${safeFooterUrl}" style="color: ${EMAIL_BRAND.brandGreenDark}; text-decoration: none;">${safeFooterUrl}</a>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildFieldGrid(fields: Array<{ label: string; value: string; background?: string }>) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0 12px; margin-bottom: 12px;">
      ${fields
        .map(
          (field) => `
            <tr>
              <td style="padding: 16px 18px; border-radius: ${EMAIL_BRAND.radius}; background: ${field.background ?? EMAIL_BRAND.softGreen}; border: 1px solid ${EMAIL_BRAND.border};">
                <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${EMAIL_BRAND.brandGreenDark}; margin-bottom: 8px;">
                  ${field.label}
                </div>
                <div style="font-size: 16px; line-height: 1.6; color: ${EMAIL_BRAND.textPrimary};">
                  ${field.value}
                </div>
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

export function buildAdminContactRequestBody(
  payload: ContactPayload,
  config: Pick<ContactConfig, "fromEmail" | "fromName" | "toEmail" | "siteUrl">,
): EmailitRequestBody {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");
  const emailLine = `
    <div style="margin-top: 18px; padding: 16px 18px; border-radius: ${EMAIL_BRAND.radius}; background: ${EMAIL_BRAND.softGreen}; border: 1px solid ${EMAIL_BRAND.border};">
      <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${EMAIL_BRAND.brandGreenDark}; margin-bottom: 8px;">
        Email
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: ${EMAIL_BRAND.textPrimary};">
        <span style="display: inline-flex; width: 18px; height: 18px; vertical-align: middle;">${buildEmailIconSvg()}</span>
        <span style="font-size: 15px; line-height: 1.6;">${safeEmail}</span>
      </div>
    </div>
  `;
  const messageCard = `
    <div style="margin-top: 18px; padding: 22px 22px 24px; border-radius: ${EMAIL_BRAND.radius}; background: ${EMAIL_BRAND.softSand}; border: 1px solid #ead8b7;">
      <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${EMAIL_BRAND.brandGreenDark}; margin-bottom: 10px;">
        Message
      </div>
      <div style="font-size: 16px; line-height: 1.8; color: ${EMAIL_BRAND.textPrimary};">
        ${safeMessage}
      </div>
    </div>
  `;

  return {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: [config.toEmail],
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
    html: buildEmailShell({
      eyebrow: "Formulaire de contact",
      title: "Nouveau message reçu",
      intro: "Un visiteur vient de vous écrire depuis le formulaire de contact. Vous trouverez ci-dessous ses coordonnées ainsi que le contenu de sa demande.",
      body:
        buildFieldGrid([
          { label: "Nom", value: safeName },
          { label: "Sujet", value: safeSubject },
        ]) + emailLine + messageCard,
      footerLabel: "Paris Greeters",
      footerEmail: config.fromEmail,
      footerUrl: config.siteUrl,
      ctaLabel: "Voir le site",
      ctaHref: config.siteUrl,
    }),
    tracking: {
      loads: false,
      clicks: false,
    },
  };
}

export function buildAuthorConfirmationRequestBody(
  payload: ContactPayload,
  config: Pick<ContactConfig, "fromEmail" | "fromName" | "siteUrl">,
): EmailitRequestBody {
  const safeName = escapeHtml(payload.name);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");
  const websiteCard = `
    <div style="margin: 18px 0 0; padding: 16px 18px; border-radius: ${EMAIL_BRAND.radius}; background: ${EMAIL_BRAND.softGreen}; border: 1px solid ${EMAIL_BRAND.border};">
      <div style="display: flex; align-items: center; gap: 10px; color: ${EMAIL_BRAND.textPrimary};">
        <span style="display: inline-flex; width: 18px; height: 18px; vertical-align: middle;">${buildGlobeIconSvg()}</span>
        <a href="${escapeHtml(config.siteUrl)}" style="color: ${EMAIL_BRAND.brandGreenDark}; text-decoration: none; font-size: 15px; line-height: 1.6;">${escapeHtml(config.siteUrl)}</a>
      </div>
    </div>
  `;

  return {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: [payload.email],
    reply_to: `${config.fromName} <${config.fromEmail}>`,
    subject: "[Paris Greeters] Nous avons bien reçu votre message",
    text: [
      `Bonjour ${payload.name},`,
      "",
      "Nous avons bien reçu votre message et vous remercions de nous avoir contactés.",
      "",
      `Sujet : ${payload.subject}`,
      "",
      "Copie de votre message :",
      payload.message,
      "",
      "L'équipe Paris Greeters",
      config.fromEmail,
      config.siteUrl,
    ].join("\n"),
    html: buildEmailShell({
      eyebrow: "Confirmation",
      title: "Merci pour votre message",
      intro: `Bonjour ${safeName}, nous avons bien reçu votre demande. Merci d’avoir pris le temps de nous écrire : notre équipe reviendra vers vous avec plaisir.`,
      body:
        buildFieldGrid([
          { label: "Sujet", value: safeSubject },
          { label: "Copie de votre message", value: safeMessage, background: EMAIL_BRAND.softSand },
        ]) + websiteCard,
      footerLabel: "Paris Greeters",
      footerEmail: config.fromEmail,
      footerUrl: config.siteUrl,
      ctaLabel: "Découvrir le site",
      ctaHref: config.siteUrl,
    }),
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

async function sendEmailitRequest(apiKey: string, requestBody: EmailitRequestBody) {
  const response = await fetch(EMAILIT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const rawBody = await response.text();
  const parsedBody = rawBody ? parseMaybeJson(rawBody) : null;

  if (!response.ok) {
    throw new ContactServiceError(
      response.status >= 400 ? response.status : 502,
      getEmailitErrorMessage(parsedBody, rawBody || "Réponse Emailit inconnue."),
    );
  }
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
  const { apiKey, fromEmail, fromName, toEmail, siteUrl } = getContactConfig();

  try {
    await Promise.all([
      sendEmailitRequest(
        apiKey,
        buildAdminContactRequestBody(payload, {
          fromEmail,
          fromName,
          toEmail,
          siteUrl,
        }),
      ),
      sendEmailitRequest(
        apiKey,
        buildAuthorConfirmationRequestBody(payload, {
          fromEmail,
          fromName,
          siteUrl,
        }),
      ),
    ]);
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