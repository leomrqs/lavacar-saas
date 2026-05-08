"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatBRL, formatDuration } from "@/lib/utils";
import { Car, DollarSign, Clock, TrendingUp, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toMonthParam, shiftMonth } from "@/lib/cycle";

interface Props {
  lavagensHoje: number;
  faturamentoHoje: number;
  faturamentoMes: number;
  ticketMedio: number;
  tempoMedio: number;
  ordersAtivas: number;
  monthlyGoal: number;
  chartWeek: { date: string; count: number }[];
  chartCategories: { name: string; value: number }[];
  cycleDay: number;
  cycleStart: string;
  cycleEnd: string;
  selectedMonthParam: string;
  currentMonthParam: string;
}

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export function ClientDashboard({
  lavagensHoje,
  faturamentoHoje,
  faturamentoMes,
  ticketMedio,
  tempoMedio,
  ordersAtivas,
  monthlyGoal,
  chartWeek,
  chartCategories,
  cycleDay,
  cycleStart,
  cycleEnd,
  selectedMonthParam,
  currentMonthParam,
}: Props) {
  const router = useRouter();
  const goalProgress = monthlyGoal > 0
    ? Math.min((faturamentoMes / monthlyGoal) * 100, 100)
    : 0;

  const isCurrentCycle = selectedMonthParam === currentMonthParam;
  const cycleStartDate = new Date(cycleStart);
  const cycleEndDate = new Date(cycleEnd);
  const cycleLabel = `${format(cycleStartDate, "dd/MMM", { locale: ptBR })} → ${format(cycleEndDate, "dd/MMM/yy", { locale: ptBR })}`;

  const prevParam = (() => { const p = selectedMonthParam.split("-"); const s = shiftMonth(parseInt(p[0]), parseInt(p[1]), -1); return toMonthParam(s.year, s.month); })();
  const nextParam = (() => { const p = selectedMonthParam.split("-"); const s = shiftMonth(parseInt(p[0]), parseInt(p[1]), 1); return toMonthParam(s.year, s.month); })();

  // Preencher os últimos 7 dias no gráfico
  const weekData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const found = chartWeek.find((w) => w.date === dateStr);
      return {
        day: format(d, "EEE", { locale: ptBR }),
        lavagens: found?.count ?? 0,
      };
    });
  }, [chartWeek]);

  return (
    <div className="p-6 space-y-5">
      {/* Header com seletor de ciclo */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Ciclo: <span className="text-zinc-300 font-medium">{cycleLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => router.push(`/dashboard?month=${prevParam}`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium text-white min-w-[90px] text-center">
              {format(cycleStartDate, "MMM/yyyy", { locale: ptBR })}
            </span>
            <button
              onClick={() => router.push(`/dashboard?month=${nextParam}`)}
              disabled={isCurrentCycle}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!isCurrentCycle && (
            <button
              onClick={() => router.push("/dashboard")}
              className="px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/30 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Lavagens no Ciclo"
          value={String(lavagensHoje)}
          subtitle={`${ordersAtivas} em andamento agora`}
          icon={Car}
          iconColor="text-blue-400"
        />
        <KpiCard
          title="Faturamento Hoje"
          value={formatBRL(faturamentoHoje)}
          icon={DollarSign}
          iconColor="text-emerald-400"
        />
        <KpiCard
          title="Ticket Médio"
          value={formatBRL(ticketMedio)}
          icon={TrendingUp}
          iconColor="text-purple-400"
        />
        <KpiCard
          title="Tempo Médio"
          value={tempoMedio > 0 ? formatDuration(tempoMedio) : "—"}
          subtitle="por lavagem"
          icon={Clock}
          iconColor="text-orange-400"
        />
      </div>

      {/* Meta do ciclo */}
      {monthlyGoal > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-zinc-300">Meta do Ciclo</p>
              <p className="text-xs text-zinc-500">
                {formatBRL(faturamentoMes)} de {formatBRL(monthlyGoal)}
              </p>
            </div>
            <span className="text-lg font-bold text-white">
              {goalProgress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lavagens por dia */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-medium text-zinc-300">Lavagens — Últimos 7 dias</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weekData}>
              <XAxis
                dataKey="day"
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  color: "#f4f4f5",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="lavagens"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Serviços por categoria */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-medium text-zinc-300">Serviços por Categoria — Ciclo</p>
          </div>
          {chartCategories.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={chartCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {chartCategories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      color: "#f4f4f5",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {chartCategories.slice(0, 5).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-zinc-400 truncate flex-1">{cat.name}</span>
                    <span className="text-xs font-medium text-zinc-300">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-zinc-600">Sem dados neste ciclo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
