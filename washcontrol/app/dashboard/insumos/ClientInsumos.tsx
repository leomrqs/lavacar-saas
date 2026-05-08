"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Package,
  Plus,
  X,
  Search,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wrench,
  ShoppingBag,
  Trash2,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { createProduct, updateProduct, deleteProduct, adjustStock } from "@/actions/inventory";
import { cn, formatBRL } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  isService: boolean;
}

interface Transaction {
  id: string;
  productName: string;
  productUnit: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

interface Props {
  products: Product[];
  transactions: Transaction[];
  lowStockCount: number;
  totalItems: number;
  totalServices: number;
  currentTab: string;
  currentSearch: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  LAVAGEM: "Lavagem",
  ESTETICA: "Estetica",
  POLIMENTO: "Polimento",
  INSUMO: "Insumo",
  PRODUTO_REVENDA: "Revenda",
};

// ── Modal Produto ──────────────────────────────────────────────────────────

function ModalProduct({
  onClose,
  onSuccess,
  editing,
}: {
  onClose: () => void;
  onSuccess: () => void;
  editing?: Product | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? 0));
  const [stock, setStock] = useState(String(editing?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(editing?.minStock ?? 0));
  const [unit, setUnit] = useState(editing?.unit ?? "un");
  const [isService, setIsService] = useState(editing?.isService ?? false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const data = {
          name,
          category: category || undefined,
          price: parseFloat(price) || 0,
          stock: parseFloat(stock) || 0,
          minStock: parseFloat(minStock) || 0,
          unit,
          isService,
        };
        if (editing) {
          await updateProduct(editing.id, data);
          toast.success("Produto atualizado!");
        } else {
          await createProduct(data);
          toast.success("Produto cadastrado!");
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
          <h2 className="text-base font-bold text-white">{editing ? "Editar Produto" : "Novo Produto"}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Shampoo Automotivo" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="flex items-center gap-3 p-3 bg-zinc-800/60 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input type="radio" checked={!isService} onChange={() => setIsService(false)} className="accent-blue-500" />
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">Produto/Insumo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input type="radio" checked={isService} onChange={() => setIsService(true)} className="accent-blue-500" />
              <Wrench className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">Servico</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preco (R$)</label>
              <input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all">
                <option value="">Sem categoria</option>
                <option value="LAVAGEM">Lavagem</option>
                <option value="ESTETICA">Estetica</option>
                <option value="POLIMENTO">Polimento</option>
                <option value="INSUMO">Insumo</option>
                <option value="PRODUTO_REVENDA">Revenda</option>
              </select>
            </div>
          </div>

          {!isService && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Estoque</label>
                <input type="number" min={0} step={0.01} value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Estoque Min.</label>
                <input type="number" min={0} step={0.01} value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Unidade</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all">
                  <option value="un">un</option>
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
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

// ── Modal Ajuste de Estoque ────────────────────────────────────────────────

function ModalAjusteEstoque({
  product,
  onClose,
  onSuccess,
}: {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { toast.error("Quantidade invalida."); return; }

    startTransition(async () => {
      try {
        await adjustStock(product.id, qty, type, notes || undefined);
        toast.success(type === "IN" ? "Entrada registrada!" : "Saida registrada!");
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao ajustar estoque.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">Ajustar Estoque</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{product.name} — Atual: {product.stock} {product.unit}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("IN")} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border", type === "IN" ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600")}>
              <ArrowDownCircle className="w-4 h-4" /> Entrada
            </button>
            <button type="button" onClick={() => setType("OUT")} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border", type === "OUT" ? "bg-red-600/15 text-red-400 border-red-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600")}>
              <ArrowUpCircle className="w-4 h-4" /> Saida
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantidade ({product.unit})</label>
            <input type="number" min={0.01} step={0.01} value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-center text-lg font-bold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Observacao</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Compra fornecedor X" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">Cancelar</button>
            <button type="submit" disabled={isPending} className={cn("flex-1 px-4 py-2.5 rounded-xl text-sm text-white font-semibold transition-all disabled:opacity-50", type === "IN" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500")}>
              {isPending ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ClientInsumos({
  products,
  transactions,
  lowStockCount,
  totalItems,
  totalServices,
  currentTab,
  currentSearch,
}: Props) {
  const router = useRouter();
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState(currentSearch);
  const [tab, setTab] = useState(currentTab);
  const [, startTransition] = useTransition();

  function handleSearch(value: string) {
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    if (tab) params.set("tab", tab);
    startTransition(() => router.push(`/dashboard/insumos?${params.toString()}`));
  }

  function handleTabChange(newTab: string) {
    setTab(newTab);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("tab", newTab);
    startTransition(() => router.push(`/dashboard/insumos?${params.toString()}`));
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Excluir "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      toast.success("Produto excluido.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  const inventoryProducts = products.filter((p) => !p.isService);
  const serviceProducts = products.filter((p) => p.isService);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Insumos & Servicos"
        description={`${products.length} itens cadastrados`}
        action={
          <button onClick={() => setShowProductModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Insumos/Produtos" value={String(totalItems)} icon={ShoppingBag} iconColor="text-blue-400" />
        <KpiCard title="Servicos" value={String(totalServices)} icon={Wrench} iconColor="text-purple-400" />
        <KpiCard
          title="Estoque Baixo"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          iconColor={lowStockCount > 0 ? "text-amber-400" : "text-emerald-400"}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-0">
        {[
          { value: "products", label: "Produtos & Servicos" },
          { value: "history", label: "Historico de Movimentacoes" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
              tab === t.value
                ? "text-blue-400 border-blue-400"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar produto ou servico..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
            />
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto encontrado"
              description="Cadastre seus servicos e insumos."
              action={
                <button onClick={() => setShowProductModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all">
                  <Plus className="w-4 h-4" /> Novo Produto
                </button>
              }
            />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-800/40">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Produto</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categoria</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preco</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estoque</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {products.map((p) => {
                      const isLow = !p.isService && p.stock <= p.minStock && p.minStock > 0;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", p.isService ? "bg-purple-500/10" : "bg-blue-500/10")}>
                                {p.isService ? <Wrench className="w-4 h-4 text-purple-400" /> : <ShoppingBag className="w-4 h-4 text-blue-400" />}
                              </div>
                              <span className="text-white font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", p.isService ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400")}>
                              {p.isService ? "Servico" : "Produto"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-zinc-400 text-xs">
                            {CATEGORY_LABELS[p.category ?? ""] ?? p.category ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-right text-white font-medium">
                            {formatBRL(p.price)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {p.isService ? (
                              <span className="text-zinc-600 text-xs">N/A</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                                <span className={cn("font-mono font-bold text-sm", isLow ? "text-amber-400" : "text-white")}>
                                  {p.stock} {p.unit}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!p.isService && (
                                <button
                                  onClick={() => setAdjustProduct(p)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition-all font-medium"
                                >
                                  Ajustar
                                </button>
                              )}
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                className="px-2 py-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "history" && (
        <>
          {transactions.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nenhuma movimentacao"
              description="As movimentacoes de estoque aparecerão aqui."
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3.5 hover:border-zinc-700 transition-all">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", t.type === "IN" ? "bg-emerald-500/10" : "bg-red-500/10")}>
                    {t.type === "IN" ? <ArrowDownCircle className="w-4 h-4 text-emerald-400" /> : <ArrowUpCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{t.productName}</p>
                    <p className="text-xs text-zinc-500">{t.notes ?? (t.type === "IN" ? "Entrada" : "Saida")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold", t.type === "IN" ? "text-emerald-400" : "text-red-400")}>
                      {t.type === "IN" ? "+" : "-"}{t.quantity} {t.productUnit}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {format(parseISO(t.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      {(showProductModal || editingProduct) && (
        <ModalProduct
          editing={editingProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSuccess={() => { setShowProductModal(false); setEditingProduct(null); router.refresh(); }}
        />
      )}

      {adjustProduct && (
        <ModalAjusteEstoque
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSuccess={() => { setAdjustProduct(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
