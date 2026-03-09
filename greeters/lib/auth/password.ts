import bcrypt from "bcryptjs";

const SPECIAL_CHARACTERS = /[!@#$%^&*(),.?":{}|<>]/;

export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialCharacter: true,
} as const;

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`au moins ${PASSWORD_RULES.minLength} caractères`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("une lettre majuscule");
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("une lettre minuscule");
  }

  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push("un chiffre");
  }

  if (PASSWORD_RULES.requireSpecialCharacter && !SPECIAL_CHARACTERS.test(password)) {
    errors.push("un caractère spécial");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}