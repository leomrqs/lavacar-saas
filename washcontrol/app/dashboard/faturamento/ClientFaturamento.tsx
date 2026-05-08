"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  TrendingUp,
  Building2,
  AlertTriangle,
  CreditCard,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { cn, formatBRL } from "@/lib/utils";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  saasPlan: string;
  saasPrice: number;
  saasDueDate: string | null;
  isActive: boolean;
  billingCycleDay: number;
  createdAt: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

interface Props {
  tenants: TenantRow[];
  mrr: number;
  arr: number;
  activeCount: number;
  totalCount: number;
  overdueCount: number;
  monthlyRevenue: MonthlyRevenue[];
}

const PLAN_BADGE: Record<string, string> = {
  BASIC: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  PRO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ENTERPRISE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function ClientFaturamento({
  tenants,
  mrr,
  arr,
  activeCount,
  totalCount,
  overdueCount,
  monthlyRevenue,
}: Props) {
  const avgTicket = activeCount > 0 ? mrr / activeCount : 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Faturamento SaaS"
        description="Visao financeira da plataforma"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="MRR"
          value={formatBRL(mrr)}
          subtitle="Receita Mensal Recorrente"
          icon={DollarSign}
          iconColor="text-emerald-400"
        />
        <KpiCard
          title="ARR"
          value={formatBRL(arr)}
          subtitle="Receita Anual Projetada"
          icon={TrendingUp}
          iconColor="text-blue-400"
        />
        <KpiCard
          title="Ticket Medio"
          value={formatBRL(avgTicket)}
          subtitle="por lava-jato ativo"
          icon={CreditCard}
          iconColor="text-purple-400"
        />
        <KpiCard
          title="Inadimplentes"
          value={String(overdueCount)}
          subtitle={`de ${activeCount} ativos`}
          icon={AlertTriangle}
          iconColor={overdueCount > 0 ? "text-amber-400" : "text-emerald-400"}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-medium text-zinc-300">Receita Mensal — Ultimos 6 meses</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyRevenue}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#71717a", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#f4f4f5",
                fontSize: 12,
              }}
              formatter={(value) => [formatBRL(Number(value)), "Receita"]}
            />
            <Bar
              dataKey="revenue"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tenant billing table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Detalhamento por Lava-Jato</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activeCount} ativos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {totalCount - activeCount} bloqueados
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Lava-Jato</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Plano</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mensalidade</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vencimento</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dia Cob.</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {tenants.map((t) => {
                const dueDate = t.saasDueDate ? parseISO(t.saasDueDate) : null;
                const isOverdue = t.isActive && dueDate && isPast(dueDate);

                return (
                  <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-white font-medium">{t.name}</p>
                        <p className="text-[10px] text-zinc-600 font-mono">{t.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border", PLAN_BADGE[t.saasPlan] ?? PLAN_BADGE.BASIC)}>
                        <Shield className="w-3 h-3" />
                        {t.saasPlan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white font-semibold">
                      {formatBRL(t.saasPrice)}
                    </td>
                    <td className="px-5 py-3">
                      {dueDate ? (
                        <span className={cn("text-xs", isOverdue ? "text-red-400 font-medium" : "text-zinc-400")}>
                          {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                          {isOverdue && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-medium">
                              Vencido
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center text-zinc-400 text-xs">
                      Dia {t.billingCycleDay}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", t.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", t.isActive ? "bg-emerald-400" : "bg-red-400")} />
                        {t.isActive ? "Ativo" : "Bloqueado"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
