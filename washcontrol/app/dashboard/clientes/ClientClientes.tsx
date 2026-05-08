"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  X,
  Car,
  Bike,
  Truck,
  Phone,
  Mail,
  Award,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { createCustomer, updateCustomer, deleteCustomer, createVehicle } from "@/actions/customers";
import { cn, VEHICLE_TYPE_LABELS } from "@/lib/utils";

interface Vehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  type: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  totalWashes: number;
  orderCount: number;
  createdAt: string;
  vehicles: Vehicle[];
}

interface Props {
  customers: Customer[];
  initialSearch: string;
}

function VehicleIcon({ type }: { type: string }) {
  if (type === "MOTORCYCLE") return <Bike className="w-3.5 h-3.5" />;
  if (type === "TRUCK") return <Truck className="w-3.5 h-3.5" />;
  return <Car className="w-3.5 h-3.5" />;
}

// ── Modal Novo Cliente ─────────────────────────────────────────────────────

function ModalNovoCliente({
  onClose,
  onSuccess,
  editingCustomer,
}: {
  onClose: () => void;
  onSuccess: () => void;
  editingCustomer?: Customer | null;
}) {
  const [name, setName] = useState(editingCustomer?.name ?? "");
  const [phone, setPhone] = useState(editingCustomer?.phone ?? "");
  const [email, setEmail] = useState(editingCustomer?.email ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer.id, { name, phone, email });
          toast.success("Cliente atualizado!");
        } else {
          await createCustomer({ name, phone, email });
          toast.success("Cliente cadastrado!");
        }
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar cliente.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">
            {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome completo"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(41) 99999-0000"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all disabled:opacity-50"
            >
              {isPending ? "Salvando..." : editingCustomer ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Novo Veiculo ─────────────────────────────────────────────────────

function ModalNovoVeiculo({
  customerId,
  customerName,
  onClose,
  onSuccess,
}: {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("CAR");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createVehicle({
          customerId,
          plate: plate.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          brand: brand || undefined,
          model: model || undefined,
          color: color || undefined,
          year: year ? parseInt(year) : undefined,
          type,
        });
        toast.success("Veiculo cadastrado!");
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao cadastrar veiculo.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">Novo Veiculo</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Cliente: {customerName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Placa *</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                required
                maxLength={8}
                placeholder="ABC1D23"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono uppercase tracking-wider"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marca</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Fiat"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Modelo</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Argo"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cor</label>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: Prata"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min={1950}
                max={new Date().getFullYear() + 1}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all disabled:opacity-50"
            >
              {isPending ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Customer Row ───────────────────────────────────────────────────────────

function CustomerRow({
  customer,
  onEdit,
  onAddVehicle,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onAddVehicle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      <div
        className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-zinc-700/50 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-blue-400">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{customer.name}</p>
            {customer.totalWashes >= 10 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                <Award className="w-3 h-3" />
                Fiel
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {customer.phone && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Phone className="w-3 h-3" />
                {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Mail className="w-3 h-3" />
                {customer.email}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-center">
            <p className="text-sm font-bold text-white">{customer.totalWashes}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Lavagens</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">{customer.vehicles.length}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Veiculos</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">{customer.orderCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">OS</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            Editar
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded — Vehicles */}
      {expanded && (
        <div className="px-5 pb-4">
          <div className="ml-14 bg-zinc-800/30 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Veiculos ({customer.vehicles.length})
              </span>
              <button
                onClick={onAddVehicle}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
            {customer.vehicles.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-zinc-600">Nenhum veiculo cadastrado</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {customer.vehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-700/50 flex items-center justify-center text-zinc-400">
                      <VehicleIcon type={v.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono tracking-wider">
                          {v.plate}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">
                          {VEHICLE_TYPE_LABELS[v.type] ?? v.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
                        {[v.brand, v.model, v.color, v.year].filter(Boolean).join(" · ") || "Sem detalhes"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete customer */}
          {customer.orderCount === 0 && (
            <div className="ml-14 mt-3">
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Excluir cliente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ClientClientes({ customers, initialSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [vehicleCustomer, setVehicleCustomer] = useState<Customer | null>(null);
  const [, startTransition] = useTransition();

  function handleSearch(value: string) {
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    startTransition(() => router.push(`/dashboard/clientes?${params.toString()}`));
  }

  async function handleDelete(customer: Customer) {
    if (!window.confirm(`Excluir "${customer.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await deleteCustomer(customer.id);
      toast.success("Cliente excluido.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  const totalVehicles = customers.reduce((acc, c) => acc + c.vehicles.length, 0);
  const loyalCustomers = customers.filter((c) => c.totalWashes >= 10).length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes cadastrados`}
        action={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total de Clientes</p>
          <p className="text-2xl font-bold text-white">{customers.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Veiculos Cadastrados</p>
          <p className="text-2xl font-bold text-white">{totalVehicles}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3 h-3 text-amber-400" />
            <p className="text-xs text-zinc-500">Clientes Fieis</p>
          </div>
          <p className="text-2xl font-bold text-white">{loyalCustomers}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou email..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
        />
      </div>

      {/* Customer list */}
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={
            initialSearch
              ? "Tente ajustar o termo de busca."
              : "Cadastre seu primeiro cliente para comecar."
          }
          action={
            !initialSearch ? (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> Novo Cliente
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {customers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              onEdit={() => setEditingCustomer(customer)}
              onAddVehicle={() => setVehicleCustomer(customer)}
              onDelete={() => handleDelete(customer)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {(showNewModal || editingCustomer) && (
        <ModalNovoCliente
          editingCustomer={editingCustomer}
          onClose={() => {
            setShowNewModal(false);
            setEditingCustomer(null);
          }}
          onSuccess={() => {
            setShowNewModal(false);
            setEditingCustomer(null);
            router.refresh();
          }}
        />
      )}

      {vehicleCustomer && (
        <ModalNovoVeiculo
          customerId={vehicleCustomer.id}
          customerName={vehicleCustomer.name}
          onClose={() => setVehicleCustomer(null)}
          onSuccess={() => {
            setVehicleCustomer(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
