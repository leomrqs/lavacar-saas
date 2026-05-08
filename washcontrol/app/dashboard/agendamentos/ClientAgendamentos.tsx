"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO, isToday, isTomorrow, isPast, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { createAppointment, cancelAppointment, generateOSFromAppointment } from "@/actions/appointments";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  orderId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerId: string;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleId: string | null;
  serviceId: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  customerId: string;
  type: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Props {
  appointments: Appointment[];
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
  todayCount: number;
  weekCount: number;
  currentStatus: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SCHEDULED: { label: "Agendado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  COMPLETED: { label: "Concluido", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  CANCELED: { label: "Cancelado", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", icon: XCircle },
};

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanha";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

// ── Modal Novo Agendamento ─────────────────────────────────────────────────

function ModalNovoAgendamento({
  onClose,
  onSuccess,
  customers,
  vehicles,
  services,
}: {
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
}) {
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isPending, startTransition] = useTransition();
  const customerRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );
  const filteredVehicles = vehicles.filter((v) => v.customerId === customerId);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerList(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { toast.error("Selecione um cliente."); return; }
    if (!date) { toast.error("Selecione uma data."); return; }

    startTransition(async () => {
      try {
        await createAppointment({
          customerId,
          vehicleId: vehicleId || undefined,
          date,
          serviceId: serviceId || undefined,
          notes: notes || undefined,
        });
        toast.success("Agendamento criado!");
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar agendamento.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">Novo Agendamento</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente *</label>
            <div ref={customerRef} className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={customerId ? (customers.find((c) => c.id === customerId)?.name ?? customerSearch) : customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(""); setVehicleId(""); setShowCustomerList(true); }}
                onFocus={() => setShowCustomerList(true)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              {showCustomerList && filteredCustomers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); setVehicleId(""); setShowCustomerList(false); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      <span className="font-medium">{c.name}</span>
                      {c.phone && <span className="text-zinc-500 ml-2 text-xs">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Data/Hora */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data e Hora *</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Veiculo */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Veiculo</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!customerId}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
            >
              <option value="">{customerId ? "Selecionar veiculo" : "Selecione um cliente primeiro"}</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate} — {[v.brand, v.model].filter(Boolean).join(" ") || "Veiculo"}</option>
              ))}
            </select>
          </div>

          {/* Servico */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Servico</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Selecionar servico</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Observacoes */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Observacoes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Cliente pediu lavagem completa"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all disabled:opacity-50">
              {isPending ? "Criando..." : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ClientAgendamentos({
  appointments,
  customers,
  vehicles,
  services,
  todayCount,
  weekCount,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [showNewModal, setShowNewModal] = useState(false);
  const [, startTransition] = useTransition();

  const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;

  function handleStatusFilter(status: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    startTransition(() => router.push(`/dashboard/agendamentos?${params.toString()}`));
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar este agendamento?")) return;
    try {
      await cancelAppointment(id);
      toast.success("Agendamento cancelado.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar.");
    }
  }

  async function handleGenerateOS(id: string) {
    try {
      await generateOSFromAppointment(id);
      toast.success("OS gerada a partir do agendamento!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar OS.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agendamentos"
        description={`${appointments.length} agendamentos`}
        action={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Agendados" value={String(scheduled)} icon={CalendarClock} iconColor="text-blue-400" />
        <KpiCard title="Hoje" value={String(todayCount)} icon={CalendarDays} iconColor="text-emerald-400" />
        <KpiCard title="Esta Semana" value={String(weekCount)} icon={Calendar} iconColor="text-purple-400" />
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[
          { value: "", label: "Todos" },
          { value: "SCHEDULED", label: "Agendados" },
          { value: "COMPLETED", label: "Concluidos" },
          { value: "CANCELED", label: "Cancelados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => handleStatusFilter(f.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              currentStatus === f.value
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-600"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento"
          description="Crie um agendamento para organizar a fila do seu lava-jato."
          action={
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all">
              <Plus className="w-4 h-4" /> Novo Agendamento
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const config = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.SCHEDULED;
            const StatusIcon = config.icon;
            const date = parseISO(apt.date);
            const isOverdue = apt.status === "SCHEDULED" && isPast(date);

            return (
              <div
                key={apt.id}
                className={cn(
                  "bg-zinc-900 border rounded-xl p-5 flex items-start gap-4 transition-all hover:border-zinc-700",
                  isOverdue ? "border-red-500/30" : "border-zinc-800"
                )}
              >
                {/* Date block */}
                <div className={cn("flex flex-col items-center justify-center w-16 h-16 rounded-xl shrink-0", isOverdue ? "bg-red-500/10" : "bg-zinc-800/80")}>
                  <span className={cn("text-lg font-bold", isOverdue ? "text-red-400" : "text-white")}>
                    {format(date, "dd")}
                  </span>
                  <span className={cn("text-[10px] uppercase tracking-wider font-medium", isOverdue ? "text-red-400/70" : "text-zinc-500")}>
                    {format(date, "MMM", { locale: ptBR })}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{apt.customerName}</p>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", config.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">Atrasado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(date, "HH:mm")}
                    </span>
                    {apt.vehiclePlate && (
                      <span className="font-mono font-bold text-zinc-400">{apt.vehiclePlate}</span>
                    )}
                    {(apt.vehicleBrand || apt.vehicleModel) && (
                      <span>{[apt.vehicleBrand, apt.vehicleModel].filter(Boolean).join(" ")}</span>
                    )}
                  </div>
                  {apt.notes && (
                    <p className="text-xs text-zinc-600 mt-1.5 truncate">{apt.notes}</p>
                  )}
                </div>

                {/* Actions */}
                {apt.status === "SCHEDULED" && (
                  <div className="flex items-center gap-2 shrink-0">
                    {apt.vehicleId && !apt.orderId && (
                      <button
                        onClick={() => handleGenerateOS(apt.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 text-xs font-medium transition-all"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Gerar OS
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {apt.orderId && (
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg font-medium shrink-0">
                    OS vinculada
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showNewModal && (
        <ModalNovoAgendamento
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { setShowNewModal(false); router.refresh(); }}
          customers={customers}
          vehicles={vehicles}
          services={services}
        />
      )}
    </div>
  );
}
