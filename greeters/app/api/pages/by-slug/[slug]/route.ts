import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { getPublicPageBySlugOrThrow } from "@/lib/services/pages";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    return NextResponse.json(await getPublicPageBySlugOrThrow(slug));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer cette page.");
  }
}