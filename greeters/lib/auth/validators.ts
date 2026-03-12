export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

type LoginPayload = {
  email: string;
  password: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginPayload(input: unknown): LoginPayload {
  if (!input || typeof input !== "object") {
    throw new InputValidationError("Le corps de la requête est invalide.");
  }

  const candidate = input as Record<string, unknown>;
  const email = String(candidate.email ?? "").trim().toLowerCase();
  const password = String(candidate.password ?? "");

  if (!EMAIL_REGEX.test(email)) {
    throw new InputValidationError("Veuillez renseigner une adresse email valide.");
  }

  if (password.length === 0) {
    throw new InputValidationError("Veuillez renseigner votre mot de passe.");
  }

  return { email, password };
}