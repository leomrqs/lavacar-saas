"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const EmployeeSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  role: z.enum(["MANAGER", "WASHER"]).default("WASHER"),
  phone: z.string().optional(),
  salary: z.number().min(0).default(0),
  commissionPct: z.number().min(0).max(100).default(0),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha mínima de 6 caracteres").optional(),
});

async function getManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");
  return { tenantId };
}

export async function createEmployee(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = EmployeeSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    let userId: string | undefined;

    // Criar conta de acesso se email+senha foram fornecidos
    if (data.email && data.password) {
      const existingUser = await tx.user.findUnique({ where: { email: data.email } });
      if (existingUser) throw new Error("Email já está em uso.");

      const hashed = await bcrypt.hash(data.password, 12);
      const user = await tx.user.create({
        data: {
          tenantId,
          name: data.name,
          email: data.email,
          password: hashed,
          role: data.role === "MANAGER" ? "MANAGER" : "WASHER",
        },
      });
      userId = user.id;
    }

    await tx.employee.create({
      data: {
        tenantId,
        name: data.name,
        role: data.role,
        phone: data.phone || null,
        salary: data.salary,
        commissionPct: data.commissionPct,
        userId,
      },
    });
  });

  revalidatePath("/dashboard/equipe");
}

export async function updateEmployee(employeeId: string, formData: unknown) {
  const { tenantId } = await getManagerSession();

  const UpdateSchema = EmployeeSchema.omit({ email: true, password: true });
  const parsed = UpdateSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!emp) throw new Error("Funcionário não encontrado.");

  await prisma.employee.update({
    where: { id: employeeId },
    data: parsed.data,
  });

  revalidatePath("/dashboard/equipe");
}

export async function toggleEmployeeActive(employeeId: string) {
  const { tenantId } = await getManagerSession();

  const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!emp) throw new Error("Funcionário não encontrado.");

  await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive: !emp.isActive },
  });

  revalidatePath("/dashboard/equipe");
}
