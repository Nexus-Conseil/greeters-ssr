import { NextResponse } from "next/server";

import { ContactServiceError, sendContactEmail, validateContactPayload } from "@/lib/services/contact";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = validateContactPayload(await request.json());
    await sendContactEmail(payload);

    console.info("Contact form submission received", {
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
    });

    return NextResponse.json({
      message: "Votre message a bien été envoyé. Nous vous répondrons dès que possible.",
    });
  } catch (error) {
    if (error instanceof ContactServiceError) {
      return NextResponse.json(
        {
          detail: error.message,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        detail: error instanceof Error ? error.message : "Le formulaire de contact est invalide.",
      },
      { status: 400 },
    );
  }
}