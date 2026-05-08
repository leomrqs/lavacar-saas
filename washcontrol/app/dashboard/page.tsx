import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientDashboard } from "./ClientDashboard";
import { ClientDashboardSuperAdmin } from "./ClientDashboardSuperAdmin";
import { subDays } from "date-fns";
import {
  getCycleDates,
  getCurrentCycleMonth,
  parseMonthParam,
  toMonthParam,
  shiftMonth,
} from "@/lib/cycle";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // ── SUPER_ADMIN dashboard ──────────────────────────────────────────────
  if (session.user.role === "SUPER_ADMIN") {
    const [totalTenants, activeTenants, allTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          saasPlan: true,
          saasPrice: true,
          isActive: true,
          saasDueDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const mrr = allTenants.reduce(
      (acc, t) => acc + (t.isActive ? t.saasPrice : 0),
      0
    );

    return (
      <ClientDashboardSuperAdmin
        totalTenants={totalTenants}
        activeTenants={activeTenants}
        mrr={mrr}
        arr={mrr * 12}
        recentTenants={allTenants.map((t) => ({
          ...t,
          saasDueDate: t.saasDueDate?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    );
  }

  // ── MANAGER / WASHER dashboard ─────────────────────────────────────────
  if (!session.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { monthlyGoal: true, name: true, billingCycleDay: true },
  });

  const cycleDay = tenant?.billingCycleDay ?? 1;
  const today = new Date();

  // Ciclo atual baseado no cycleDay
  const currentCycle = getCurrentCycleMonth(today, cycleDay);

  // Lê ?month= da URL
  const params = await searchParams;
  const selected = parseMonthParam(params.month, currentCycle.year, currentCycle.month);
  const { cycleStart, cycleEnd, year, month } = getCycleDates(
    selected.year,
    selected.month,
    cycleDay
  );

  // Últimos 7 dias (sempre do dia atual para lavagens recentes)
  const sevenDaysAgo = subDays(today, 6);

  const [
    ordersToday,
    ordersActive,
    faturamentoCiclo,
    faturamentoHoje,
    ordersWeek,
    ordersMonth,
  ] = await Promise.all([
    // Lavagens completadas no ciclo selecionado (para KPIs do ciclo)
    prisma.order.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        completedAt: { gte: cycleStart, lte: cycleEnd },
      },
      select: { id: true, total: true, startedAt: true, finishedAt: true },
    }),
    // OS ativas agora
    prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ["WAITING_QUEUE", "IN_PROGRESS", "READY"] },
      },
      select: { id: true, status: true },
    }),
    // Faturamento do ciclo selecionado
    prisma.financialTransaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        status: "PAID",
        paymentDate: { gte: cycleStart, lte: cycleEnd },
      },
      _sum: { amount: true },
    }),
    // Faturamento de hoje (sempre)
    prisma.financialTransaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        status: "PAID",
        paymentDate: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()), lte: today },
      },
      _sum: { amount: true },
    }),
    // Lavagens dos últimos 7 dias para gráfico
    prisma.order.groupBy({
      by: ["completedAt"],
      where: {
        tenantId,
        status: "COMPLETED",
        completedAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    }),
    // Serviços mais realizados no ciclo
    prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          tenantId,
          status: "COMPLETED",
          completedAt: { gte: cycleStart, lte: cycleEnd },
        },
        isService: true,
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
  ]);

  // Tempo médio das lavagens do ciclo
  const tempoMedio = (() => {
    const valid = ordersToday.filter((o) => o.startedAt && o.finishedAt);
    if (!valid.length) return 0;
    const totalMs = valid.reduce(
      (acc, o) => acc + (o.finishedAt!.getTime() - o.startedAt!.getTime()),
      0
    );
    return Math.round(totalMs / valid.length / 60000);
  })();

  const faturamentoCicloVal = faturamentoCiclo._sum.amount ?? 0;
  const faturamentoHojeVal = faturamentoHoje._sum.amount ?? 0;
  const ticketMedio =
    ordersToday.length > 0 ? faturamentoCicloVal / ordersToday.length : 0;

  return (
    <ClientDashboard
      lavagensHoje={ordersToday.length}
      faturamentoHoje={faturamentoHojeVal}
      faturamentoMes={faturamentoCicloVal}
      ticketMedio={ticketMedio}
      tempoMedio={tempoMedio}
      ordersAtivas={ordersActive.length}
      monthlyGoal={tenant?.monthlyGoal ?? 0}
      chartWeek={ordersWeek.map((g) => ({
        date: g.completedAt?.toISOString().slice(0, 10) ?? "",
        count: g._count.id,
      }))}
      chartCategories={ordersMonth.map((g) => ({
        name: g.name,
        value: g._count.id,
      }))}
      cycleDay={cycleDay}
      cycleStart={cycleStart.toISOString()}
      cycleEnd={cycleEnd.toISOString()}
      selectedMonthParam={toMonthParam(selected.year, selected.month)}
      currentMonthParam={toMonthParam(currentCycle.year, currentCycle.month)}
    />
  );
}
