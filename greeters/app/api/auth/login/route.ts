import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { createSessionForUser, setSessionCookie } from "@/lib/auth/session";
import { InputValidationError, validateLoginPayload } from "@/lib/auth/validators";
import { findUserByEmail } from "@/lib/repositories/users";

export async function POST(request: Request) {
  try {
    const payload = validateLoginPayload(await request.json());
    const user = await findUserByEmail(payload.email);

    if (!user) {
      return NextResponse.json({ detail: "Identifiants invalides." }, { status: 401 });
    }

    const passwordIsValid = await verifyPassword(payload.password, user.passwordHash);

    if (!passwordIsValid) {
      return NextResponse.json({ detail: "Identifiants invalides." }, { status: 401 });
    }

    const session = await createSessionForUser(user);
    await setSessionCookie(session.cookieValue, session.expiresAt);

    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt.toISOString(),
      sessionDurationDays: 7,
    });
  } catch (error) {
    if (error instanceof InputValidationError || error instanceof SyntaxError) {
      const message = error instanceof Error ? error.message : "Requête invalide.";
      return NextResponse.json({ detail: message }, { status: 400 });
    }

    return NextResponse.json({ detail: "Erreur interne lors de la connexion." }, { status: 500 });
  }
}