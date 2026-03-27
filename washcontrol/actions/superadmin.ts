"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao SUPER_ADMIN.");
  }
  return session;
}

const TenantSchema = z.object({
  name: z.string().min(2, "Nome mínimo 2 caracteres"),
  saasPlan: z.enum(["BASIC", "PRO", "ENTERPRISE"]).default("BASIC"),
  saasPrice: z.number().min(0),
  saasDueDate: z.string().optional(),
  billingCycleDay: z.number().int().min(1).max(28).default(1),
  monthlyGoal: z.number().min(0).default(0),
  // Manager account
  managerName: z.string().min(1, "Nome do gestor obrigatório"),
  managerEmail: z.string().email("Email inválido"),
  managerPassword: z.string().min(6, "Senha mínima 6 caracteres"),
});

export async function createTenant(formData: unknown) {
  await requireSuperAdmin();

  const parsed = TenantSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;
  const slug = slugify(data.name);

  // Verificar slug único
  const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
  if (existingSlug) throw new Error("Já existe um lava-jato com este nome.");

  // Verificar email único
  const existingUser = await prisma.user.findUnique({ where: { email: data.managerEmail } });
  if (existingUser) throw new Error("Email já cadastrado.");

  const hashed = await bcrypt.hash(data.managerPassword, 12);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: data.name,
        slug,
        saasPlan: data.saasPlan,
        saasPrice: data.saasPrice,
        saasDueDate: data.saasDueDate ? new Date(data.saasDueDate) : null,
        billingCycleDay: data.billingCycleDay,
        monthlyGoal: data.monthlyGoal,
      },
    });

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        name: data.managerName,
        email: data.managerEmail,
        password: hashed,
        role: "MANAGER",
      },
    });
  });

  revalidatePath("/dashboard/lavacarros");
  revalidatePath("/dashboard");
}

export async function toggleTenantActive(tenantId: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Lava-jato não encontrado.");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { isActive: !tenant.isActive },
  });

  revalidatePath("/dashboard/lavacarros");
  revalidatePath("/dashboard");
}

export async function updateTenantPlan(
  tenantId: string,
  plan: { saasPlan: string; saasPrice: number; saasDueDate?: string }
) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Lava-jato não encontrado.");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      saasPlan: plan.saasPlan,
      saasPrice: plan.saasPrice,
      saasDueDate: plan.saasDueDate ? new Date(plan.saasDueDate) : null,
    },
  });

  revalidatePath("/dashboard/lavacarros");
  revalidatePath("/dashboard");
}
