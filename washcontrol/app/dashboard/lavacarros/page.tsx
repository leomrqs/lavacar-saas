import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientLavacarros } from "./ClientLavacarros";

interface SearchParams {
  search?: string;
  plan?: string;
}

export default async function LavacarrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const search = params.search ?? "";
  const plan = params.plan ?? "";

  const validPlans = ["BASIC", "PRO", "ENTERPRISE"];

  const tenants = await prisma.tenant.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(plan && validPlans.includes(plan) ? { saasPlan: plan } : {}),
    },
    include: {
      _count: {
        select: {
          users: true,
          orders: {
            where: { status: "COMPLETED" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    isActive: t.isActive,
    saasPlan: t.saasPlan,
    saasPrice: t.saasPrice,
    saasDueDate: t.saasDueDate?.toISOString() ?? null,
    billingCycleDay: t.billingCycleDay,
    monthlyGoal: t.monthlyGoal,
    createdAt: t.createdAt.toISOString(),
    userCount: t._count.users,
    completedOrders: t._count.orders,
  }));

  return (
    <ClientLavacarros
      tenants={serialized}
      initialSearch={search}
      initialPlan={plan}
    />
  );
}
