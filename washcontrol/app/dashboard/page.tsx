import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientDashboard } from "./ClientDashboard";
import { ClientDashboardSuperAdmin } from "./ClientDashboardSuperAdmin";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

export default async function DashboardPage() {
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

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [
    tenant,
    ordersToday,
    ordersActive,
    faturamentoHoje,
    faturamentoMes,
    ordersWeek,
    ordersMonth,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { monthlyGoal: true, name: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        completedAt: { gte: todayStart, lte: todayEnd },
      },
      select: { id: true, total: true, startedAt: true, finishedAt: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ["WAITING_QUEUE", "IN_PROGRESS", "READY"] },
      },
      select: { id: true, status: true },
    }),
    prisma.financialTransaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        status: "PAID",
        paymentDate: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        status: "PAID",
        paymentDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    // Lavagens dos últimos 7 dias para gráfico
    prisma.order.groupBy({
      by: ["completedAt"],
      where: {
        tenantId,
        status: "COMPLETED",
        completedAt: { gte: subDays(today, 6) },
      },
      _count: { id: true },
    }),
    // Lavagens por categoria no mês
    prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          tenantId,
          status: "COMPLETED",
          completedAt: { gte: monthStart, lte: monthEnd },
        },
        isService: true,
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
  ]);

  // Calcular tempo médio de lavagem do dia
  const tempoMedio = (() => {
    const valid = ordersToday.filter((o) => o.startedAt && o.finishedAt);
    if (!valid.length) return 0;
    const totalMs = valid.reduce(
      (acc, o) =>
        acc + (o.finishedAt!.getTime() - o.startedAt!.getTime()),
      0
    );
    return Math.round(totalMs / valid.length / 60000); // minutos
  })();

  const faturamentoHojeVal = faturamentoHoje._sum.amount ?? 0;
  const faturamentoMesVal = faturamentoMes._sum.amount ?? 0;
  const ticketMedio =
    ordersToday.length > 0
      ? faturamentoHojeVal / ordersToday.length
      : 0;

  return (
    <ClientDashboard
      lavagensHoje={ordersToday.length}
      faturamentoHoje={faturamentoHojeVal}
      faturamentoMes={faturamentoMesVal}
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
    />
  );
}
