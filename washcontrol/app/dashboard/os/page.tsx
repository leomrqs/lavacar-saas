import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientOS } from "./ClientOS";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 50;

interface SearchParams {
  page?: string;
  status?: string;
  search?: string;
}

export default async function OSPage({
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
  const page = Math.max(1, Number(params.page ?? 1));
  const status = params.status ?? "";
  const search = params.search ?? "";

  const validStatuses = [
    "PENDING",
    "WAITING_QUEUE",
    "IN_PROGRESS",
    "READY",
    "COMPLETED",
    "CANCELED",
  ];

  const where: Prisma.OrderWhereInput = {
    tenantId,
    ...(status && validStatuses.includes(status)
      ? { status: status as Prisma.EnumOrderStatusFilter }
      : {}),
    ...(search
      ? {
          OR: [
            { customer: { name: { contains: search, mode: "insensitive" } } },
            { vehicle: { plate: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
        items: { take: 3 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const serialized = orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    advancePayment: o.advancePayment,
    paymentMethod: o.paymentMethod ?? null,
    notes: o.notes ?? null,
    createdAt: o.createdAt.toISOString(),
    startedAt: o.startedAt?.toISOString() ?? null,
    finishedAt: o.finishedAt?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null,
    customerName: o.customer.name,
    vehiclePlate: o.vehicle.plate,
    vehicleBrand: o.vehicle.brand ?? null,
    vehicleModel: o.vehicle.model ?? null,
    items: o.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      isService: item.isService,
      productId: item.productId ?? null,
    })),
  }));

  // For the "New OS" modal we need customers + vehicles
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId },
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      customerId: true,
      type: true,
    },
    orderBy: { plate: "asc" },
  });

  return (
    <ClientOS
      orders={serialized}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      currentStatus={status}
      currentSearch={search}
      customers={customers}
      vehicles={vehicles}
      role={session.user.role}
    />
  );
}
