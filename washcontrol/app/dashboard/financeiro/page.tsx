import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subMonths, format } from "date-fns";
import { ClientFinanceiro } from "./ClientFinanceiro";
import {
  getCycleDates,
  getCurrentCycleMonth,
  parseMonthParam,
  toMonthParam,
  shiftMonth,
} from "@/lib/cycle";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "WASHER") redirect("/dashboard/patio");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  // Busca configurações do tenant (inclusive o dia de início do ciclo)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { billingCycleDay: true, monthlyGoal: true },
  });

  const cycleDay = tenant?.billingCycleDay ?? 1;
  const today = new Date();

  // Determina o mês do ciclo atual (baseado no cycleDay)
  const currentCycle = getCurrentCycleMonth(today, cycleDay);

  // Lê o parâmetro ?month=YYYY-MM da URL
  const params = await searchParams;
  const selected = parseMonthParam(params.month, currentCycle.year, currentCycle.month);
  const { cycleStart, cycleEnd, year, month } = getCycleDates(
    selected.year,
    selected.month,
    cycleDay
  );

  // Gera os últimos 6 meses de ciclo para o gráfico sparkline
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const shifted = shiftMonth(selected.year, selected.month, i - 5);
    const cycle = getCycleDates(shifted.year, shifted.month, cycleDay);
    return { ...cycle, label: format(cycle.cycleStart, "MMM/yy") };
  });

  const [transactions, fixedExpenses, monthlySummaryRaw] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: {
        tenantId,
        OR: [
          { paymentDate: { gte: cycleStart, lte: cycleEnd } },
          { paymentDate: null, createdAt: { gte: cycleStart, lte: cycleEnd } },
        ],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fixedExpense.findMany({
      where: { tenantId },
      orderBy: { dueDay: "asc" },
    }),
    Promise.all(
      last6Months.map(async (m6) => {
        const agg = await prisma.financialTransaction.aggregate({
          where: {
            tenantId,
            type: "INCOME",
            status: "PAID",
            paymentDate: { gte: m6.cycleStart, lte: m6.cycleEnd },
          },
          _sum: { amount: true },
        });
        return {
          month: m6.label,
          monthKey: toMonthParam(m6.year, m6.month),
          total: agg._sum.amount ?? 0,
        };
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

  // Calcula quais despesas fixas NÃO foram lançadas neste ciclo
  const launchedNames = new Set(
    transactions
      .filter((t) => t.type === "EXPENSE" && t.category === "DESPESA_FIXA")
      .map((t) => t.description.trim().toLowerCase())
  );
  const pendingFixedExpenses = fixedExpenses
    .filter((fe) => fe.isActive && !launchedNames.has(fe.name.trim().toLowerCase()))
    .map((fe) => fe.name);

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
      currentMonth={month}
      currentYear={year}
      cycleDay={cycleDay}
      cycleStart={cycleStart.toISOString()}
      cycleEnd={cycleEnd.toISOString()}
      currentMonthParam={toMonthParam(currentCycle.year, currentCycle.month)}
      selectedMonthParam={toMonthParam(selected.year, selected.month)}
      pendingFixedExpenseNames={pendingFixedExpenses}
    />
  );
}
