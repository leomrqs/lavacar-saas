"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * SUPER_ADMIN pode entrar na conta de qualquer tenant sem precisar de senha.
 * Retorna os dados do usuário MANAGER principal do tenant solicitado.
 */
export async function impersonateTenant(targetTenantId: string) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Acesso negado. Apenas o SUPER_ADMIN pode usar impersonation.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: targetTenantId },
    include: {
      users: {
        where: { role: "MANAGER" },
        take: 1,
      },
    },
  });

  if (!tenant) throw new Error("Tenant não encontrado.");
  if (!tenant.users[0]) throw new Error("Nenhum MANAGER encontrado neste tenant.");

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    managerEmail: tenant.users[0].email,
    managerId: tenant.users[0].id,
  };
}
