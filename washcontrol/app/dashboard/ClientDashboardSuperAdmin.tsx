"use client";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatBRL } from "@/lib/utils";
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  saasPlan: string;
  saasPrice: number;
  isActive: boolean;
  saasDueDate: string | null;
  createdAt: string;
}

interface Props {
  totalTenants: number;
  activeTenants: number;
  mrr: number;
  arr: number;
  recentTenants: TenantRow[];
}

const PLAN_BADGE: Record<string, string> = {
  BASIC: "bg-zinc-500/10 text-zinc-400",
  PRO: "bg-blue-500/10 text-blue-400",
  ENTERPRISE: "bg-purple-500/10 text-purple-400",
};

export function ClientDashboardSuperAdmin({
  totalTenants,
  activeTenants,
  mrr,
  arr,
  recentTenants,
}: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Painel WashControl</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Visão geral de todos os lava-jatos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total de Lava-Jatos"
          value={String(totalTenants)}
          icon={Building2}
          iconColor="text-blue-400"
        />
        <KpiCard
          title="Ativos"
          value={String(activeTenants)}
          subtitle={`${totalTenants - activeTenants} bloqueados`}
          icon={Users}
          iconColor="text-emerald-400"
        />
        <KpiCard
          title="MRR"
          value={formatBRL(mrr)}
          subtitle="Receita mensal recorrente"
          icon={DollarSign}
          iconColor="text-purple-400"
        />
        <KpiCard
          title="ARR"
          value={formatBRL(arr)}
          subtitle="Receita anual projetada"
          icon={TrendingUp}
          iconColor="text-orange-400"
        />
      </div>

      {/* Tabela de tenants recentes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Lava-Jatos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Plano</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Mensalidade</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Vencimento</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {recentTenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{t.name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[t.saasPlan] ?? ""}`}>
                      {t.saasPlan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">{formatBRL(t.saasPrice)}/mês</td>
                  <td className="px-5 py-3 text-zinc-400">
                    {t.saasDueDate
                      ? format(new Date(t.saasDueDate), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                      {t.isActive ? "Ativo" : "Bloqueado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentTenants.length === 0 && (
            <div className="py-12 text-center text-zinc-600 text-sm">
              Nenhum lava-jato cadastrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
