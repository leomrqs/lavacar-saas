import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientEquipe } from "./ClientEquipe";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function EquipePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "WASHER") redirect("/dashboard/patio");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const employees = await prisma.employee.findMany({
    where: { tenantId },
    include: {
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get commission data for the month (completed orders)
  const completedOrders = await prisma.order.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      completedAt: { gte: monthStart, lte: monthEnd },
    },
    select: { total: true },
  });

  const totalRevenueMonth = completedOrders.reduce((acc, o) => acc + o.total, 0);

  const serialized = employees.map((e) => {
    const estimatedCommission = e.isActive
      ? (totalRevenueMonth * e.commissionPct) / 100 / employees.filter((emp) => emp.isActive && emp.commissionPct > 0).length || 0
      : 0;

    return {
      id: e.id,
      name: e.name,
      role: e.role,
      phone: e.phone,
      salary: e.salary,
      commissionPct: e.commissionPct,
      isActive: e.isActive,
      email: e.user?.email ?? null,
      createdAt: e.createdAt.toISOString(),
      estimatedCommission,
    };
  });

  const activeCount = employees.filter((e) => e.isActive).length;
  const totalSalaries = employees.filter((e) => e.isActive).reduce((acc, e) => acc + e.salary, 0);

  return (
    <ClientEquipe
      employees={serialized}
      activeCount={activeCount}
      totalSalaries={totalSalaries}
      totalRevenueMonth={totalRevenueMonth}
    />
  );
}
