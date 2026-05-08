"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCog,
  Plus,
  X,
  Users,
  DollarSign,
  Percent,
  Shield,
  ShieldCheck,
  Phone,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { createEmployee, updateEmployee, toggleEmployeeActive } from "@/actions/employees";
import { cn, formatBRL } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  salary: number;
  commissionPct: number;
  isActive: boolean;
  email: string | null;
  createdAt: string;
  estimatedCommission: number;
}

interface Props {
  employees: Employee[];
  activeCount: number;
  totalSalaries: number;
  totalRevenueMonth: number;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  MANAGER: { label: "Gestor", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: ShieldCheck },
  WASHER: { label: "Lavador", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Shield },
};

// ── Modal Novo Funcionario ──────────────────────────────────────────────────

function ModalEmployee({
  onClose,
  onSuccess,
  editing,
}: {
  onClose: () => void;
  onSuccess: () => void;
  editing?: Employee | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [role, setRole] = useState(editing?.role ?? "WASHER");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [salary, setSalary] = useState(String(editing?.salary ?? 0));
  const [commissionPct, setCommissionPct] = useState(String(editing?.commissionPct ?? 0));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editing) {
          await updateEmployee(editing.id, {
            name,
            role,
            phone: phone || undefined,
            salary: parseFloat(salary) || 0,
            commissionPct: parseFloat(commissionPct) || 0,
          });
          toast.success("Funcionario atualizado!");
        } else {
          await createEmployee({
            name,
            role,
            phone: phone || undefined,
            salary: parseFloat(salary) || 0,
            commissionPct: parseFloat(commissionPct) || 0,
            email: email || undefined,
            password: password || undefined,
          });
          toast.success("Funcionario cadastrado!");
        }
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">
            {editing ? "Editar Funcionario" : "Novo Funcionario"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cargo</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="WASHER">Lavador</option>
                <option value="MANAGER">Gestor</option>
              </select>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Salario (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Comissao (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Conta de acesso (somente criacao) */}
          {!editing && (
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                Conta de Acesso (opcional)
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="funcionario@email.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    minLength={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all disabled:opacity-50">
              {isPending ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ClientEquipe({ employees, activeCount, totalSalaries, totalRevenueMonth }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(emp: Employee) {
    setTogglingId(emp.id);
    try {
      await toggleEmployeeActive(emp.id);
      toast.success(emp.isActive ? `${emp.name} desativado.` : `${emp.name} reativado.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Equipe"
        description={`${employees.length} funcionarios`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Funcionario
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Ativos" value={String(activeCount)} subtitle={`de ${employees.length}`} icon={Users} iconColor="text-blue-400" />
        <KpiCard title="Folha Salarial" value={formatBRL(totalSalaries)} subtitle="mensal" icon={DollarSign} iconColor="text-emerald-400" />
        <KpiCard title="Receita do Mes" value={formatBRL(totalRevenueMonth)} subtitle="base para comissoes" icon={DollarSign} iconColor="text-purple-400" />
        <KpiCard title="Comissoes Estimadas" value={formatBRL(employees.filter((e) => e.isActive).reduce((acc, e) => acc + e.estimatedCommission, 0))} icon={Percent} iconColor="text-orange-400" />
      </div>

      {/* Employee list */}
      {employees.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum funcionario cadastrado"
          description="Adicione sua equipe para gerenciar salarios e comissoes."
          action={
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all">
              <Plus className="w-4 h-4" /> Novo Funcionario
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const roleConfig = ROLE_CONFIG[emp.role] ?? ROLE_CONFIG.WASHER;
            const RoleIcon = roleConfig.icon;

            return (
              <div
                key={emp.id}
                className={cn(
                  "bg-zinc-900 border rounded-xl p-5 transition-all hover:border-zinc-700",
                  emp.isActive ? "border-zinc-800" : "border-zinc-800/50 opacity-60"
                )}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", emp.isActive ? "bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-zinc-700/50" : "bg-zinc-800")}>
                    <span className="text-sm font-bold text-blue-400">{emp.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", roleConfig.color)}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig.label}
                      </span>
                      {!emp.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">Inativo</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5 mb-4">
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Phone className="w-3 h-3" />
                      {emp.phone}
                    </div>
                  )}
                  {emp.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Mail className="w-3 h-3" />
                      {emp.email}
                    </div>
                  )}
                </div>

                {/* Financial info */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-800/40 rounded-lg mb-4">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Salario</p>
                    <p className="text-xs font-bold text-white">{formatBRL(emp.salary)}</p>
                  </div>
                  <div className="text-center border-x border-zinc-700/50">
                    <p className="text-xs text-zinc-500">Comissao</p>
                    <p className="text-xs font-bold text-white">{emp.commissionPct}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Est. Mes</p>
                    <p className="text-xs font-bold text-emerald-400">{formatBRL(emp.estimatedCommission)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(emp)}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggle(emp)}
                    disabled={togglingId === emp.id}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50",
                      emp.isActive
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-emerald-400 hover:bg-emerald-500/10"
                    )}
                  >
                    {togglingId === emp.id ? "..." : emp.isActive ? "Desativar" : "Reativar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {(showModal || editing) && (
        <ModalEmployee
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSuccess={() => { setShowModal(false); setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
