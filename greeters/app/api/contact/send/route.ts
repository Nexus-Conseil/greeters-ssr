import { NextResponse } from "next/server";

import { validateContactPayload } from "@/lib/services/contact";

export async function POST(request: Request) {
  try {
    const payload = validateContactPayload(await request.json());

    console.info("Contact form submission received", {
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
    });

    return NextResponse.json({
      message:
        "Votre message a été reçu. La livraison email n'est pas encore configurée dans cet environnement de migration, mais le formulaire est bien branché côté interface.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: error instanceof Error ? error.message : "Le formulaire de contact est invalide.",
      },
      { status: 400 },
    );
  }
}