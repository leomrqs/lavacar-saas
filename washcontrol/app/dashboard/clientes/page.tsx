import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientClientes } from "./ClientClientes";

interface SearchParams {
  search?: string;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "WASHER") redirect("/dashboard/patio");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const params = await searchParams;
  const search = params.search ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      vehicles: {
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
          color: true,
          year: true,
          type: true,
        },
        orderBy: { plate: "asc" },
      },
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalWashes: c.totalWashes,
    orderCount: c._count.orders,
    createdAt: c.createdAt.toISOString(),
    vehicles: c.vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      color: v.color,
      year: v.year,
      type: v.type,
    })),
  }));

  return <ClientClientes customers={serialized} initialSearch={search} />;
}
