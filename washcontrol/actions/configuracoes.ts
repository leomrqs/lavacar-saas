"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");
  return { tenantId };
}

const ConfigSchema = z.object({
  name: z.string().min(2, "Nome mínimo 2 caracteres"),
  monthlyGoal: z.number().min(0).default(0),
  loyaltyInterval: z.number().int().min(1).max(100).default(10),
  loyaltyDiscount: z.number().min(0).max(100).default(100),
});

export async function updateTenantConfig(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = ConfigSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: parsed.data,
  });

  revalidatePath("/dashboard/configuracoes");
  revalidatePath("/dashboard");
}
