import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Trash } from "lucide-react";
import {
  listAll, createRow, updateRow, deleteRow,
  type Pedido, type PedidoItem, type Cliente, type Produto, type PedidoStatus,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pedidos")({
  component: PedidosPage,
});

const STATUSES: PedidoStatus[] = ["Orçamento", "Aguardando pagamento", "Em produção", "Pronto", "Entregue", "Cancelado"];
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function emptyPedido(): Pedido {
  return {
    id: "", cliente_id: "", cliente_nome: "", itens: [], valor_total: 0, pagamento: "PIX",
    data_pedido: new Date().toISOString().slice(0, 10), data_entrega: "",
    status: "Orçamento", observacoes: "",
  };
}

function parseItens(v: PedidoItem[] | string): PedidoItem[] {
  if (Array.isArray(v)) return v;
  try { const r = JSON.parse(v); return Array.isArray(r) ? r : []; } catch { return []; }
}

function PedidosPage() {
  const [list, setList] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pedido>(emptyPedido());
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const load = async () => {
    const [p, c, pr] = await Promise.all([
      listAll<Pedido>("PEDIDOS"), listAll<Cliente>("CLIENTES"), listAll<Produto>("PRODUTOS"),
    ]);
    setList(p.map(x => ({ ...x, itens: parseItens(x.itens) }))); setClientes(c); setProdutos(pr);
  };
  useEffect(() => { load(); }, []);

  const itens = parseItens(editing.itens);
  const total = useMemo(() => itens.reduce((s, i) => s + Number(i.qtd || 0) * Number(i.preco || 0), 0), [itens]);

  const filtered = list.filter(p => statusFilter === "todos" || p.status === statusFilter);

  const addItem = () => {
    if (produtos.length === 0) return toast.error("Cadastre um doce primeiro");
    const p = produtos[0];
    setEditing({ ...editing, itens: [...itens, { produto_id: p.id, nome: p.nome, qtd: 1, preco: Number(p.preco) }] });
  };
  const updItem = (idx: number, patch: Partial<PedidoItem>) => {
    const next = itens.map((it, i) => i === idx ? { ...it, ...patch } : it);
    setEditing({ ...editing, itens: next });
  };
  const rmItem = (idx: number) => setEditing({ ...editing, itens: itens.filter((_, i) => i !== idx) });

  const save = async () => {
    if (!editing.cliente_id) return toast.error("Selecione o cliente");
    if (itens.length === 0) return toast.error("Adicione ao menos 1 item");
    const cliente = clientes.find(c => c.id === editing.cliente_id);
    const data: Pedido = {
      ...editing,
      cliente_nome: cliente?.nome || editing.cliente_nome,
      valor_total: total,
      itens: JSON.stringify(itens) as any,
    };
    if (editing.id) { await updateRow("PEDIDOS", data); toast.success("Pedido atualizado"); }
    else { await createRow("PEDIDOS", data); toast.success("Pedido criado"); }
    setOpen(false); setEditing(emptyPedido()); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir pedido?")) return;
    await deleteRow("PEDIDOS", id); toast.success("Removido"); load();
  };

  const startEdit = (p: Pedido) => {
    setEditing({ ...p, itens: parseItens(p.itens) });
    setOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground mt-1">{list.length} no total</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(emptyPedido()); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo pedido</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing.id ? "Editar pedido" : "Novo pedido"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cliente *">
                    <Select value={editing.cliente_id} onValueChange={(v) => setEditing({ ...editing, cliente_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as PedidoStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Data pedido"><Input type="date" value={editing.data_pedido} onChange={(e) => setEditing({ ...editing, data_pedido: e.target.value })} /></Field>
                  <Field label="Data entrega"><Input type="date" value={editing.data_entrega} onChange={(e) => setEditing({ ...editing, data_entrega: e.target.value })} /></Field>
                  <Field label="Pagamento">
                    <Select value={editing.pagamento} onValueChange={(v) => setEditing({ ...editing, pagamento: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["PIX", "Cartão", "Dinheiro", "Transferência"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Itens</Label>
                    <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                  </div>
                  {itens.length === 0 && <p className="text-xs text-muted-foreground py-3 text-center">Nenhum item</p>}
                  {itens.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <Select value={it.produto_id} onValueChange={(v) => {
                        const p = produtos.find(x => x.id === v);
                        updItem(i, { produto_id: v, nome: p?.nome || "", preco: Number(p?.preco || 0) });
                      }}>
                        <SelectTrigger className="col-span-6 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input className="col-span-2 h-9" type="number" min="1" value={it.qtd} onChange={(e) => updItem(i, { qtd: Number(e.target.value) })} />
                      <Input className="col-span-3 h-9" type="number" step="0.01" value={it.preco} onChange={(e) => updItem(i, { preco: Number(e.target.value) })} />
                      <Button size="icon" variant="ghost" className="col-span-1 h-9 w-9" onClick={() => rmItem(i)}>
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t text-sm">
                    Total: <span className="font-bold text-primary ml-2">{BRL(total)}</span>
                  </div>
                </div>

                <Field label="Observações"><Textarea rows={2} value={editing.observacoes} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="space-y-3">
        {filtered.map(p => {
          const its = parseItens(p.itens);
          return (
            <Card key={p.id} className="p-4 hover:shadow-[var(--shadow-elegant)] transition-shadow">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{p.cliente_nome}</h3>
                    <StatusPill status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pedido {p.data_pedido} · Entrega {p.data_entrega || "—"} · {p.pagamento}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {its.map(i => `${i.qtd}× ${i.nome}`).join(" · ") || "Sem itens"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{BRL(Number(p.valor_total || 0))}</p>
                  <div className="flex gap-1 mt-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Nenhum pedido.</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Orçamento": "bg-muted text-muted-foreground",
    "Aguardando pagamento": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "Em produção": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "Pronto": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "Entregue": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    "Cancelado": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || ""}`}>{status}</span>;
}
