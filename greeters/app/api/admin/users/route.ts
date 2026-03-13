import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { createAdminUser, listAdminUsers } from "@/lib/services/admin-users";

function resolveRequestedRole(role: unknown) {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.EDITOR) {
    return role;
  }
  return UserRole.EDITOR;
}

export async function GET() {
  try {
    await requireAdminApiUser();
    return NextResponse.json(await listAdminUsers());
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les utilisateurs.");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminApiUser();
    const payload = (await request.json()) as { name?: string; email?: string; password?: string; role?: UserRole };
    const requestedRole = resolveRequestedRole(payload.role);

    if (requestedRole === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ detail: "Seul un super administrateur peut créer un autre super administrateur." }, { status: 403 });
    }

    const user = await createAdminUser(
      {
        name: payload.name ?? "",
        email: payload.email ?? "",
        password: payload.password ?? "",
        role: requestedRole,
      },
      actor.id,
    );

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Impossible de créer cet utilisateur.");
  }
}