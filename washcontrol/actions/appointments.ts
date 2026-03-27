"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateAppointmentSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatório"),
  vehicleId: z.string().optional(),
  date: z.string().min(1, "Data obrigatória"),
  serviceId: z.string().optional(),
  notes: z.string().optional(),
});

export async function createAppointment(formData: unknown) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");

  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");

  const parsed = CreateAppointmentSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;

  // Verificar cliente
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, tenantId },
  });
  if (!customer) throw new Error("Cliente não encontrado.");

  await prisma.appointment.create({
    data: {
      tenantId,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      date: new Date(data.date),
      serviceId: data.serviceId,
      notes: data.notes,
      status: "SCHEDULED",
    },
  });

  revalidatePath("/dashboard/agendamentos");
}

export async function cancelAppointment(appointmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");

  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId, status: "SCHEDULED" },
  });
  if (!appointment) throw new Error("Agendamento não encontrado.");

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELED" },
  });

  revalidatePath("/dashboard/agendamentos");
}

// REGRA 5 — Idempotência de Agendamentos
export async function generateOSFromAppointment(appointmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "WASHER") throw new Error("Sem permissão.");

  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Tenant inválido.");

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: { vehicle: true },
  });

  if (!appointment) throw new Error("Agendamento não encontrado.");
  if (appointment.orderId) throw new Error("Este agendamento já possui uma OS gerada.");
  if (!appointment.vehicleId) throw new Error("Agendamento sem veículo. Vincule um veículo antes de gerar a OS.");

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        tenantId,
        customerId: appointment.customerId,
        vehicleId: appointment.vehicleId!,
        status: "WAITING_QUEUE",
        total: 0,
        advancePayment: 0,
        notes: appointment.notes,
      },
    });

    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        orderId: order.id,
      },
    });
  });

  revalidatePath("/dashboard/agendamentos");
  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
}
