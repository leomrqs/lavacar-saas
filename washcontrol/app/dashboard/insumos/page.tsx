import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientInsumos } from "./ClientInsumos";

interface SearchParams {
  tab?: string;
  search?: string;
}

export default async function InsumosPage({
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
  const tab = params.tab ?? "products";
  const search = params.search ?? "";

  const products = await prisma.product.findMany({
    where: {
      tenantId,
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  const recentTransactions = await prisma.inventoryTransaction.findMany({
    where: { tenantId },
    include: {
      product: { select: { name: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const lowStockCount = products.filter(
    (p) => !p.isService && p.stock <= p.minStock && p.minStock > 0
  ).length;

  const totalItems = products.filter((p) => !p.isService).length;
  const totalServices = products.filter((p) => p.isService).length;

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    minStock: p.minStock,
    unit: p.unit,
    isService: p.isService,
  }));

  const serializedTransactions = recentTransactions.map((t) => ({
    id: t.id,
    productName: t.product.name,
    productUnit: t.product.unit,
    type: t.type,
    quantity: t.quantity,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <ClientInsumos
      products={serializedProducts}
      transactions={serializedTransactions}
      lowStockCount={lowStockCount}
      totalItems={totalItems}
      totalServices={totalServices}
      currentTab={tab}
      currentSearch={search}
    />
  );
}
