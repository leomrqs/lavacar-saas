"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, OrderStatus } from "@prisma/client";

// ─── Tipos ─────────────────────────────────────────────────────────────────

const OrderItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Nome do serviço obrigatório"),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  isService: z.boolean(),
});

const CreateOSSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatório"),
  vehicleId: z.string().min(1, "Veículo obrigatório"),
  status: z.enum(["PENDING", "WAITING_QUEUE"]).default("WAITING_QUEUE"),
  advancePayment: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "Pelo menos um serviço obrigatório"),
});

// ─── Transições permitidas ─────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["WAITING_QUEUE", "CANCELED"],
  WAITING_QUEUE: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["READY", "WAITING_QUEUE"],
  READY: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: ["IN_PROGRESS"],
  CANCELED: [],
};

const MANAGER_ONLY: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["CANCELED"],
  WAITING_QUEUE: ["CANCELED"],
  READY: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: ["IN_PROGRESS"],
};

// ─── syncFinance — REGRA 2 ──────────────────────────────────────────────────

async function syncFinance(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    tenantId: string;
    status: OrderStatus;
    total: number;
    advancePayment: number;
    paymentMethod?: string | null;
  }
) {
  const { id: orderId, tenantId, status, total, advancePayment, paymentMethod } = order;

  // PENDING / CANCELED — apagar lançamentos existentes
  if (status === "PENDING" || status === "CANCELED") {
    await tx.financialTransaction.deleteMany({
      where: { tenantId, orderId },
    });
    return;
  }

  const isPaid = status === "COMPLETED";
  const nowOrNull = isPaid ? new Date() : null;

  // Lançamento de adiantamento
  if (advancePayment > 0) {
    const tag = `ADVANCE_${orderId}`;
    const existing = await tx.financialTransaction.findFirst({
      where: { tenantId, notes: tag },
    });
    if (existing) {
      await tx.financialTransaction.update({
        where: { id: existing.id },
        data: {
          amount: advancePayment,
          status: isPaid ? "PAID" : "PENDING",
          paymentDate: nowOrNull,
          paymentMethod: isPaid ? (paymentMethod ?? existing.paymentMethod) : existing.paymentMethod,
        },
      });
    } else {
      await tx.financialTransaction.create({
        data: {
          tenantId,
          orderId,
          type: "INCOME",
          category: "SERVICO_LAVAGEM",
          description: `Adiantamento — OS #${orderId.slice(-6)}`,
          amount: advancePayment,
          status: isPaid ? "PAID" : "PENDING",
          paymentDate: nowOrNull,
          paymentMethod: isPaid ? paymentMethod : undefined,
          notes: tag,
        },
      });
    }
  }

  // Lançamento de saldo restante
  const restante = total - advancePayment;
  const tag = `BALANCE_${orderId}`;
  const existingBalance = await tx.financialTransaction.findFirst({
    where: { tenantId, notes: tag },
  });

  if (restante <= 0) {
    if (existingBalance) {
      await tx.financialTransaction.delete({ where: { id: existingBalance.id } });
    }
  } else if (existingBalance) {
    await tx.financialTransaction.update({
      where: { id: existingBalance.id },
      data: {
        amount: restante,
        status: isPaid ? "PAID" : "PENDING",
        paymentDate: nowOrNull,
        paymentMethod: isPaid ? (paymentMethod ?? existingBalance.paymentMethod) : existingBalance.paymentMethod,
      },
    });
  } else {
    await tx.financialTransaction.create({
      data: {
        tenantId,
        orderId,
        type: "INCOME",
        category: "SERVICO_LAVAGEM",
        description: `Serviços Realizados — OS #${orderId.slice(-6)}`,
        amount: restante,
        status: isPaid ? "PAID" : "PENDING",
        paymentDate: nowOrNull,
        paymentMethod: isPaid ? paymentMethod : undefined,
        notes: tag,
      },
    });
  }
}

// ─── updateOrderStatus — REGRA 3, 4, 10 ────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  paymentMethod?: string
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");

  const role = session.user.role;

  // Validar status
  const validStatus = [
    "PENDING", "WAITING_QUEUE", "IN_PROGRESS", "READY", "COMPLETED", "CANCELED",
  ] as const;
  if (!validStatus.includes(newStatus as OrderStatus)) {
    throw new Error("Status inválido.");
  }

  const targetStatus = newStatus as OrderStatus;

  await prisma.$transaction(async (tx) => {
    // REGRA 1 — Verificar tenant
    const order = await tx.order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });
    if (!order) throw new Error("OS não encontrada.");

    const fromStatus = order.status;

    // Verificar transição permitida
    if (!ALLOWED_TRANSITIONS[fromStatus]?.includes(targetStatus)) {
      throw new Error(`Transição de ${fromStatus} para ${targetStatus} não é permitida.`);
    }

    // Verificar permissão de role
    const managerOnlyTransitions = MANAGER_ONLY[fromStatus] ?? [];
    if (
      managerOnlyTransitions.includes(targetStatus) &&
      role !== "MANAGER" &&
      role !== "SUPER_ADMIN"
    ) {
      throw new Error("Apenas o gestor pode realizar esta transição.");
    }

    // REGRA 10 — Timestamps
    const timeUpdate: Prisma.OrderUpdateInput = {};
    if (targetStatus === "IN_PROGRESS" && fromStatus !== "READY") {
      timeUpdate.startedAt = new Date();
    }
    if (targetStatus === "READY") {
      timeUpdate.finishedAt = new Date();
    }
    if (targetStatus === "COMPLETED") {
      timeUpdate.completedAt = new Date();
    }

    // REGRA 4 — Programa de fidelidade ao COMPLETAR
    let loyaltyDiscount = 0;
    if (targetStatus === "COMPLETED" && fromStatus !== "COMPLETED") {
      const [tenant, customer] = await Promise.all([
        tx.tenant.findUnique({
          where: { id: tenantId },
          select: { loyaltyInterval: true, loyaltyDiscount: true },
        }),
        tx.customer.findUnique({
          where: { id: order.customerId },
          select: { totalWashes: true },
        }),
      ]);

      if (tenant && customer) {
        const newTotal = customer.totalWashes + 1;
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalWashes: { increment: 1 } },
        });

        if (newTotal % tenant.loyaltyInterval === 0) {
          loyaltyDiscount = tenant.loyaltyDiscount;
          const discountedTotal =
            loyaltyDiscount >= 100 ? 0 : order.total * (1 - loyaltyDiscount / 100);
          timeUpdate.total = discountedTotal;
          timeUpdate.notes =
            `${order.notes ?? ""} [FIDELIDADE: ${loyaltyDiscount}% de desconto na ${newTotal}ª lavagem]`.trim();
        }
      }
    }

    // Atualizar OS
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: targetStatus,
        paymentMethod: paymentMethod ?? order.paymentMethod,
        ...timeUpdate,
      },
    });

    // REGRA 3 — Controle de estoque
    const isNewCompletion = targetStatus === "COMPLETED" && fromStatus !== "COMPLETED";
    const isReopening = targetStatus === "IN_PROGRESS" && fromStatus === "COMPLETED";

    if (isNewCompletion || isReopening) {
      const insumoItems = order.items.filter(
        (item) => !item.isService && item.productId
      );

      for (const item of insumoItems) {
        if (!item.productId) continue;

        if (isNewCompletion) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.inventoryTransaction.create({
            data: {
              tenantId,
              productId: item.productId,
              orderId,
              type: "OUT",
              quantity: item.quantity,
              notes: `Consumo — OS #${orderId.slice(-6)}`,
            },
          });
        } else if (isReopening) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryTransaction.create({
            data: {
              tenantId,
              productId: item.productId,
              orderId,
              type: "IN",
              quantity: item.quantity,
              notes: `Estorno reabertura — OS #${orderId.slice(-6)}`,
            },
          });
        }
      }
    }

    // REGRA 2 — Motor financeiro
    await syncFinance(tx, {
      ...updatedOrder,
      paymentMethod: paymentMethod ?? updatedOrder.paymentMethod,
    });
  });

  revalidatePath("/dashboard/patio");
  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard");
}

// ─── createOS ───────────────────────────────────────────────────────────────

export async function createOS(formData: unknown) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");

  const parsed = CreateOSSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;
  const total = data.items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  );

  // REGRA 1 — verificar que cliente e veículo são do tenant
  const [customer, vehicle] = await Promise.all([
    prisma.customer.findFirst({ where: { id: data.customerId, tenantId } }),
    prisma.vehicle.findFirst({ where: { id: data.vehicleId, tenantId } }),
  ]);
  if (!customer) throw new Error("Cliente não encontrado.");
  if (!vehicle) throw new Error("Veículo não encontrado.");

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        tenantId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        status: data.status,
        total,
        advancePayment: data.advancePayment,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            isService: item.isService,
          })),
        },
      },
    });

    await syncFinance(tx, {
      id: order.id,
      tenantId,
      status: order.status,
      total: order.total,
      advancePayment: order.advancePayment,
      paymentMethod: order.paymentMethod,
    });
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
  revalidatePath("/dashboard");
}

// ─── deleteOS ───────────────────────────────────────────────────────────────

export async function deleteOS(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Sem permissão.");
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId, status: { in: ["PENDING", "CANCELED"] } },
  });
  if (!order) throw new Error("Apenas OS em Pendente ou Cancelado podem ser excluídas.");

  await prisma.order.delete({ where: { id: orderId } });

  revalidatePath("/dashboard/os");
}
