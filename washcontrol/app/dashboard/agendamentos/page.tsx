import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientAgendamentos } from "./ClientAgendamentos";
import { startOfDay, endOfDay, addDays } from "date-fns";

interface SearchParams {
  status?: string;
}

export default async function AgendamentosPage({
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
  const statusFilter = params.status ?? "";

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      vehicle: { select: { id: true, plate: true, brand: true, model: true, type: true } },
    },
    orderBy: { date: "asc" },
  });

  const customers = await prisma.customer.findMany({
    where: { tenantId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId },
    select: { id: true, plate: true, brand: true, model: true, customerId: true, type: true },
    orderBy: { plate: "asc" },
  });

  const services = await prisma.product.findMany({
    where: { tenantId, isService: true },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  });

  const today = new Date();
  const todayCount = appointments.filter(
    (a) => a.status === "SCHEDULED" && a.date >= startOfDay(today) && a.date <= endOfDay(today)
  ).length;
  const weekCount = appointments.filter(
    (a) => a.status === "SCHEDULED" && a.date >= startOfDay(today) && a.date <= endOfDay(addDays(today, 6))
  ).length;

  const serialized = appointments.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    status: a.status,
    notes: a.notes,
    orderId: a.orderId,
    customerName: a.customer.name,
    customerPhone: a.customer.phone,
    customerId: a.customer.id,
    vehiclePlate: a.vehicle?.plate ?? null,
    vehicleBrand: a.vehicle?.brand ?? null,
    vehicleModel: a.vehicle?.model ?? null,
    vehicleId: a.vehicleId,
    serviceId: a.serviceId,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <ClientAgendamentos
      appointments={serialized}
      customers={customers}
      vehicles={vehicles}
      services={services}
      todayCount={todayCount}
      weekCount={weekCount}
      currentStatus={statusFilter}
    />
  );
}
