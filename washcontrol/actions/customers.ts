"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CustomerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

const VehicleSchema = z.object({
  customerId: z.string().min(1),
  plate: z
    .string()
    .min(7, "Placa inválida")
    .max(8, "Placa inválida")
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/, "Formato de placa inválido (AAA0000 ou AAA0A00)"),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
  type: z.enum(["CAR", "MOTORCYCLE", "TRUCK", "VAN", "SUV"]).default("CAR"),
});

async function getManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");
  return { session, tenantId };
}

export async function createCustomer(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = CustomerSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;
  await prisma.customer.create({
    data: {
      tenantId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
    },
  });

  revalidatePath("/dashboard/clientes");
}

export async function updateCustomer(customerId: string, formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = CustomerSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
  });
  if (!customer) throw new Error("Cliente não encontrado.");

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
    },
  });

  revalidatePath("/dashboard/clientes");
}

export async function createVehicle(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = VehicleSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;
  const plate = data.plate.toUpperCase();

  // Verificar proprietário
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, tenantId },
  });
  if (!customer) throw new Error("Cliente não encontrado.");

  // Placa única por tenant (REGRA do schema)
  const existing = await prisma.vehicle.findFirst({
    where: { tenantId, plate },
  });
  if (existing) throw new Error(`Placa ${plate} já cadastrada neste lava-jato.`);

  await prisma.vehicle.create({
    data: {
      tenantId,
      customerId: data.customerId,
      plate,
      brand: data.brand || null,
      model: data.model || null,
      color: data.color || null,
      year: data.year || null,
      type: data.type,
    },
  });

  revalidatePath("/dashboard/clientes");
}

export async function deleteCustomer(customerId: string) {
  const { tenantId } = await getManagerSession();

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: { orders: { take: 1 } },
  });
  if (!customer) throw new Error("Cliente não encontrado.");
  if (customer.orders.length > 0) {
    throw new Error("Não é possível excluir cliente com Ordens de Serviço.");
  }

  await prisma.customer.delete({ where: { id: customerId } });
  revalidatePath("/dashboard/clientes");
}
