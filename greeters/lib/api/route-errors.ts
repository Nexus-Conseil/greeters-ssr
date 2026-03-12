import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/permissions";
import { PagesServiceError } from "@/lib/services/pages";

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError || error instanceof PagesServiceError) {
    return NextResponse.json({ detail: error.message }, { status: error.statusCode });
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ detail: "Le corps JSON est invalide." }, { status: 400 });
  }

  return NextResponse.json({ detail: fallbackMessage }, { status: 500 });
}