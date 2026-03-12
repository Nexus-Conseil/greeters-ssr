import { NextResponse } from "next/server";

import { getAuthenticatedSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json({ detail: "Non authentifié." }, { status: 401 });
  }

  return NextResponse.json(session.user);
}