import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientConfiguracoes } from "./ClientConfiguracoes";

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "WASHER") redirect("/dashboard/patio");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      saasPlan: true,
      saasPrice: true,
      saasDueDate: true,
      billingCycleDay: true,
      monthlyGoal: true,
      loyaltyInterval: true,
      loyaltyDiscount: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          customers: true,
          orders: true,
          employees: true,
        },
      },
    },
  });

  if (!tenant) redirect("/login");

  return (
    <ClientConfiguracoes
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        saasPlan: tenant.saasPlan,
        saasPrice: tenant.saasPrice,
        saasDueDate: tenant.saasDueDate?.toISOString() ?? null,
        billingCycleDay: tenant.billingCycleDay,
        monthlyGoal: tenant.monthlyGoal,
        loyaltyInterval: tenant.loyaltyInterval,
        loyaltyDiscount: tenant.loyaltyDiscount,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt.toISOString(),
        userCount: tenant._count.users,
        customerCount: tenant._count.customers,
        orderCount: tenant._count.orders,
        employeeCount: tenant._count.employees,
      }}
    />
  );
}
