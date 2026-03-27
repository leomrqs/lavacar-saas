import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ClientFinanceiro } from "./ClientFinanceiro";

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "WASHER") redirect("/dashboard/patio");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [transactions, fixedExpenses, monthlySummaryRaw] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: {
        tenantId,
        OR: [
          { paymentDate: { gte: monthStart, lte: monthEnd } },
          {
            paymentDate: null,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fixedExpense.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
    // Last 6 months summary for sparkline
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(today, 5 - i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        return prisma.financialTransaction.aggregate({
          where: {
            tenantId,
            type: "INCOME",
            status: "PAID",
            paymentDate: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }).then((agg) => ({
          month: format(d, "MMM", { locale: undefined }),
          monthKey: format(d, "yyyy-MM"),
          total: agg._sum.amount ?? 0,
        }));
      })
    ),
  ]);

  const totalEntradas = transactions
    .filter((t) => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSaidas = transactions
    .filter((t) => t.type === "EXPENSE" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  return (
    <ClientFinanceiro
      tenantId={tenantId}
      transactions={transactions.map((t) => ({
        id: t.id,
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount,
        status: t.status,
        paymentMethod: t.paymentMethod ?? null,
        paymentDate: t.paymentDate?.toISOString() ?? null,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
      fixedExpenses={fixedExpenses.map((fe) => ({
        id: fe.id,
        name: fe.name,
        amount: fe.amount,
        dueDay: fe.dueDay,
        category: fe.category ?? null,
        isActive: fe.isActive,
        createdAt: fe.createdAt.toISOString(),
      }))}
      totalEntradas={totalEntradas}
      totalSaidas={totalSaidas}
      saldo={saldo}
      monthlySummary={monthlySummaryRaw}
      currentMonth={today.getMonth() + 1}
      currentYear={today.getFullYear()}
    />
  );
}
