"use client";

import { useState, useCallback, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  ChevronDown,
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { updateOrderStatus, createOS } from "@/actions/os";
import { formatBRL, ORDER_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isService: boolean;
  productId: string | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  advancePayment: number;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  completedAt: string | null;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  items: OrderItem[];
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

interface Props {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus: string;
  currentSearch: string;
  customers: Customer[];
  vehicles: Vehicle[];
  role: string;
}

// ─── Status transitions ──────────────────────────────────────────────────────

interface Transition {
  label: string;
  newStatus: string;
  requiresPayment?: boolean;
}

function getTransitions(status: string, role: string): Transition[] {
  switch (status) {
    case "PENDING":
      return [
        { label: "Mover para Fila", newStatus: "WAITING_QUEUE" },
        { label: "Cancelar", newStatus: "CANCELED" },
      ];
    case "WAITING_QUEUE":
      return [
        { label: "Iniciar Lavagem", newStatus: "IN_PROGRESS" },
        { label: "Cancelar", newStatus: "CANCELED" },
      ];
    case "IN_PROGRESS":
      return [{ label: "Marcar como Pronto", newStatus: "READY" }];
    case "READY":
      return [
        { label: "Finalizar (Pago)", newStatus: "COMPLETED", requiresPayment: true },
      ];
    case "COMPLETED":
      if (role === "MANAGER" || role === "SUPER_ADMIN") {
        return [{ label: "Reabrir", newStatus: "IN_PROGRESS" }];
      }
      return [];
    default:
      return [];
  }
}

// ─── Payment Modal ───────────────────────────────────────────────────────────

function PaymentModal({
  orderId,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  orderId: string;
  onClose: () => void;
  onConfirm: (orderId: string, method: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [method, setMethod] = useState("PIX");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Confirmar Pagamento</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-zinc-400 mb-4">Selecione o método de pagamento para finalizar a OS.</p>
        <div className="space-y-2 mb-6">
          {[
            { value: "PIX", label: "Pix" },
            { value: "DINHEIRO", label: "Dinheiro" },
            { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
            { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                method === opt.value
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-zinc-800 hover:border-zinc-700"
              )}
            >
              <input
                type="radio"
                value={opt.value}
                checked={method === opt.value}
                onChange={() => setMethod(opt.value)}
                className="accent-sky-500"
              />
              <span className="text-sm text-white">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(orderId, method)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Finalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Actions Dropdown ────────────────────────────────────────────────────────

function ActionsDropdown({
  order,
  role,
  onTransition,
  onPaymentRequired,
}: {
  order: Order;
  role: string;
  onTransition: (orderId: string, newStatus: string) => Promise<void>;
  onPaymentRequired: (orderId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const transitions = getTransitions(order.status, role);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (transitions.length === 0) return <span className="text-xs text-zinc-600">—</span>;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={submitting}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-xs font-medium disabled:opacity-50"
      >
        Ações <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 min-w-[180px]">
          {transitions.map((tr) => (
            <button
              key={tr.newStatus}
              disabled={submitting}
              onClick={async () => {
                setOpen(false);
                if (tr.requiresPayment) {
                  onPaymentRequired(order.id);
                } else {
                  setSubmitting(true);
                  await onTransition(order.id, tr.newStatus);
                  setSubmitting(false);
                }
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-50",
                tr.newStatus === "CANCELED"
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New OS Form Item ─────────────────────────────────────────────────────────

interface FormItem {
  _key: number;
  name: string;
  quantity: number;
  unitPrice: number;
  isService: boolean;
}

// ─── New OS Modal ─────────────────────────────────────────────────────────────

function NewOSModal({
  onClose,
  customers,
  vehicles,
}: {
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"PENDING" | "WAITING_QUEUE">("WAITING_QUEUE");
  const [items, setItems] = useState<FormItem[]>([
    { _key: 0, name: "", quantity: 1, unitPrice: 0, isService: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(1);

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

  function addItem() {
    setItems((prev) => [
      ...prev,
      { _key: nextKey.current++, name: "", quantity: 1, unitPrice: 0, isService: true },
    ]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateItem(key: number, field: keyof Omit<FormItem, "_key">, value: string | number | boolean) {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, [field]: value } : i))
    );
  }

  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { toast.error("Selecione um cliente."); return; }
    if (!vehicleId) { toast.error("Selecione um veículo."); return; }
    if (items.some((i) => !i.name.trim())) { toast.error("Preencha o nome de todos os serviços."); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um serviço."); return; }

    setSubmitting(true);
    try {
      await createOS({
        customerId,
        vehicleId,
        status,
        advancePayment,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          isService: i.isService,
        })),
      });
      toast.success("OS criada com sucesso!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar OS.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-base font-bold text-white">Nova Ordem de Serviço</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente *</label>
            <div ref={customerRef} className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={customerId
                  ? (customers.find((c) => c.id === customerId)?.name ?? customerSearch)
                  : customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerId("");
                  setVehicleId("");
                  setShowCustomerList(true);
                }}
                onFocus={() => setShowCustomerList(true)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
              />
              {showCustomerList && filteredCustomers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(c.id);
                        setCustomerSearch(c.name);
                        setVehicleId("");
                        setShowCustomerList(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.phone && <span className="text-zinc-500 ml-2 text-xs">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Veículo */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Veículo *</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!customerId}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
            >
              <option value="">
                {customerId ? "Selecione um veículo" : "Selecione um cliente primeiro"}
              </option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {[v.brand, v.model].filter(Boolean).join(" ") || "Veículo"}
                </option>
              ))}
            </select>
          </div>

          {/* Status inicial */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "PENDING" | "WAITING_QUEUE")}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="WAITING_QUEUE">Mover para Fila imediatamente</option>
              <option value="PENDING">Manter como Agendado</option>
            </select>
          </div>

          {/* Itens / Serviços */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400">Serviços *</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar linha
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item._key} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nome do serviço"
                    value={item.name}
                    onChange={(e) => updateItem(item._key, "name", e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="number"
                    placeholder="Qtd"
                    min={0.01}
                    step={0.01}
                    value={item.quantity}
                    onChange={(e) => updateItem(item._key, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="number"
                    placeholder="Preço"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item._key, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-sky-500"
                  />
                  <select
                    value={item.isService ? "service" : "product"}
                    onChange={(e) => updateItem(item._key, "isService", e.target.value === "service")}
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="service">Serviço</option>
                    <option value="product">Insumo</option>
                  </select>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item._key)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm text-zinc-400">
              Total: <span className="text-white font-semibold">{formatBRL(total)}</span>
            </div>
          </div>

          {/* Adiantamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Adiantamento (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={advancePayment}
                onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Método de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Não definido</option>
                <option value="PIX">Pix</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações sobre a OS..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-os-form"
            disabled={submitting}
            onClick={(e) => {
              e.preventDefault();
              const formEl = document.getElementById("new-os-submit-trigger");
              formEl?.click();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Criando..." : "Criar OS"}
          </button>
        </div>

        {/* Hidden submit trigger */}
        <button
          id="new-os-submit-trigger"
          className="hidden"
          onClick={(e) => {
            const form = (e.target as HTMLElement)
              .closest(".fixed")
              ?.querySelector("form");
            form?.requestSubmit();
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ClientOS({
  orders,
  total,
  page,
  pageSize,
  currentStatus,
  currentSearch,
  customers,
  vehicles,
  role,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const totalPages = Math.ceil(total / pageSize);

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.set("page", "1");
    startTransition(() => router.push(`/dashboard/os?${params.toString()}`));
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value });
    }, 300);
  }

  function handleStatusChange(value: string) {
    pushParams({ status: value });
  }

  function handlePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/dashboard/os?${params.toString()}`);
  }

  async function handleTransition(orderId: string, newStatus: string) {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success("Status atualizado com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status.");
    }
  }

  async function handlePaymentConfirm(orderId: string, method: string) {
    setIsPaymentSubmitting(true);
    try {
      await updateOrderStatus(orderId, "COMPLETED", method);
      toast.success("OS finalizada com sucesso!");
      setPaymentOrderId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao finalizar OS.");
    } finally {
      setIsPaymentSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full p-6">
      <PageHeader
        title="Ordens de Serviço"
        description={`${total} OS encontradas`}
        action={
          <button
            onClick={() => setShowNewOSModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nova OS
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar cliente ou placa..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma OS encontrada"
          description={
            currentSearch || currentStatus
              ? "Tente ajustar os filtros para encontrar o que procura."
              : "Crie sua primeira Ordem de Serviço para começar."
          }
          action={
            !currentSearch && !currentStatus ? (
              <button
                onClick={() => setShowNewOSModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Nova OS
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 flex-1">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">OS#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Veículo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Serviços</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-mono font-semibold tracking-wider text-xs">
                        {order.vehiclePlate}
                      </span>
                      {(order.vehicleBrand || order.vehicleModel) && (
                        <p className="text-zinc-500 text-xs">
                          {[order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 2).map((item) => (
                          <span
                            key={item.id}
                            className="text-xs bg-zinc-800 text-zinc-300 rounded-md px-1.5 py-0.5 truncate max-w-[100px]"
                          >
                            {item.name}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-xs text-zinc-500">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {formatBRL(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {format(new Date(order.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionsDropdown
                        order={order}
                        role={role}
                        onTransition={handleTransition}
                        onPaymentRequired={(id) => setPaymentOrderId(id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-zinc-500">
                Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>
                <span className="text-xs text-zinc-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showNewOSModal && (
        <NewOSModal
          onClose={() => setShowNewOSModal(false)}
          customers={customers}
          vehicles={vehicles}
        />
      )}

      {paymentOrderId && (
        <PaymentModal
          orderId={paymentOrderId}
          onClose={() => setPaymentOrderId(null)}
          onConfirm={handlePaymentConfirm}
          isSubmitting={isPaymentSubmitting}
        />
      )}
    </div>
  );
}
