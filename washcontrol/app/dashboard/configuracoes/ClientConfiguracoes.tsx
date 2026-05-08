"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Settings,
  Save,
  Award,
  Target,
  Building2,
  Users,
  ClipboardList,
  UserCog,
  CreditCard,
  Calendar,
  Hash,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { updateTenantConfig } from "@/actions/configuracoes";
import { cn, formatBRL } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  saasPlan: string;
  saasPrice: number;
  saasDueDate: string | null;
  billingCycleDay: number;
  monthlyGoal: number;
  loyaltyInterval: number;
  loyaltyDiscount: number;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  customerCount: number;
  orderCount: number;
  employeeCount: number;
}

interface Props {
  tenant: Tenant;
}

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  BASIC: { label: "Basic", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  PRO: { label: "Pro", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ENTERPRISE: { label: "Enterprise", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export function ClientConfiguracoes({ tenant }: Props) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name);
  const [monthlyGoal, setMonthlyGoal] = useState(String(tenant.monthlyGoal));
  const [loyaltyInterval, setLoyaltyInterval] = useState(String(tenant.loyaltyInterval));
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(String(tenant.loyaltyDiscount));
  const [isPending, startTransition] = useTransition();

  const plan = PLAN_CONFIG[tenant.saasPlan] ?? PLAN_CONFIG.BASIC;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateTenantConfig({
          name,
          monthlyGoal: parseFloat(monthlyGoal) || 0,
          loyaltyInterval: parseInt(loyaltyInterval) || 10,
          loyaltyDiscount: parseFloat(loyaltyDiscount) || 100,
        });
        toast.success("Configuracoes salvas!");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <PageHeader
        title="Configuracoes"
        description="Gerencie as informacoes do seu lava-jato"
      />

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{tenant.userCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Usuarios</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{tenant.customerCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Clientes</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{tenant.orderCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">OS Total</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <UserCog className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{tenant.employeeCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Funcionarios</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Dados do Negocio */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Dados do Negocio</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do Lava-Jato</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Slug (URL)</label>
                <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5">
                  <Hash className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-sm text-zinc-500 font-mono">{tenant.slug}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Meta Mensal (R$)
                </div>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Programa de Fidelidade */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Programa de Fidelidade</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-zinc-500">
              A cada N lavagens concluidas, o cliente recebe um desconto automatico na proxima lavagem.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  A cada quantas lavagens?
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={loyaltyInterval}
                  onChange={(e) => setLoyaltyInterval(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Atual: a cada {tenant.loyaltyInterval} lavagens</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Desconto aplicado (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={loyaltyDiscount}
                  onChange={(e) => setLoyaltyDiscount(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-[10px] text-zinc-600 mt-1">100% = lavagem gratis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plano SaaS (somente leitura) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Plano SaaS</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 ml-auto">Somente leitura</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Plano</p>
                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border", plan.color)}>
                  <Shield className="w-3 h-3" />
                  {plan.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Mensalidade</p>
                <p className="text-sm font-bold text-white">{formatBRL(tenant.saasPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Vencimento</p>
                <p className="text-sm text-white">
                  {tenant.saasDueDate
                    ? format(parseISO(tenant.saasDueDate), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Dia Cobranca</p>
                <p className="text-sm text-white">Dia {tenant.billingCycleDay}</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 mt-4">
              Para alterar o plano, entre em contato com o suporte WashControl.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Salvando..." : "Salvar Alteracoes"}
          </button>
        </div>
      </form>
    </div>
  );
}
