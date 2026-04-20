import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Trash, Search, X, ChevronDown,
  CalendarDays, CreditCard, User, Package, Clock,
  CheckCircle2, AlertCircle, XCircle, ShoppingBag,
  Filter, ReceiptText, ChevronRight,
} from "lucide-react";
import {
  listAll, createRow, updateRow, deleteRow,
  type Pedido, type PedidoItem, type Cliente, type Produto, type PedidoStatus,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pedidos")({
  component: PedidosPage,
});

const STATUSES: PedidoStatus[] = [
  "Orçamento", "Aguardando pagamento", "Em produção", "Pronto", "Entregue", "Cancelado",
];

const STATUS_META: Record<PedidoStatus, { icon: React.ElementType; color: string; bg: string; dot: string }> = {
  "Orçamento":             { icon: ReceiptText,    color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-800/40",   dot: "bg-slate-400" },
  "Aguardando pagamento":  { icon: AlertCircle,    color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-50 dark:bg-amber-900/30",    dot: "bg-amber-400" },
  "Em produção":           { icon: Clock,          color: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-50 dark:bg-blue-900/30",      dot: "bg-blue-500" },
  "Pronto":                { icon: Package,        color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-900/30",  dot: "bg-violet-500" },
  "Entregue":              { icon: CheckCircle2,   color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-500" },
  "Cancelado":             { icon: XCircle,        color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/30",        dot: "bg-red-500" },
};

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PAGAMENTOS = ["PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Transferência", "Boleto"];

function emptyPedido(): Pedido {
  return {
    id: "", cliente_id: "", cliente_nome: "", itens: [],
    valor_total: 0, pagamento: "PIX",
    data_pedido: new Date().toISOString().slice(0, 10),
    data_entrega: "", status: "Orçamento", observacoes: "",
  };
}

function parseItens(v: PedidoItem[] | string): PedidoItem[] {
  if (Array.isArray(v)) return v;
  try { const r = JSON.parse(v); return Array.isArray(r) ? r : []; } catch { return []; }
}

function StatusPill({ status }: { status: PedidoStatus | string }) {
  const meta = STATUS_META[status as PedidoStatus];
  if (!meta) return <span>{status}</span>;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium ${meta.color} ${meta.bg}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

// Status progress bar (linear workflow)
const STATUS_ORDER: PedidoStatus[] = ["Orçamento", "Aguardando pagamento", "Em produção", "Pronto", "Entregue"];

function StatusProgress({ status }: { status: PedidoStatus }) {
  const idx = STATUS_ORDER.indexOf(status);
  if (status === "Cancelado") return (
    <div className="flex items-center gap-1 text-xs text-red-500">
      <XCircle className="h-3.5 w-3.5" /> Pedido cancelado
    </div>
  );
  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= idx;
        const meta = STATUS_META[s];
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full transition-all ${done ? meta.dot : "bg-muted"}`} title={s} />
            {i < STATUS_ORDER.length - 1 && (
              <div className={`h-0.5 w-4 transition-all ${done && i < idx ? meta.dot : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PedidosPage() {
  const [list, setList] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Pedido>(emptyPedido());
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    const [p, c, pr] = await Promise.all([
      listAll<Pedido>("PEDIDOS"),
      listAll<Cliente>("CLIENTES"),
      listAll<Produto>("PRODUTOS"),
    ]);
    setList(p.map(x => ({ ...x, itens: parseItens(x.itens) })));
    setClientes(c);
    setProdutos(pr.filter(x => x.ativo === true || x.ativo === "true" || x.ativo === "1"));
  };

  useEffect(() => { load(); }, []);

  const itens = parseItens(editing.itens);
  const total = useMemo(() =>
    itens.reduce((s, i) => s + Number(i.qtd || 0) * Number(i.preco || 0), 0),
    [itens]);

  const filtered = useMemo(() => {
    let data = list.filter(p => {
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      const qLower = q.toLowerCase();
      const matchQ = !q ||
        p.cliente_nome?.toLowerCase().includes(qLower) ||
        p.id?.toLowerCase().includes(qLower) ||
        (p.observacoes || "").toLowerCase().includes(qLower);
      return matchStatus && matchQ;
    });
    return data.sort((a, b) => (b.data_pedido > a.data_pedido ? 1 : -1));
  }, [list, statusFilter, q]);

  // Stats
  const stats = useMemo(() => {
    const total_pedidos = list.length;
    const em_aberto = list.filter(p => !["Entregue", "Cancelado"].includes(p.status)).length;
    const faturado = list.filter(p => p.status === "Entregue")
      .reduce((s, p) => s + Number(p.valor_total || 0), 0);
    const a_receber = list.filter(p => p.status === "Aguardando pagamento")
      .reduce((s, p) => s + Number(p.valor_total || 0), 0);
    return { total_pedidos, em_aberto, faturado, a_receber };
  }, [list]);

  const addItem = () => {
    if (produtos.length === 0) return toast.error("Cadastre um produto primeiro");
    const p = produtos[0];
    setEditing({
      ...editing,
      itens: [...itens, { produto_id: p.id, nome: p.nome, qtd: 1, preco: Number(p.preco) }],
    });
  };

  const updItem = (idx: number, patch: Partial<PedidoItem>) => {
    setEditing({ ...editing, itens: itens.map((it, i) => i === idx ? { ...it, ...patch } : it) });
  };

  const rmItem = (idx: number) =>
    setEditing({ ...editing, itens: itens.filter((_, i) => i !== idx) });

  const pickProduct = (idx: number, productId: string) => {
    const p = produtos.find(x => x.id === productId);
    updItem(idx, { produto_id: productId, nome: p?.nome || "", preco: Number(p?.preco || 0) });
  };

  const save = async () => {
    if (!editing.cliente_id) return toast.error("Selecione o cliente");
    if (itens.length === 0) return toast.error("Adicione ao menos 1 item ao pedido");
    const cliente = clientes.find(c => c.id === editing.cliente_id);
    const data: Pedido = {
      ...editing,
      cliente_nome: cliente?.nome || editing.cliente_nome,
      valor_total: total,
      itens: JSON.stringify(itens) as any,
    };
    setSaving(true);
    try {
      if (editing.id) {
        await updateRow("PEDIDOS", data);
        toast.success("Pedido atualizado!");
      } else {
        await createRow("PEDIDOS", data);
        toast.success("Pedido criado!");
      }
      setOpen(false);
      setEditing(emptyPedido());
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await deleteRow("PEDIDOS", id);
    setDeleteId(null);
    toast.success("Pedido removido");
    load();
  };

  const startEdit = (p: Pedido) => {
    setEditing({ ...p, itens: parseItens(p.itens) });
    setOpen(true);
  };

  const quickStatus = async (p: Pedido, newStatus: PedidoStatus) => {
    await updateRow("PEDIDOS", { ...p, status: newStatus, itens: JSON.stringify(parseItens(p.itens)) as any });
    toast.success(`Status atualizado para "${newStatus}"`);
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            {stats.em_aberto} em aberto · {BRL(stats.a_receber)} a receber
          </p>
        </div>
        <Button
          className="gap-2 shadow-[var(--shadow-soft)]"
          onClick={() => { setEditing(emptyPedido()); setOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Novo pedido
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de pedidos", value: String(stats.total_pedidos), dot: "bg-slate-400" },
          { label: "Em aberto", value: String(stats.em_aberto), dot: "bg-blue-500" },
          { label: "Faturado (entregue)", value: BRL(stats.faturado), dot: "bg-emerald-500" },
          { label: "A receber", value: BRL(stats.a_receber), dot: "bg-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-[var(--gradient-soft)] rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${s.dot}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por cliente ou observações..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQ("")}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[210px]">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
                  {s}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(q || statusFilter !== "todos") && (
          <Badge variant="secondary">{filtered.length} pedido{filtered.length !== 1 ? "s" : ""}</Badge>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(p => {
          const its = parseItens(p.itens);
          const isExpanded = expandedId === p.id;
          const meta = STATUS_META[p.status as PedidoStatus] || STATUS_META["Orçamento"];
          const nextIdx = STATUS_ORDER.indexOf(p.status as PedidoStatus);
          const nextStatus = nextIdx >= 0 && nextIdx < STATUS_ORDER.length - 1
            ? STATUS_ORDER[nextIdx + 1] : null;

          return (
            <Card key={p.id} className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
              {/* Main row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Color indicator */}
                    <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${meta.dot}`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{p.cliente_nome}</h3>
                        <StatusPill status={p.status as PedidoStatus} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Pedido: {new Date(p.data_pedido + "T00:00:00").toLocaleDateString("pt-BR")}
                        </span>
                        {p.data_entrega && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Entrega: {new Date(p.data_entrega + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {p.pagamento}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1.5 truncate">
                        {its.map(i => `${i.qtd}× ${i.nome}`).join(" · ") || "Sem itens"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{BRL(Number(p.valor_total || 0))}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{its.length} item{its.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {p.status !== "Cancelado" && (
                  <div className="mt-3 flex items-center gap-2">
                    <StatusProgress status={p.status as PedidoStatus} />
                    {nextStatus && (
                      <button
                        className="text-[10px] text-primary hover:underline font-medium ml-2"
                        onClick={() => quickStatus(p, nextStatus)}
                      >
                        → Mover para "{nextStatus}"
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t bg-muted/30 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Itens do pedido</h4>
                  <div className="space-y-2">
                    {its.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{it.qtd}× {it.nome}</span>
                        <span className="font-medium">{BRL(it.qtd * it.preco)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">{BRL(Number(p.valor_total || 0))}</span>
                    </div>
                  </div>
                  {p.observacoes && (
                    <div className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-2 italic">
                      {p.observacoes}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {STATUSES.filter(s => s !== p.status).map(s => (
                      <button
                        key={s}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${STATUS_META[s].color} ${STATUS_META[s].bg} hover:opacity-80 transition-opacity`}
                        onClick={() => quickStatus(p, s)}
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
            <ShoppingBag className="h-12 w-12 opacity-20" />
            <p className="text-sm">Nenhum pedido encontrado</p>
            <Button onClick={() => { setEditing(emptyPedido()); setOpen(true); }} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Criar primeiro pedido
            </Button>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(emptyPedido()); }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing.id ? "Editar pedido" : "Novo pedido"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Cliente + Status */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cliente *">
                <Select
                  value={editing.cliente_id}
                  onValueChange={(v) => {
                    const c = clientes.find(x => x.id === v);
                    setEditing({ ...editing, cliente_id: v, cliente_nome: c?.nome || "" });
                  }}
                >
                  <SelectTrigger>
                    <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status">
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as PedidoStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
                          {s}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Datas + Pagamento */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Data do pedido">
                <Input
                  type="date"
                  value={editing.data_pedido}
                  onChange={(e) => setEditing({ ...editing, data_pedido: e.target.value })}
                />
              </Field>
              <Field label="Data de entrega">
                <Input
                  type="date"
                  value={editing.data_entrega}
                  onChange={(e) => setEditing({ ...editing, data_entrega: e.target.value })}
                />
              </Field>
              <Field label="Forma de pagamento">
                <Select
                  value={editing.pagamento}
                  onValueChange={(v) => setEditing({ ...editing, pagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGAMENTOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Itens */}
            <div className="border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                <Label className="font-semibold text-sm">Itens do pedido</Label>
                <Button size="sm" variant="outline" onClick={addItem} className="gap-1 h-8">
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </Button>
              </div>

              <div className="p-3 space-y-2">
                {itens.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Nenhum item adicionado. Clique em "+ Adicionar item" para começar.
                  </p>
                )}

                {/* Column headers */}
                {itens.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground uppercase tracking-wide px-1">
                    <span className="col-span-5">Produto</span>
                    <span className="col-span-2 text-center">Qtd</span>
                    <span className="col-span-3 text-right">Preço unit.</span>
                    <span className="col-span-2 text-right">Subtotal</span>
                  </div>
                )}

                {itens.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Select
                      value={it.produto_id}
                      onValueChange={(v) => pickProduct(i, v)}
                    >
                      <SelectTrigger className="col-span-5 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      className="col-span-2 h-9 text-center text-sm"
                      type="number"
                      min="1"
                      value={it.qtd}
                      onChange={(e) => updItem(i, { qtd: Math.max(1, Number(e.target.value)) })}
                    />

                    <Input
                      className="col-span-3 h-9 text-sm"
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.preco}
                      onChange={(e) => updItem(i, { preco: Number(e.target.value) })}
                    />

                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="text-xs font-medium">{BRL(it.qtd * it.preco)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => rmItem(i)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {itens.length > 0 && (
                  <div className="flex justify-end items-center gap-2 pt-2 border-t text-sm font-semibold">
                    <span className="text-muted-foreground font-normal">Total:</span>
                    <span className="text-primary text-lg">{BRL(total)}</span>
                  </div>
                )}
              </div>
            </div>

            <Field label="Observações / anotações">
              <Textarea
                rows={2}
                placeholder="Embalagem especial, mensagem no bolo, referência de entrega..."
                value={editing.observacoes}
                onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="min-w-[120px]">
              {saving ? "Salvando..." : editing.id ? "Atualizar pedido" : "Criar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir pedido?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O pedido será removido permanentemente.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && remove(deleteId)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
