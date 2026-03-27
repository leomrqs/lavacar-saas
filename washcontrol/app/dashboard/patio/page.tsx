import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientPatio } from "./ClientPatio";

export default async function PatioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      status: { in: ["WAITING_QUEUE", "IN_PROGRESS", "READY"] },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { plate: true, brand: true, model: true, color: true, type: true } },
      items: { where: { isService: true }, select: { name: true }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    customerName: o.customer.name,
    customerPhone: o.customer.phone ?? null,
    vehiclePlate: o.vehicle.plate,
    vehicleBrand: o.vehicle.brand ?? null,
    vehicleModel: o.vehicle.model ?? null,
    vehicleColor: o.vehicle.color ?? null,
    vehicleType: o.vehicle.type,
    serviceName: o.items[0]?.name ?? "Lavagem",
    startedAt: o.startedAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <ClientPatio
      initialOrders={serialized}
      role={session.user.role}
      tenantId={tenantId}
    />
  );
}
