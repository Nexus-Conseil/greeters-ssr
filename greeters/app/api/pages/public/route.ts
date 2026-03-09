import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { getRequestLocale } from "@/lib/i18n/request";
import { getPublicPages } from "@/lib/services/pages";

export async function GET() {
  try {
    return NextResponse.json(await getPublicPages(await getRequestLocale()));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les pages publiques.");
  }
}