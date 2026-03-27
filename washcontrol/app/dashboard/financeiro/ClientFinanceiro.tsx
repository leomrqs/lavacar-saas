"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  CheckCircle,
  Trash2,
  X,
  RefreshCw,
  FileText,
  Banknote,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatBRL } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  createTransaction,
  markTransactionPaid,
  deleteTransaction,
  createFixedExpense,
  deleteFixedExpense,
  generateMonthlyFixedExpenses,
  generateMonthlySalaries,
} from "@/actions/finance";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  dueDate: string | null;
  createdAt: string;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

interface MonthlySummary {
  month: string;
  monthKey: string;
  total: number;
}

interface Props {
  tenantId: string;
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  monthlySummary: MonthlySummary[];
  currentMonth: number;
  currentYear: number;
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Categoria obrigatória"),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  status: z.enum(["PENDING", "PAID"]).default("PENDING"),
  paymentMethod: z.string().optional(),
  dueDate: z.string().optional(),
});

const fixedExpenseSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  amount: z.coerce.number().min(0.01, "Valor obrigatório"),
  dueDay: z.coerce.number().int().min(1).max(28, "Dia entre 1 e 28"),
  category: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;
type FixedExpenseForm = z.infer<typeof fixedExpenseSchema>;

// ─── Constants ──────────────────────────────────────────────────────────────

const INCOME_CATEGORIES = [
  "SERVICO_LAVAGEM",
  "PRODUTO_REVENDA",
  "OUTROS_ENTRADA",
];

const EXPENSE_CATEGORIES = [
  "DESPESA_FIXA",
  "INSUMOS",
  "SALARIO",
  "MANUTENCAO",
  "MARKETING",
  "OUTROS_SAIDA",
];

const PAYMENT_METHODS = [
  { value: "PIX", label: "Pix" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

// ─── Modal ──────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Transaction Modal ───────────────────────────────────────────────────────

function TransactionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "INCOME", status: "PENDING" },
  });

  const type = watch("type");
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = (data: TransactionForm) => {
    startTransition(async () => {
      try {
        await createTransaction(data);
        toast.success("Lançamento criado com sucesso!");
        reset();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar lançamento.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Lançamento">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Tipo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <label
                key={t}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all",
                  watch("type") === t
                    ? t === "INCOME"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                )}
              >
                <input
                  type="radio"
                  value={t}
                  {...register("type")}
                  className="hidden"
                />
                {t === "INCOME" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {t === "INCOME" ? "Entrada" : "Saída"}
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Categoria
          </label>
          <select
            {...register("category")}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Selecione...</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Descrição
          </label>
          <input
            {...register("description")}
            placeholder="Ex: Aluguel de outubro"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          {errors.description && (
            <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Valor (R$)
          </label>
          <input
            {...register("amount")}
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          {errors.amount && (
            <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
              Forma de Pagamento
            </label>
            <select
              {...register("paymentMethod")}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">— Opcional —</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Vencimento
          </label>
          <input
            {...register("dueDate")}
            type="date"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Salvando..." : "Criar Lançamento"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Fixed Expense Modal ─────────────────────────────────────────────────────

function FixedExpenseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FixedExpenseForm>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: { dueDay: 5 },
  });

  const onSubmit = (data: FixedExpenseForm) => {
    startTransition(async () => {
      try {
        await createFixedExpense(data);
        toast.success("Despesa fixa criada!");
        reset();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar despesa.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova Despesa Fixa">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Nome
          </label>
          <input
            {...register("name")}
            placeholder="Ex: Aluguel, Água, Luz..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
              Valor (R$)
            </label>
            <input
              {...register("amount")}
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            {errors.amount && (
              <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
              Dia do Vencimento
            </label>
            <input
              {...register("dueDay")}
              type="number"
              min="1"
              max="28"
              placeholder="5"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            {errors.dueDay && (
              <p className="text-xs text-red-400 mt-1">{errors.dueDay.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">
            Categoria (opcional)
          </label>
          <input
            {...register("category")}
            placeholder="Ex: ALUGUEL, ENERGIA, AGUA..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Salvando..." : "Criar Despesa Fixa"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ClientFinanceiro({
  tenantId,
  transactions,
  fixedExpenses,
  totalEntradas,
  totalSaidas,
  saldo,
  monthlySummary,
  currentMonth,
  currentYear,
}: Props) {
  const [activeTab, setActiveTab] = useState<"fluxo" | "fixas" | "dre">("fluxo");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showFixedExpenseModal, setShowFixedExpenseModal] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [isPending, startTransition] = useTransition();

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "ALL" && t.type !== filterType) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    return true;
  });

  const handleMarkPaid = (id: string) => {
    startTransition(async () => {
      try {
        await markTransactionPaid(id);
        toast.success("Marcado como pago!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro.");
      }
    });
  };

  const handleDeleteTransaction = (id: string) => {
    startTransition(async () => {
      try {
        await deleteTransaction(id);
        toast.success("Lançamento excluído.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
      }
    });
  };

  const handleDeleteFixedExpense = (id: string) => {
    startTransition(async () => {
      try {
        await deleteFixedExpense(id);
        toast.success("Despesa fixa excluída.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
      }
    });
  };

  const handleGenerateFixed = () => {
    startTransition(async () => {
      try {
        await generateMonthlyFixedExpenses(tenantId, currentMonth, currentYear);
        toast.success("Lançamentos gerados com sucesso!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao gerar.");
      }
    });
  };

  const handleGenerateSalaries = () => {
    startTransition(async () => {
      try {
        await generateMonthlySalaries(tenantId, currentMonth, currentYear);
        toast.success("Salários gerados com sucesso!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao gerar salários.");
      }
    });
  };

  // DRE calculations
  const receitaBruta = transactions
    .filter((t) => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);

  const despesasOperacionais = transactions
    .filter((t) => t.type === "EXPENSE" && t.status === "PAID" && t.category !== "SALARIO")
    .reduce((acc, t) => acc + t.amount, 0);

  const folhaPagamento = transactions
    .filter((t) => t.type === "EXPENSE" && t.status === "PAID" && t.category === "SALARIO")
    .reduce((acc, t) => acc + t.amount, 0);

  const resultadoOperacional = receitaBruta - despesasOperacionais - folhaPagamento;

  const TABS = [
    { key: "fluxo" as const, label: "Fluxo de Caixa" },
    { key: "fixas" as const, label: "Despesas Fixas" },
    { key: "dre" as const, label: "DRE" },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Financeiro"
        description="Controle de fluxo de caixa e despesas"
        action={
          activeTab === "fluxo" ? (
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Lançamento
            </button>
          ) : activeTab === "fixas" ? (
            <button
              onClick={() => setShowFixedExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Despesa Fixa
            </button>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Entradas (Pagas)"
          value={formatBRL(totalEntradas)}
          icon={TrendingUp}
          iconColor="text-emerald-400"
        />
        <KpiCard
          title="Saídas (Pagas)"
          value={formatBRL(totalSaidas)}
          icon={TrendingDown}
          iconColor="text-red-400"
        />
        <KpiCard
          title="Saldo do Mês"
          value={formatBRL(saldo)}
          icon={DollarSign}
          iconColor={saldo >= 0 ? "text-blue-400" : "text-red-400"}
          className={
            saldo < 0 ? "border-red-500/30 bg-red-500/5" : undefined
          }
        />
      </div>

      {/* Sparkline — últimos 6 meses */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-sm font-medium text-zinc-300 mb-4">Faturamento — Últimos 6 meses</p>
        <div className="flex items-end gap-2 h-20">
          {monthlySummary.map((m) => {
            const maxVal = Math.max(...monthlySummary.map((s) => s.total), 1);
            const heightPct = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
            return (
              <div key={m.monthKey} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full bg-blue-600/70 rounded-t transition-all"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                  title={formatBRL(m.total)}
                />
                <span className="text-[10px] text-zinc-500 capitalize">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-zinc-800">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-white border-b-2 border-blue-500 bg-zinc-800/40"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Fluxo de Caixa ── */}
        {activeTab === "fluxo" && (
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      filterType === f
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {f === "ALL" ? "Todos" : f === "INCOME" ? "Entradas" : "Saídas"}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                {(["ALL", "PENDING", "PAID"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      filterStatus === f
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : "Pagos"}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <DollarSign className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400">Nenhum lançamento encontrado.</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Crie um lançamento ou ajuste os filtros.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                        Data
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                        Descrição
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 hidden md:table-cell">
                        Categoria
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500">
                        Tipo
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-zinc-500">
                        Valor
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 hidden sm:table-cell">
                        Status
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-zinc-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors"
                      >
                        <td className="py-3 px-3 text-zinc-400 text-xs whitespace-nowrap">
                          {formatDate(tx.paymentDate ?? tx.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-zinc-200 max-w-[180px] truncate">
                          {tx.description}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-xs hidden md:table-cell">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded-md">
                            {tx.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              tx.type === "INCOME"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}
                          >
                            {tx.type === "INCOME" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium whitespace-nowrap">
                          <span
                            className={
                              tx.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                            }
                          >
                            {formatBRL(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden sm:table-cell">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              tx.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            )}
                          >
                            {tx.status === "PAID" ? "Pago" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === "PENDING" && (
                              <button
                                onClick={() => handleMarkPaid(tx.id)}
                                disabled={isPending}
                                title="Marcar como Pago"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              disabled={isPending}
                              title="Excluir"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Despesas Fixas ── */}
        {activeTab === "fixas" && (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerateFixed}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
                Gerar lançamentos do mês
              </button>
              <button
                onClick={handleGenerateSalaries}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
              >
                <Banknote className="w-3.5 h-3.5" />
                Gerar salários do mês
              </button>
            </div>

            {fixedExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400">Nenhuma despesa fixa cadastrada.</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Crie despesas fixas para automatizar lançamentos mensais.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fixedExpenses.map((fe) => (
                  <div
                    key={fe.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0",
                          fe.isActive ? "bg-emerald-400" : "bg-zinc-600"
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{fe.name}</p>
                        <p className="text-xs text-zinc-500">
                          Vence dia {fe.dueDay}
                          {fe.category && ` · ${fe.category}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-400">
                        {formatBRL(fe.amount)}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          fe.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        )}
                      >
                        {fe.isActive ? "Ativo" : "Inativo"}
                      </span>
                      <button
                        onClick={() => handleDeleteFixedExpense(fe.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DRE ── */}
        {activeTab === "dre" && (
          <div className="p-4">
            <p className="text-xs text-zinc-500 mb-4">
              Demonstrativo de Resultado — mês atual (apenas lançamentos pagos)
            </p>
            <div className="space-y-1">
              {/* Receita Bruta */}
              <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">Receita Bruta</p>
                  <p className="text-xs text-zinc-500">Soma de todas as entradas pagas</p>
                </div>
                <span className="text-base font-bold text-emerald-400">
                  {formatBRL(receitaBruta)}
                </span>
              </div>

              <div className="flex items-center justify-center py-1">
                <span className="text-zinc-600 text-xs">−</span>
              </div>

              {/* Despesas Operacionais */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">
                    (−) Despesas Operacionais
                  </p>
                  <p className="text-xs text-zinc-500">
                    Saídas pagas (exceto folha de pagamento)
                  </p>
                </div>
                <span className="text-base font-bold text-red-400">
                  {formatBRL(despesasOperacionais)}
                </span>
              </div>

              <div className="flex items-center justify-center py-1">
                <span className="text-zinc-600 text-xs">−</span>
              </div>

              {/* Folha de Pagamento */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">
                    (−) Folha de Pagamento
                  </p>
                  <p className="text-xs text-zinc-500">Categoria SALARIO pago</p>
                </div>
                <span className="text-base font-bold text-orange-400">
                  {formatBRL(folhaPagamento)}
                </span>
              </div>

              <div className="flex items-center justify-center py-2">
                <span className="text-zinc-500 text-xs font-medium">=</span>
              </div>

              {/* Resultado */}
              <div
                className={cn(
                  "flex items-center justify-between p-5 border rounded-xl",
                  resultadoOperacional >= 0
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {resultadoOperacional >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">Resultado Operacional</p>
                    <p className="text-xs text-zinc-400">
                      {resultadoOperacional >= 0
                        ? "Resultado positivo neste mês"
                        : "Resultado negativo — atenção ao fluxo de caixa"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold",
                    resultadoOperacional >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {formatBRL(resultadoOperacional)}
                </span>
              </div>
            </div>

            {/* Monthly comparison */}
            <div className="mt-6">
              <p className="text-xs font-medium text-zinc-400 mb-3">
                Evolução mensal — Receita
              </p>
              <div className="space-y-2">
                {monthlySummary.map((m) => {
                  const maxVal = Math.max(...monthlySummary.map((s) => s.total), 1);
                  const pct = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
                  return (
                    <div key={m.monthKey} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-8 capitalize">
                        {m.month}
                      </span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-300 w-24 text-right">
                        {formatBRL(m.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
      />
      <FixedExpenseModal
        open={showFixedExpenseModal}
        onClose={() => setShowFixedExpenseModal(false)}
      />
    </div>
  );
}
