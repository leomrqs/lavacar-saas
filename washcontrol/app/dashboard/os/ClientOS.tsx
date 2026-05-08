"use client";

import { useState, useRef, useTransition } from "react";
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
  Car,
  User,
  CreditCard,
  Clock,
  CheckCircle2,
  FileText,
  Package,
  Wrench,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { updateOrderStatus, createOS, deleteOS } from "@/actions/os";
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
  catalog: CatalogProduct[];
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
      if (role === "MANAGER" || role === "SUPER_ADMIN") {
        return [
          { label: "Finalizar e Cobrar", newStatus: "COMPLETED", requiresPayment: true },
          { label: "Voltar para Lavagem", newStatus: "IN_PROGRESS" },
        ];
      }
      return [];
    case "COMPLETED":
      if (role === "MANAGER" || role === "SUPER_ADMIN") {
        return [{ label: "Reabrir OS", newStatus: "IN_PROGRESS" }];
      }
      return [];
    default:
      return [];
  }
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
};

// ─── PaymentModal ────────────────────────────────────────────────────────────

function PaymentModal({
  orderId,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  orderId: string;
  onClose: () => void;
  onConfirm: (orderId: string, method: string) => void;
  isSubmitting: boolean;
}) {
  const [method, setMethod] = useState("PIX");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Confirmar Pagamento</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-400">Selecione o método de pagamento para finalizar a OS.</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMethod(val)}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-sm font-medium border transition-all",
                  method === val
                    ? "bg-sky-600 border-sky-500 text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(orderId, method)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Finalizando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ActionsDropdown ─────────────────────────────────────────────────────────

function ActionsDropdown({
  order,
  role,
  onTransition,
  onPaymentRequired,
  onDelete,
  onViewDetail,
}: {
  order: Order;
  role: string;
  onTransition: (id: string, status: string) => void;
  onPaymentRequired: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetail: (order: Order) => void;
}) {
  const [open, setOpen] = useState(false);
  const transitions = getTransitions(order.status, role);
  const canDelete =
    (role === "MANAGER" || role === "SUPER_ADMIN") &&
    (order.status === "PENDING" || order.status === "CANCELED");

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-xs"
      >
        Ações <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-30 overflow-hidden">
            <button
              onClick={() => { onViewDetail(order); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" /> Ver Detalhes
            </button>
            {transitions.length > 0 && (
              <div className="border-t border-zinc-800">
                {transitions.map((t) => (
                  <button
                    key={t.newStatus}
                    onClick={() => {
                      setOpen(false);
                      if (t.requiresPayment) onPaymentRequired(order.id);
                      else onTransition(order.id, t.newStatus);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                      t.newStatus === "CANCELED"
                        ? "text-red-400 hover:bg-red-500/10"
                        : t.newStatus === "COMPLETED"
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {canDelete && (
              <div className="border-t border-zinc-800">
                <button
                  onClick={() => { setOpen(false); onDelete(order.id); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir OS
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── OSDetailModal ───────────────────────────────────────────────────────────

function OSDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const services = order.items.filter((i) => i.isService);
  const products = order.items.filter((i) => !i.isService);

  const timeline = [
    { label: "Criada", date: order.createdAt, icon: FileText, color: "text-zinc-400" },
    { label: "Iniciada", date: order.startedAt, icon: Wrench, color: "text-blue-400" },
    { label: "Pronta", date: order.finishedAt, icon: CheckCircle2, color: "text-yellow-400" },
    { label: "Concluída", date: order.completedAt, icon: CheckCircle2, color: "text-emerald-400" },
  ].filter((t) => t.date);

  const restante = order.total - order.advancePayment;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-xl">
              <ClipboardList className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">OS #{order.id.slice(-6).toUpperCase()}</h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Criada em {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cliente e Veículo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cliente</span>
              </div>
              <p className="text-sm font-semibold text-white">{order.customerName}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Veículo</span>
              </div>
              <p className="text-sm font-bold text-white font-mono tracking-wider">{order.vehiclePlate}</p>
              {(order.vehicleBrand || order.vehicleModel) && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  {[order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ")}
                </p>
              )}
            </div>
          </div>

          {/* Serviços */}
          {services.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Serviços</span>
              </div>
              <div className="space-y-2">
                {services.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{item.name}</span>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{item.quantity}x</span>
                      <span className="text-zinc-300 font-medium">{formatBRL(item.unitPrice * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insumos */}
          {products.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Insumos Utilizados</span>
              </div>
              <div className="space-y-2">
                {products.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{item.name}</span>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{item.quantity}x</span>
                      <span className="text-zinc-300 font-medium">{formatBRL(item.unitPrice * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financeiro */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Financeiro</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total dos serviços</span>
                <span className="text-white font-semibold">{formatBRL(order.total)}</span>
              </div>
              {order.advancePayment > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Adiantamento</span>
                    <span className="text-yellow-400">− {formatBRL(order.advancePayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-zinc-800">
                    <span className="text-zinc-300 font-medium">Restante</span>
                    <span className="text-white font-bold">{formatBRL(restante)}</span>
                  </div>
                </>
              )}
              {order.paymentMethod && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-zinc-400">Pagamento</span>
                  <span className="text-zinc-300">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Observações</span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Histórico</span>
              </div>
              <div className="space-y-2">
                {timeline.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <t.icon className={cn("w-3.5 h-3.5 shrink-0", t.color)} />
                    <span className="text-xs text-zinc-500 w-20 shrink-0">{t.label}</span>
                    <span className="text-xs text-zinc-300">
                      {format(new Date(t.date!), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NewOSModal ──────────────────────────────────────────────────────────────

interface NewItem {
  _key: number;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isService: boolean;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  isService: boolean;
}

let _itemKey = 0;
function nextKey() { return ++_itemKey; }

function NewOSModal({
  onClose,
  customers,
  vehicles,
  catalog,
}: {
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
  catalog: CatalogProduct[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [status, setStatus] = useState<"PENDING" | "WAITING_QUEUE">("WAITING_QUEUE");
  const [items, setItems] = useState<NewItem[]>([
    { _key: nextKey(), name: "", quantity: 1, unitPrice: 0, isService: true },
  ]);
  const [itemNameSearch, setItemNameSearch] = useState<Record<number, string>>({});
  const [openItemDropdown, setOpenItemDropdown] = useState<number | null>(null);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const filteredCustomers = customerSearch
    ? customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
    : customers;
  const filteredVehicles = vehicles.filter((v) => v.customerId === customerId);

  function getCatalogSuggestions(key: number) {
    const q = itemNameSearch[key] ?? "";
    return q
      ? catalog.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
      : catalog.slice(0, 8);
  }

  function selectCatalogItem(itemKey: number, product: CatalogProduct) {
    setItems((prev) =>
      prev.map((i) =>
        i._key === itemKey
          ? { ...i, productId: product.id, name: product.name, unitPrice: product.price, isService: product.isService }
          : i
      )
    );
    setItemNameSearch((prev) => ({ ...prev, [itemKey]: product.name }));
    setOpenItemDropdown(null);
  }

  function handleItemNameChange(key: number, value: string) {
    setItemNameSearch((prev) => ({ ...prev, [key]: value }));
    updateItem(key, "name", value);
    // clear productId when user types manually
    setItems((prev) => prev.map((i) => i._key === key ? { ...i, productId: undefined } : i));
    setOpenItemDropdown(key);
  }

  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { _key: nextKey(), name: "", quantity: 1, unitPrice: 0, isService: true },
    ]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateItem<K extends keyof NewItem>(key: number, field: K, value: NewItem[K]) {
    setItems((prev) => prev.map((i) => (i._key === key ? { ...i, [field]: value } : i)));
  }

  async function handleSubmit() {
    if (!customerId) { toast.error("Selecione um cliente."); return; }
    if (!vehicleId) { toast.error("Selecione um veículo."); return; }
    if (items.some((i) => !i.name.trim())) { toast.error("Preencha o nome de todos os itens."); return; }
    if (total === 0) { toast.error("O total da OS não pode ser zero."); return; }

    setSubmitting(true);
    try {
      await createOS({
        customerId,
        vehicleId,
        status,
        advancePayment,
        paymentMethod: paymentMethod || undefined,
        notes: notes.trim() || undefined,
        items: items.map(({ productId, name, quantity, unitPrice, isService }) => ({
          productId,
          name,
          quantity,
          unitPrice,
          isService,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl">
              <Plus className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nova Ordem de Serviço</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Preencha os dados abaixo para abrir a OS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Seção: Cliente e Veículo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-sky-400">1</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">Identificação</h3>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              {/* Cliente */}
              <div className="relative">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Cliente <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar cliente pelo nome..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerId("");
                      setVehicleId("");
                      setShowCustomerList(true);
                    }}
                    onFocus={() => setShowCustomerList(true)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                {showCustomerList && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-44 overflow-y-auto">
                    {filteredCustomers.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerSearch(c.name);
                          setVehicleId("");
                          setShowCustomerList(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-zinc-500 text-xs">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Veículo */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Veículo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    disabled={!customerId}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-50 appearance-none"
                  >
                    <option value="">
                      {customerId ? "Selecione um veículo" : "Selecione um cliente primeiro"}
                    </option>
                    {filteredVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {[v.brand, v.model].filter(Boolean).join(" ") || v.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status inicial */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status inicial</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["WAITING_QUEUE", "PENDING"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-sm border transition-all text-left",
                        status === s
                          ? "bg-sky-600/20 border-sky-500/50 text-sky-300"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <span className="font-medium block text-xs">
                        {s === "WAITING_QUEUE" ? "Fila imediata" : "Agendado"}
                      </span>
                      <span className="text-xs opacity-70 mt-0.5 block">
                        {s === "WAITING_QUEUE" ? "Entra na fila agora" : "Mantém como pendente"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Serviços */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-sky-400">2</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Serviços e Insumos</h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar linha
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Header da tabela */}
              <div className="grid grid-cols-[1fr_80px_100px_90px_28px] gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                <span className="text-xs text-zinc-500 font-medium">Nome</span>
                <span className="text-xs text-zinc-500 font-medium text-center">Qtd</span>
                <span className="text-xs text-zinc-500 font-medium text-center">Preço unit.</span>
                <span className="text-xs text-zinc-500 font-medium text-center">Tipo</span>
                <span />
              </div>
              <div className="divide-y divide-zinc-800">
                {items.map((item) => {
                  const suggestions = getCatalogSuggestions(item._key);
                  const isOpen = openItemDropdown === item._key;
                  return (
                    <div key={item._key} className="px-4 py-2.5 space-y-2">
                      <div className="grid grid-cols-[1fr_80px_100px_90px_28px] gap-2 items-center">
                        {/* Nome com autocomplete do catálogo */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar ou digitar serviço/insumo..."
                            value={itemNameSearch[item._key] ?? item.name}
                            onChange={(e) => handleItemNameChange(item._key, e.target.value)}
                            onFocus={() => setOpenItemDropdown(item._key)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                          />
                          {isOpen && suggestions.length > 0 && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenItemDropdown(null)} />
                              <div className="absolute left-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden max-h-52 overflow-y-auto">
                                {suggestions.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); selectCatalogItem(item._key, p); }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-800 transition-colors text-left"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0",
                                        p.isService ? "bg-blue-500/15 text-blue-300" : "bg-orange-500/15 text-orange-300"
                                      )}>
                                        {p.isService ? "Serv." : "Ins."}
                                      </span>
                                      <span className="text-zinc-200 truncate">{p.name}</span>
                                    </div>
                                    <span className="text-zinc-400 text-xs shrink-0 ml-2">{formatBRL(p.price)}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={item.quantity}
                          onChange={(e) => updateItem(item._key, "quantity", parseFloat(e.target.value) || 0)}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-sky-500"
                        />
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item._key, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-sky-500"
                        />
                        <select
                          value={item.isService ? "service" : "product"}
                          onChange={(e) => updateItem(item._key, "isService", e.target.value === "service")}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-1.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="service">Serviço</option>
                          <option value="product">Insumo</option>
                        </select>
                        {items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeItem(item._key)}
                            className="text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                      {/* Subtotal da linha */}
                      {item.unitPrice > 0 && (
                        <div className="text-right pr-7">
                          <span className="text-xs text-zinc-500">
                            {item.quantity} × {formatBRL(item.unitPrice)} = <span className="text-zinc-300 font-medium">{formatBRL(item.quantity * item.unitPrice)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Totalizador */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/30 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">{items.length} {items.length === 1 ? "item" : "itens"}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Total:</span>
                  <span className={cn(
                    "text-sm font-bold",
                    total > 0 ? "text-white" : "text-zinc-600"
                  )}>
                    {formatBRL(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Pagamento */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-sky-400">3</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">Pagamento</h3>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Adiantamento (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancePayment || ""}
                    placeholder="0,00"
                    onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Forma de pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Não definido</option>
                    <option value="PIX">Pix</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  </select>
                </div>
              </div>
              {advancePayment > 0 && (
                <div className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-3 py-2.5">
                  <span className="text-xs text-zinc-400">Restante a cobrar</span>
                  <span className="text-sm font-semibold text-white">{formatBRL(Math.max(0, total - advancePayment))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Seção: Observações */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-sky-400">4</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">Observações</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Condições do veículo, pedidos especiais, observações..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-zinc-500">
              Total da OS: <span className="text-white font-bold text-sm ml-1">{formatBRL(total)}</span>
            </div>
            {advancePayment > 0 && (
              <div className="text-xs text-zinc-500">
                Restante: <span className="text-zinc-300 font-medium ml-1">{formatBRL(Math.max(0, total - advancePayment))}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Criando..." : "Criar OS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FiltersBar ───────────────────────────────────────────────────────────────

function FiltersBar({
  currentSearch,
  currentStatus,
  onSearchChange,
  onStatusChange,
}: {
  currentSearch: string;
  currentStatus: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3 mb-5">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por cliente ou placa..."
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onStatusChange("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              currentStatus === ""
                ? "bg-sky-600 border-sky-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
            )}
          >
            Todos
          </button>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => onStatusChange(currentStatus === value ? "" : value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                currentStatus === value
                  ? "bg-sky-600 border-sky-500 text-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
  catalog,
  role,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
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
    }, 350);
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
      toast.success("Status atualizado.");
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

  async function handleDelete(orderId: string) {
    if (!confirm("Excluir esta OS? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteOS(orderId);
      toast.success("OS excluída.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir OS.");
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

      <FiltersBar
        currentSearch={searchValue}
        currentStatus={currentStatus}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma OS encontrada"
          description={
            searchValue || currentStatus
              ? "Tente ajustar os filtros para encontrar o que procura."
              : "Crie sua primeira Ordem de Serviço para começar."
          }
          action={
            !searchValue && !currentStatus ? (
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
            <table className="w-full text-sm min-w-[820px]">
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
              <tbody className="divide-y divide-zinc-800/60">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setDetailOrder(order)}
                    className="hover:bg-zinc-800/25 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-mono font-semibold tracking-wider text-xs bg-zinc-800 px-2 py-0.5 rounded">
                        {order.vehiclePlate}
                      </span>
                      {(order.vehicleBrand || order.vehicleModel) && (
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {[order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 2).map((item) => (
                          <span
                            key={item.id}
                            className={cn(
                              "text-xs rounded-md px-1.5 py-0.5 truncate max-w-[100px]",
                              item.isService
                                ? "bg-blue-500/10 text-blue-300"
                                : "bg-orange-500/10 text-orange-300"
                            )}
                          >
                            {item.name}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-xs text-zinc-500">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-white">{formatBRL(order.total)}</span>
                      {order.advancePayment > 0 && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Adiant. {formatBRL(order.advancePayment)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {format(new Date(order.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <ActionsDropdown
                        order={order}
                        role={role}
                        onTransition={handleTransition}
                        onPaymentRequired={(id) => setPaymentOrderId(id)}
                        onDelete={handleDelete}
                        onViewDetail={(o) => setDetailOrder(o)}
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
                <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
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
      {detailOrder && (
        <OSDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}

      {showNewOSModal && (
        <NewOSModal
          onClose={() => setShowNewOSModal(false)}
          customers={customers}
          vehicles={vehicles}
          catalog={catalog}
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
