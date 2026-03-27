"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatBRL } from "@/lib/utils";
import {
  createTenant,
  toggleTenantActive,
  updateTenantPlan,
} from "@/actions/superadmin";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Search,
  Plus,
  X,
  Pencil,
} from "lucide-react";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  saasPlan: string;
  saasPrice: number;
  saasDueDate: string | null;
  billingCycleDay: number;
  monthlyGoal: number;
  createdAt: string;
  userCount: number;
  completedOrders: number;
}

interface Props {
  tenants: TenantRow[];
  initialSearch: string;
  initialPlan: string;
}

const PLAN_BADGE: Record<string, string> = {
  BASIC: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  PRO: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  ENTERPRISE: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

const PLAN_LABEL: Record<string, string> = {
  BASIC: "Basic",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

// ── Modal de Novo Lava-Jato ────────────────────────────────────────────────

interface NewTenantForm {
  name: string;
  saasPlan: "BASIC" | "PRO" | "ENTERPRISE";
  saasPrice: string;
  saasDueDate: string;
  billingCycleDay: string;
  monthlyGoal: string;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
}

function ModalNovoTenant({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<NewTenantForm>({
    name: "",
    saasPlan: "BASIC",
    saasPrice: "0",
    saasDueDate: "",
    billingCycleDay: "1",
    monthlyGoal: "0",
    managerName: "",
    managerEmail: "",
    managerPassword: "",
  });
  const [isPending, startTransition] = useTransition();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createTenant({
          name: form.name,
          saasPlan: form.saasPlan,
          saasPrice: parseFloat(form.saasPrice) || 0,
          saasDueDate: form.saasDueDate || undefined,
          billingCycleDay: parseInt(form.billingCycleDay) || 1,
          monthlyGoal: parseFloat(form.monthlyGoal) || 0,
          managerName: form.managerName,
          managerEmail: form.managerEmail,
          managerPassword: form.managerPassword,
        });
        toast.success("Lava-jato criado com sucesso!");
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar lava-jato");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Novo Lava-Jato</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nome */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome do Lava-Jato</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ex: Lava-Jato do João"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Plano + Mensalidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Plano</label>
              <select
                name="saasPlan"
                value={form.saasPlan}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mensalidade (R$)</label>
              <input
                name="saasPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.saasPrice}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Vencimento + Dia Ciclo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Vencimento</label>
              <input
                name="saasDueDate"
                type="date"
                value={form.saasDueDate}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Dia Cobrança</label>
              <input
                name="billingCycleDay"
                type="number"
                min="1"
                max="28"
                value={form.billingCycleDay}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Meta mensal */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Meta Mensal (R$)</label>
            <input
              name="monthlyGoal"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyGoal}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
              Conta do Gestor
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nome</label>
                <input
                  name="managerName"
                  value={form.managerName}
                  onChange={handleChange}
                  required
                  placeholder="Nome completo"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  name="managerEmail"
                  type="email"
                  value={form.managerEmail}
                  onChange={handleChange}
                  required
                  placeholder="gestor@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Senha</label>
                <input
                  name="managerPassword"
                  type="password"
                  value={form.managerPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? "Criando..." : "Criar Lava-Jato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de Editar Plano ──────────────────────────────────────────────────

function ModalEditarPlano({
  tenant,
  onClose,
  onSuccess,
}: {
  tenant: TenantRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saasPlan, setSaasPlan] = useState(tenant.saasPlan);
  const [saasPrice, setSaasPrice] = useState(String(tenant.saasPrice));
  const [saasDueDate, setSaasDueDate] = useState(
    tenant.saasDueDate
      ? tenant.saasDueDate.slice(0, 10)
      : ""
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateTenantPlan(tenant.id, {
          saasPlan,
          saasPrice: parseFloat(saasPrice) || 0,
          saasDueDate: saasDueDate || undefined,
        });
        toast.success("Plano atualizado!");
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar plano");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Editar Plano</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-zinc-400">{tenant.name}</p>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Plano</label>
            <select
              value={saasPlan}
              onChange={(e) => setSaasPlan(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Mensalidade (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={saasPrice}
              onChange={(e) => setSaasPrice(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Vencimento</label>
            <input
              type="date"
              value={saasDueDate}
              onChange={(e) => setSaasDueDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export function ClientLavacarros({ tenants, initialSearch, initialPlan }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [plan, setPlan] = useState(initialPlan);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function applyFilters(newSearch: string, newPlan: string) {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newPlan) params.set("plan", newPlan);
    router.push(`/dashboard/lavacarros?${params.toString()}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") applyFilters(search, plan);
  }

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setPlan(val);
    applyFilters(search, val);
  }

  async function handleToggle(tenant: TenantRow) {
    if (tenant.isActive) {
      const confirmed = window.confirm(
        `Deseja bloquear o acesso de "${tenant.name}"? Os usuários não conseguirão mais entrar.`
      );
      if (!confirmed) return;
    }
    setTogglingId(tenant.id);
    try {
      await toggleTenantActive(tenant.id);
      toast.success(
        tenant.isActive
          ? `${tenant.name} bloqueado.`
          : `${tenant.name} reativado.`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar status");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Lava-Jatos"
        description={`${tenants.length} encontrado${tenants.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Lava-Jato
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar por nome ou slug..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <select
          value={plan}
          onChange={handlePlanChange}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
        >
          <option value="">Todos os planos</option>
          <option value="BASIC">Basic</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {/* Tabela */}
      {tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum lava-jato encontrado"
          description="Crie o primeiro lava-jato ou ajuste os filtros de busca."
          action={
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Lava-Jato
            </button>
          }
        />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-400 font-medium px-4 py-3">Nome</th>
                  <th className="text-left text-xs text-zinc-400 font-medium px-4 py-3">Slug</th>
                  <th className="text-left text-xs text-zinc-400 font-medium px-4 py-3">Plano</th>
                  <th className="text-right text-xs text-zinc-400 font-medium px-4 py-3">Mensalidade</th>
                  <th className="text-right text-xs text-zinc-400 font-medium px-4 py-3">Usuários</th>
                  <th className="text-right text-xs text-zinc-400 font-medium px-4 py-3">OS Concluídas</th>
                  <th className="text-left text-xs text-zinc-400 font-medium px-4 py-3">Vencimento</th>
                  <th className="text-left text-xs text-zinc-400 font-medium px-4 py-3">Status</th>
                  <th className="text-right text-xs text-zinc-400 font-medium px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const dueDate = tenant.saasDueDate
                    ? parseISO(tenant.saasDueDate)
                    : null;
                  const isOverdue = dueDate ? isPast(dueDate) : false;

                  return (
                    <tr
                      key={tenant.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium">{tenant.name}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{tenant.slug}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            PLAN_BADGE[tenant.saasPlan] ?? PLAN_BADGE.BASIC
                          }`}
                        >
                          {PLAN_LABEL[tenant.saasPlan] ?? tenant.saasPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white">
                        {formatBRL(tenant.saasPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        {tenant.userCount}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        {tenant.completedOrders}
                      </td>
                      <td className="px-4 py-3">
                        {dueDate ? (
                          <span
                            className={`text-xs ${
                              isOverdue ? "text-red-400 font-medium" : "text-zinc-400"
                            }`}
                          >
                            {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(tenant)}
                          disabled={togglingId === tenant.id}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all disabled:opacity-50 ${
                            tenant.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                          }`}
                        >
                          {togglingId === tenant.id
                            ? "..."
                            : tenant.isActive
                            ? "Ativo"
                            : "Bloqueado"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditingTenant(tenant)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar Plano
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      {showNewModal && (
        <ModalNovoTenant
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            router.refresh();
          }}
        />
      )}

      {editingTenant && (
        <ModalEditarPlano
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSuccess={() => {
            setEditingTenant(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
