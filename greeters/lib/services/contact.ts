export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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