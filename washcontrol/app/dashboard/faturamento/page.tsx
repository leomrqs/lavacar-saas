import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientFaturamento } from "./ClientFaturamento";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export default async function FaturamentoPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const today = new Date();

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      saasPlan: true,
      saasPrice: true,
      saasDueDate: true,
      isActive: true,
      billingCycleDay: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  const activeTenants = tenants.filter((t) => t.isActive);
  const mrr = activeTenants.reduce((acc, t) => acc + t.saasPrice, 0);
  const arr = mrr * 12;

  // Monthly revenue breakdown (last 6 months)
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    const activeThatMonth = tenants.filter(
      (t) => t.isActive && new Date(t.createdAt) <= endOfMonth(d)
    );
    return {
      month: format(d, "MMM/yy"),
      revenue: activeThatMonth.reduce((acc, t) => acc + t.saasPrice, 0),
      count: activeThatMonth.length,
    };
  });

  // Tenants with overdue payments
  const overdueTenants = tenants.filter(
    (t) => t.isActive && t.saasDueDate && new Date(t.saasDueDate) < today
  );

  const serialized = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    saasPlan: t.saasPlan,
    saasPrice: t.saasPrice,
    saasDueDate: t.saasDueDate?.toISOString() ?? null,
    isActive: t.isActive,
    billingCycleDay: t.billingCycleDay,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <ClientFaturamento
      tenants={serialized}
      mrr={mrr}
      arr={arr}
      activeCount={activeTenants.length}
      totalCount={tenants.length}
      overdueCount={overdueTenants.length}
      monthlyRevenue={monthlyRevenue}
    />
  );
}
