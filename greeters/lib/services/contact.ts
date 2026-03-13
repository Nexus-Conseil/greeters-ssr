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
  pageBackground: "#f4f4f1",
  cardBackground: "#ffffff",
  brandGreen: "#7daa2f",
  brandGreenDark: "#5d8120",
  softGreen: "#f7f8f2",
  softSand: "#f7f8f2",
  textPrimary: "#111111",
  textMuted: "#4d4d4d",
  textFooter: "#7a7a7a",
  border: "#ececdf",
  softBorder: "#e7ecd6",
  radius: "12px",
  innerRadius: "10px",
  buttonRadius: "6px",
  headingFont: "Arial, Helvetica, sans-serif",
  bodyFont: "Arial, Helvetica, sans-serif",
};

function buildEmailIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 7.5L11.058 12.086C11.648 12.469 12.352 12.469 12.942 12.086L20 7.5" stroke="#36543a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="3.15" y="5.15" width="17.7" height="13.7" rx="2.85" stroke="#36543a" stroke-width="1.7"/></svg>`;
}

function buildGlobeIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="8.25" stroke="#36543a" stroke-width="1.7"/><path d="M3.75 12H20.25" stroke="#36543a" stroke-width="1.7" stroke-linecap="round"/><path d="M12 3.75C14.517 6.473 15.947 9.99 16.029 13.699C15.947 17.408 14.517 20.925 12 23.648C9.483 20.925 8.053 17.408 7.971 13.699C8.053 9.99 9.483 6.473 12 3.75Z" stroke="#36543a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function buildArrowIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 17L17 7" stroke="#7daa2f" stroke-width="2" stroke-linecap="round"/><path d="M9 7H17V15" stroke="#7daa2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, "");
}

function buildButton(label: string, href: string, variant: "primary" | "secondary" = "primary") {
  const isPrimary = variant === "primary";

  return `
    <table border="0" cellspacing="0" cellpadding="0" role="presentation">
      <tr>
        <td align="center" bgcolor="${isPrimary ? EMAIL_BRAND.brandGreen : EMAIL_BRAND.textPrimary}" style="border-radius: ${EMAIL_BRAND.buttonRadius};">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block; font-family:${EMAIL_BRAND.bodyFont}; font-size:${isPrimary ? 15 : 14}px; line-height:${isPrimary ? 15 : 14}px; font-weight:700; color:#ffffff; text-decoration:none; padding:${isPrimary ? "15px 24px" : "14px 22px"}; border-radius:${EMAIL_BRAND.buttonRadius};">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function buildSection(title: string, paragraphs: string[]) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-top: 1px solid ${EMAIL_BRAND.border};">
      <tr>
        <td style="padding-top: 28px; font-family: ${EMAIL_BRAND.bodyFont}; font-size: 22px; line-height: 28px; color: ${EMAIL_BRAND.textPrimary}; font-weight: 700; padding-bottom: 12px;">
          ${title}
        </td>
      </tr>
      ${paragraphs
        .map(
          (paragraph, index) => `
            <tr>
              <td style="font-family: ${EMAIL_BRAND.bodyFont}; font-size: 16px; line-height: 27px; color: ${EMAIL_BRAND.textMuted}; padding-bottom: ${index === paragraphs.length - 1 ? "24px" : "18px"};">
                ${paragraph}
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

function buildInlineContactDetails(name: string, email: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-top: 1px solid ${EMAIL_BRAND.border};">
      <tr>
        <td style="padding-top: 28px; font-family: ${EMAIL_BRAND.bodyFont}; font-size: 22px; line-height: 28px; color: ${EMAIL_BRAND.textPrimary}; font-weight: 700; padding-bottom: 12px;">
          Coordonnées du contact
        </td>
      </tr>
      <tr>
        <td style="font-family: ${EMAIL_BRAND.bodyFont}; font-size: 16px; line-height: 27px; color: ${EMAIL_BRAND.textPrimary}; padding-bottom: 24px;">
          <span style="color: ${EMAIL_BRAND.textPrimary}; text-decoration: none;">${name}</span>
          <span style="color: ${EMAIL_BRAND.textMuted};">&nbsp;&nbsp;•&nbsp;&nbsp;</span>
          <span style="color: ${EMAIL_BRAND.textPrimary}; text-decoration: none;">${email}</span>
        </td>
      </tr>
    </table>
  `;
}

function buildSoftBox(title: string, body: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${EMAIL_BRAND.softGreen}" style="background-color:${EMAIL_BRAND.softGreen}; border:1px solid ${EMAIL_BRAND.softBorder}; border-radius:${EMAIL_BRAND.innerRadius}; border-collapse:separate;">
      <tr>
        <td style="padding: 22px 24px; font-family:${EMAIL_BRAND.bodyFont}; font-size:15px; line-height:25px; color:${EMAIL_BRAND.textMuted};">
          <strong style="color:${EMAIL_BRAND.textPrimary};">${title}</strong><br />
          ${body}
        </td>
      </tr>
    </table>
  `;
}

function buildIconInfoRow({
  label,
  href,
  value,
  description,
  icon,
}: {
  label: string;
  href: string;
  value: string;
  description: string;
  icon: string;
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-top: 14px;">
      <tr>
        <td style="font-family: ${EMAIL_BRAND.bodyFont}; font-size: 13px; line-height: 18px; letter-spacing: 1.8px; text-transform: uppercase; color: ${EMAIL_BRAND.brandGreen}; font-weight: 700; padding-bottom: 14px;">
          ${label}
        </td>
      </tr>
      <tr>
        <td>
          <table border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td valign="middle" style="padding-right: 12px;">
                <table width="38" height="38" border="0" cellspacing="0" cellpadding="0" role="presentation" style="width:38px; height:38px; border-radius:${EMAIL_BRAND.buttonRadius}; background-color:#ffffff; border:1px solid ${EMAIL_BRAND.brandGreen};">
                  <tr>
                    <td align="center" valign="middle">${icon}</td>
                  </tr>
                </table>
              </td>
              <td valign="middle">
                <a href="${escapeHtml(href)}" target="_blank" style="font-family:${EMAIL_BRAND.bodyFont}; font-size:16px; line-height:22px; color:${EMAIL_BRAND.textPrimary}; font-weight:700; text-decoration:none;">
                  ${value}
                </a><br />
                ${description
                  ? `<span style="font-family:${EMAIL_BRAND.bodyFont}; font-size:14px; line-height:20px; color:#6c6c6c; font-weight:400;">
                  ${description}
                </span>`
                  : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildEmailShell({
  preheader,
  eyebrow,
  title,
  intro,
  primaryCta,
  mainSection,
  softBox,
  detailsSection,
  secondaryCta,
  footerLabel,
  footerEmail,
  footerUrl,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  primaryCta?: string;
  mainSection: string;
  softBox?: string;
  detailsSection?: string;
  secondaryCta?: string;
  footerLabel?: string;
  footerEmail?: string;
  footerUrl?: string;
}) {
  const safeFooterEmail = footerEmail ? escapeHtml(footerEmail) : "";
  const safeFooterUrl = footerUrl ? escapeHtml(footerUrl) : "";
  const normalizedSiteUrl = normalizeSiteUrl(footerUrl ?? "");
  const logoUrl = `${normalizedSiteUrl}/logo_greeters.png`;

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          a[x-apple-data-detectors],
          #MessageViewBody a,
          u + #body a {
            color: inherit !important;
            text-decoration: none !important;
            font-weight: inherit !important;
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background-color:${EMAIL_BRAND.pageBackground};">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; visibility:hidden; font-size:1px; line-height:1px; color:${EMAIL_BRAND.pageBackground};">
          ${preheader}
        </div>
        <center style="width:100%; background-color:${EMAIL_BRAND.pageBackground};">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${EMAIL_BRAND.pageBackground}" style="background-color:${EMAIL_BRAND.pageBackground};">
            <tr>
              <td align="center" style="padding: 28px 12px;">
                <table role="presentation" width="640" border="0" cellspacing="0" cellpadding="0" style="width:640px; max-width:640px; border-collapse:separate;">
                  <tr>
                    <td>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${EMAIL_BRAND.cardBackground}" style="background-color:${EMAIL_BRAND.cardBackground}; border-radius:${EMAIL_BRAND.radius}; overflow:hidden;">
                        <tr>
                          <td align="center" style="padding: 26px 32px 18px 32px; border-bottom: 1px solid ${EMAIL_BRAND.border}; background:#ffffff;">
                            <img src="${logoUrl}" alt="Paris Greeters" width="220" style="display:block; width:220px; max-width:220px; height:auto; margin:0 auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 38px 48px 18px 48px; font-family:${EMAIL_BRAND.bodyFont};">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font-family:${EMAIL_BRAND.bodyFont}; font-size:13px; line-height:13px; letter-spacing:2.2px; text-transform:uppercase; color:${EMAIL_BRAND.brandGreen}; font-weight:700; padding-bottom:14px;">
                                  ${eyebrow}
                                </td>
                              </tr>
                              <tr>
                                <td style="font-family:${EMAIL_BRAND.headingFont}; font-size:36px; line-height:42px; color:${EMAIL_BRAND.textPrimary}; font-weight:700; padding-bottom:16px;">
                                  ${title}
                                </td>
                              </tr>
                              <tr>
                                <td style="font-family:${EMAIL_BRAND.bodyFont}; font-size:17px; line-height:28px; color:${EMAIL_BRAND.textMuted}; padding-bottom:${primaryCta ? "26px" : "10px"};">
                                  ${intro}
                                </td>
                              </tr>
                              ${primaryCta ? `<tr><td>${primaryCta}</td></tr>` : ""}
                            </table>
                          </td>
                        </tr>
                        ${mainSection
                          ? `<tr>
                          <td style="padding: 10px 48px 0 48px; font-family:${EMAIL_BRAND.bodyFont};">
                            ${mainSection}
                          </td>
                        </tr>`
                          : ""}
                        ${softBox ? `<tr><td style="padding: 0 48px 0 48px;">${softBox}</td></tr>` : ""}
                        ${detailsSection ? `<tr><td style="padding: 28px 48px 0 48px;">${detailsSection}</td></tr>` : ""}
                        ${secondaryCta ? `<tr><td style="padding: 30px 48px 0 48px;">${secondaryCta}</td></tr>` : ""}
                        ${footerLabel && footerEmail && footerUrl
                          ? `<tr>
                          <td style="padding: 34px 48px 36px 48px; font-family:${EMAIL_BRAND.bodyFont};">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top:1px solid ${EMAIL_BRAND.border}; border-collapse:collapse;">
                              <tr>
                                <td style="padding-top: 22px; font-family:${EMAIL_BRAND.bodyFont}; font-size:13px; line-height:22px; color:${EMAIL_BRAND.textFooter};">
                                  ${footerLabel}<br />
                                  <a href="mailto:${safeFooterEmail}" style="color:${EMAIL_BRAND.textFooter}; text-decoration:underline;">${safeFooterEmail}</a>
                                  &nbsp;•&nbsp;
                                  <a href="${safeFooterUrl}" target="_blank" style="color:${EMAIL_BRAND.textFooter}; text-decoration:underline;">${safeFooterUrl}</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>`
                          : ""}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;
}

function buildFieldGrid(fields: Array<{ label: string; value: string; background?: string }>) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0 12px; margin-bottom: 12px;">
      ${fields
        .map(
          (field) => `
            <tr>
              <td style="padding: 16px 18px; border-radius: ${EMAIL_BRAND.innerRadius}; background: ${field.background ?? EMAIL_BRAND.softGreen}; border: 1px solid ${field.background ? EMAIL_BRAND.softBorder : EMAIL_BRAND.border};">
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
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);

  return {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: [config.toEmail],
    reply_to: `${payload.name} <${payload.email}>`,
    subject: payload.subject,
    text: [
      "Nouveau message",
      "",
      "Coordonnées du contact",
      `Nom : ${payload.name}`,
      `Email : ${payload.email}`,
      "",
      "Message",
      payload.message,
    ].join("\n"),
    html: buildEmailShell({
      preheader: `Nouveau message de ${payload.name}`,
      eyebrow: "Formulaire de contact",
      title: "Nouveau message reçu",
      intro:
        "Un visiteur vient de vous écrire depuis le formulaire de contact. Vous trouverez ci-dessous ses coordonnées ainsi que le contenu complet de sa demande.",
      mainSection: buildInlineContactDetails(safeName, safeEmail),
      softBox: buildSoftBox(
        "Message",
        `${safeMessage}`,
      ),
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
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");
  const normalizedSiteUrl = normalizeSiteUrl(config.siteUrl);

  return {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: [payload.email],
    reply_to: `${config.fromName} <${config.fromEmail}>`,
    subject: payload.subject,
    text: [
      "Merci pour votre message",
      "",
      "Bonjour, nous avons bien reçu votre message, dont vous trouverez la copie ci-dessous. Nous reviendrons vers vous très rapidement.",
      "",
      "Copie de votre message :",
      payload.message,
      "",
      config.siteUrl,
    ].join("\n"),
    html: buildEmailShell({
      preheader: "Nous avons bien reçu votre message pour Paris Greeters.",
      eyebrow: "Confirmation",
      title: "Merci pour votre message",
      intro:
        "Bonjour, nous avons bien reçu votre message, dont vous trouverez la copie ci-dessous. Nous reviendrons vers vous très rapidement.",
      mainSection: "",
      softBox: buildSoftBox(
        "Copie de votre message",
        `${safeMessage}`,
      ),
      detailsSection: buildIconInfoRow({
        label: "Site web",
        href: normalizedSiteUrl,
        value: normalizedSiteUrl,
        description: "",
        icon: buildGlobeIconSvg(),
      }),
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