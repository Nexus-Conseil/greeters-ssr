import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { optimizePageSeo } from "@/lib/services/ai-seo-optimizer";
import { normalizeLocale } from "@/lib/i18n/config";
import { parsePageInput } from "@/lib/services/pages";

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();
    const body = await request.json();
    const page = parsePageInput(body.page ?? body);
    const locale = normalizeLocale(body.locale ?? page.locale);
    const optimization = await optimizePageSeo(page, typeof body.instructions === "string" ? body.instructions : null, locale);

    return NextResponse.json({ optimization });
  } catch (error) {
    return toErrorResponse(error, "Impossible d’optimiser le SEO de cette page via IA.");
  }
}