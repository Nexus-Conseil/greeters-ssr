import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { automateExistingPublicPages } from "@/lib/services/page-automation";

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();
    const body = await request.json().catch(() => ({}));
    const locale = typeof body.locale === "string" && body.locale !== "all" ? body.locale : undefined;
    const result = await automateExistingPublicPages(locale);
    return NextResponse.json({ message: "Automatisation SEO/OG terminée.", result });
  } catch (error) {
    return toErrorResponse(error, "Impossible de lancer l’automatisation SEO/OG.");
  }
}