"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  status: z.enum(["PENDING", "PAID"]).default("PENDING"),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

async function getManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");
  return { session, tenantId };
}

export async function createTransaction(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = TransactionSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;

  await prisma.financialTransaction.create({
    data: {
      tenantId,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      status: data.status,
      paymentMethod: data.paymentMethod || null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/dashboard/financeiro");
}

export async function markTransactionPaid(transactionId: string, paymentMethod?: string) {
  const { tenantId } = await getManagerSession();

  const tx = await prisma.financialTransaction.findFirst({
    where: { id: transactionId, tenantId },
  });
  if (!tx) throw new Error("Transação não encontrada.");

  await prisma.financialTransaction.update({
    where: { id: transactionId },
    data: {
      status: "PAID",
      paymentDate: new Date(),
      paymentMethod: paymentMethod || tx.paymentMethod,
    },
  });

  revalidatePath("/dashboard/financeiro");
}

export async function deleteTransaction(transactionId: string) {
  const { tenantId } = await getManagerSession();

  const tx = await prisma.financialTransaction.findFirst({
    where: { id: transactionId, tenantId },
  });
  if (!tx) throw new Error("Transação não encontrada.");

  await prisma.financialTransaction.delete({ where: { id: transactionId } });
  revalidatePath("/dashboard/financeiro");
}

// REGRA 6 — Idempotência: gerar despesas fixas do mês
export async function generateMonthlyFixedExpenses(
  tenantId: string,
  month: number,
  year: number
) {
  const expenses = await prisma.fixedExpense.findMany({
    where: { tenantId, isActive: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const expense of expenses) {
      const tag = `FIXED_EXPENSE_${expense.id}_${month}_${year}`;
      const existing = await tx.financialTransaction.findFirst({
        where: { tenantId, notes: tag },
      });
      if (existing) continue;

      const dueDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(expense.dueDay).padStart(2, "0")}T12:00:00Z`);

      await tx.financialTransaction.create({
        data: {
          tenantId,
          type: "EXPENSE",
          category: expense.category ?? "DESPESA_FIXA",
          description: expense.name,
          amount: expense.amount,
          status: "PENDING",
          dueDate,
          notes: tag,
        },
      });
    }
  });

  revalidatePath("/dashboard/financeiro");
}

// REGRA 6 — Idempotência: gerar salários do mês
export async function generateMonthlySalaries(
  tenantId: string,
  month: number,
  year: number
) {
  const employees = await prisma.employee.findMany({
    where: { tenantId, isActive: true, salary: { gt: 0 } },
  });

  await prisma.$transaction(async (tx) => {
    for (const emp of employees) {
      const tag = `SALARY_EMP_${emp.id}_${month}_${year}`;
      const existing = await tx.financialTransaction.findFirst({
        where: { tenantId, notes: tag },
      });
      if (existing) continue;

      const dueDate = new Date(`${year}-${String(month).padStart(2, "0")}-05T12:00:00Z`);

      await tx.financialTransaction.create({
        data: {
          tenantId,
          type: "EXPENSE",
          category: "SALARIO",
          description: `Salário — ${emp.name}`,
          amount: emp.salary,
          status: "PENDING",
          dueDate,
          notes: tag,
        },
      });
    }
  });

  revalidatePath("/dashboard/financeiro");
}

// Gerenciar despesas fixas
const FixedExpenseSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  amount: z.number().min(0.01),
  dueDay: z.number().int().min(1).max(28),
  category: z.string().optional(),
});

export async function createFixedExpense(formData: unknown) {
  const { tenantId } = await getManagerSession();

  const parsed = FixedExpenseSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  await prisma.fixedExpense.create({
    data: { tenantId, ...parsed.data },
  });

  revalidatePath("/dashboard/financeiro");
}

export async function deleteFixedExpense(id: string) {
  const { tenantId } = await getManagerSession();

  await prisma.fixedExpense.deleteMany({ where: { id, tenantId } });
  revalidatePath("/dashboard/financeiro");
}
