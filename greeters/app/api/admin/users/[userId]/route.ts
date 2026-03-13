import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { deleteAdminUser, updateAdminUserRole } from "@/lib/services/admin-users";

function resolveRequestedRole(role: unknown) {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.EDITOR) {
    return role;
  }
  return UserRole.EDITOR;
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const actor = await requireAdminApiUser();
    const { userId } = await context.params;
    const payload = (await request.json()) as { role?: UserRole };
    const requestedRole = resolveRequestedRole(payload.role);

    if (requestedRole === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ detail: "Seul un super administrateur peut attribuer ce rôle." }, { status: 403 });
    }

    const user = await updateAdminUserRole(userId, requestedRole);
    return NextResponse.json({ user });
  } catch (error) {
    return toErrorResponse(error, "Impossible de mettre à jour cet utilisateur.");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const actor = await requireAdminApiUser();
    const { userId } = await context.params;
    if (actor.id === userId) {
      return NextResponse.json({ detail: "Vous ne pouvez pas supprimer votre propre compte depuis cette interface." }, { status: 400 });
    }
    return NextResponse.json(await deleteAdminUser(userId));
  } catch (error) {
    return toErrorResponse(error, "Impossible de supprimer cet utilisateur.");
  }
}