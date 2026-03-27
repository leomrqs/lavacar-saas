"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  category: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0),
  minStock: z.number().min(0),
  unit: z.string().default("un"),
  isService: z.boolean().default(false),
});

async function getManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");
  return { tenantId };
}

export async function createProduct(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = ProductSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  await prisma.product.create({
    data: { tenantId, ...parsed.data },
  });

  revalidatePath("/dashboard/insumos");
}

export async function updateProduct(productId: string, formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = ProductSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
  if (!product) throw new Error("Produto não encontrado.");

  await prisma.product.update({
    where: { id: productId },
    data: parsed.data,
  });

  revalidatePath("/dashboard/insumos");
}

export async function adjustStock(
  productId: string,
  quantity: number,
  type: "IN" | "OUT",
  notes?: string
) {
  const { tenantId } = await getManagerSession();

  const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
  if (!product) throw new Error("Produto não encontrado.");

  if (type === "OUT" && product.stock < quantity) {
    throw new Error("Estoque insuficiente.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        stock: type === "IN" ? { increment: quantity } : { decrement: quantity },
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        tenantId,
        productId,
        type,
        quantity,
        notes: notes || (type === "IN" ? "Entrada manual" : "Saída manual"),
      },
    });
  });

  revalidatePath("/dashboard/insumos");
}

export async function deleteProduct(productId: string) {
  const { tenantId } = await getManagerSession();

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    include: { items: { take: 1 } },
  });
  if (!product) throw new Error("Produto não encontrado.");
  if (product.items.length > 0) {
    throw new Error("Produto está vinculado a Ordens de Serviço e não pode ser excluído.");
  }

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/dashboard/insumos");
}
