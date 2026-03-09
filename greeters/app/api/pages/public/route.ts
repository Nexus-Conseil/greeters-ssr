import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { getPublicPages } from "@/lib/services/pages";

export async function GET() {
  try {
    return NextResponse.json(await getPublicPages());
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les pages publiques.");
  }
}