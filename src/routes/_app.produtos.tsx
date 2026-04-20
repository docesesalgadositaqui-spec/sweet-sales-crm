import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, Cookie, Search, Filter, X,
  TrendingUp, Package, Star, ToggleLeft, ToggleRight,
} from "lucide-react";
import { listAll, createRow, updateRow, deleteRow, type Produto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/produtos")({
  component: ProdutosPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const empty: Produto = {
  id: "", nome: "", categoria: "", sabor: "",
  preco: 0, custo: 0, estoque: 0, ativo: true, foto: "",
};

const CATEGORIA_COLORS: Record<string, string> = {
  "Doces": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "Bolos": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Doces Finos": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Salgados": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

function catColor(c?: string) {
  return c && CATEGORIA_COLORS[c] ? CATEGORIA_COLORS[c] : "bg-muted text-muted-foreground";
}

function margemClass(m: number) {
  if (m >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (m >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function ProdutosPage() {
  const [list, setList] = useState<Produto[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Produto>(empty);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState("todas");
  const [filterAtivo, setFilterAtivo] = useState<"todos" | "ativo" | "inativo">("todos");

  const load = () => listAll<Produto>("PRODUTOS").then(setList);
  useEffect(() => { load(); }, []);

  const categorias = useMemo(() =>
    ["todas", ...Array.from(new Set(list.map(p => p.categoria).filter(Boolean) as string[]))].sort(),
    [list]);

  const filtered = useMemo(() => {
    return list.filter(p => {
      const qLower = q.toLowerCase();
      const matchQ = !q ||
        p.nome?.toLowerCase().includes(qLower) ||
        p.sabor?.toLowerCase().includes(qLower) ||
        p.categoria?.toLowerCase().includes(qLower);
      const matchCat = filterCat === "todas" || p.categoria === filterCat;
      const isAtivo = p.ativo === true || p.ativo === "true" || p.ativo === "1";
      const matchAtivo =
        filterAtivo === "todos" ||
        (filterAtivo === "ativo" && isAtivo) ||
        (filterAtivo === "inativo" && !isAtivo);
      return matchQ && matchCat && matchAtivo;
    });
  }, [list, q, filterCat, filterAtivo]);

  // Summary stats
  const stats = useMemo(() => {
    const ativos = list.filter(p => p.ativo === true || p.ativo === "true" || p.ativo === "1");
    const avgMargem = ativos.length > 0
      ? ativos.reduce((s, p) => {
        const m = p.preco ? ((Number(p.preco) - Number(p.custo || 0)) / Number(p.preco)) * 100 : 0;
        return s + m;
      }, 0) / ativos.length
      : 0;
    const estoqueTotal = ativos.reduce((s, p) => s + Number(p.estoque || 0), 0);
    return { ativos: ativos.length, avgMargem, estoqueTotal };
  }, [list]);

  const save = async () => {
    if (!editing.nome.trim()) return toast.error("Informe o nome do produto");
    if (Number(editing.preco) <= 0) return toast.error("O preço de venda deve ser maior que zero");
    setSaving(true);
    const data = {
      ...editing,
      preco: Number(editing.preco),
      custo: Number(editing.custo || 0),
      estoque: Number(editing.estoque || 0),
    };
    try {
      if (editing.id) {
        await updateRow("PRODUTOS", data);
        toast.success("Produto atualizado!");
      } else {
        await createRow("PRODUTOS", data);
        toast.success("Produto cadastrado!");
      }
      setOpen(false);
      setEditing(empty);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await deleteRow("PRODUTOS", id);
    setDeleteId(null);
    toast.success("Produto removido");
    load();
  };

  const toggleAtivo = async (p: Produto) => {
    const wasAtivo = p.ativo === true || p.ativo === "true" || p.ativo === "1";
    await updateRow("PRODUTOS", { ...p, ativo: !wasAtivo });
    load();
    toast.success(wasAtivo ? "Produto desativado" : "Produto ativado");
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Cardápio</h1>
          <p className="text-muted-foreground mt-1">
            {stats.ativos} produtos ativos · Margem média{" "}
            <span className={margemClass(stats.avgMargem)}>
              {stats.avgMargem.toFixed(0)}%
            </span>
          </p>
        </div>
        <Button className="gap-2 shadow-[var(--shadow-soft)]" onClick={() => { setEditing(empty); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[var(--gradient-soft)] rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Total cadastrados</p>
          <p className="text-2xl font-bold mt-1">{list.length}</p>
        </div>
        <div className="bg-[var(--gradient-soft)] rounded-xl border p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Margem média</p>
          <p className={`text-2xl font-bold mt-1 ${margemClass(stats.avgMargem)}`}>
            {stats.avgMargem.toFixed(0)}%
          </p>
        </div>
        <div className="bg-[var(--gradient-soft)] rounded-xl border p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Estoque total</p>
          <p className="text-2xl font-bold mt-1">{stats.estoqueTotal} un</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, sabor, categoria..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQ("")}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[170px]">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categorias.map(c => (
              <SelectItem key={c} value={c}>{c === "todas" ? "Todas as categorias" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAtivo} onValueChange={(v) => setFilterAtivo(v as typeof filterAtivo)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(p => {
          const isAtivo = p.ativo === true || p.ativo === "true" || p.ativo === "1";
          const lucro = Number(p.preco || 0) - Number(p.custo || 0);
          const margem = p.preco ? (lucro / Number(p.preco)) * 100 : 0;
          const estoque = Number(p.estoque || 0);

          return (
            <Card
              key={p.id}
              className={`group overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-300 ${!isAtivo ? "opacity-60" : ""}`}
            >
              {/* Foto / placeholder */}
              <div className="aspect-[4/3] bg-[var(--gradient-soft)] flex items-center justify-center relative overflow-hidden">
                {p.foto ? (
                  <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                ) : (
                  <Cookie className="h-12 w-12 text-primary/30" />
                )}
                {/* Category badge */}
                {p.categoria && (
                  <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor(p.categoria)}`}>
                    {p.categoria}
                  </span>
                )}
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-all">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      className="h-7 w-7 bg-card text-foreground hover:bg-background shadow"
                      onClick={() => { setEditing({ ...empty, ...p, ativo: isAtivo }); setOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-7 w-7 bg-card text-destructive hover:bg-background shadow"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight">{p.nome}</h3>
                  {p.sabor && <p className="text-xs text-muted-foreground mt-0.5">{p.sabor}</p>}
                </div>

                {/* Price row */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-primary">{BRL(Number(p.preco || 0))}</span>
                  <span className="text-xs text-muted-foreground">custo {BRL(Number(p.custo || 0))}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs border-t pt-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {estoque > 0
                      ? `${estoque} un`
                      : <span className="text-red-500">Sem estoque</span>}
                  </span>
                  <span className={`font-semibold flex items-center gap-1 ${margemClass(margem)}`}>
                    <TrendingUp className="h-3 w-3" />
                    {margem.toFixed(0)}% margem
                  </span>
                </div>

                {/* Toggle ativo */}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className={`text-xs font-medium ${isAtivo ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {isAtivo ? "✓ Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={isAtivo}
                    onCheckedChange={() => toggleAtivo(p)}
                    className="scale-90"
                  />
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground gap-3">
            <Cookie className="h-12 w-12 opacity-20" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing.id ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <Field label="Nome do produto *">
              <Input
                placeholder="Ex: Brigadeiro Gourmet"
                value={editing.nome}
                onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <Input
                  placeholder="Ex: Doces, Bolos..."
                  value={editing.categoria}
                  onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}
                  list="cat-suggestions"
                />
                <datalist id="cat-suggestions">
                  <option value="Doces" />
                  <option value="Bolos" />
                  <option value="Doces Finos" />
                  <option value="Salgados" />
                  <option value="Bebidas" />
                </datalist>
              </Field>
              <Field label="Sabor / Recheio">
                <Input
                  placeholder="Ex: Chocolate Belga"
                  value={editing.sabor}
                  onChange={(e) => setEditing({ ...editing, sabor: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Preço de venda *">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={editing.preco || ""}
                  onChange={(e) => setEditing({ ...editing, preco: Number(e.target.value) })}
                />
              </Field>
              <Field label="Custo">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={editing.custo || ""}
                  onChange={(e) => setEditing({ ...editing, custo: Number(e.target.value) })}
                />
              </Field>
              <Field label="Estoque">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editing.estoque || ""}
                  onChange={(e) => setEditing({ ...editing, estoque: Number(e.target.value) })}
                />
              </Field>
            </div>

            {/* Margem preview */}
            {Number(editing.preco) > 0 && (
              <div className="bg-[var(--gradient-soft)] rounded-lg p-3 flex items-center justify-between text-sm border">
                <span className="text-muted-foreground">Margem de lucro:</span>
                <span className={`font-bold ${margemClass(
                  ((Number(editing.preco) - Number(editing.custo || 0)) / Number(editing.preco)) * 100
                )}`}>
                  {(((Number(editing.preco) - Number(editing.custo || 0)) / Number(editing.preco)) * 100).toFixed(1)}%
                  {" · "}
                  {BRL(Number(editing.preco) - Number(editing.custo || 0))} por unidade
                </span>
              </div>
            )}

            <Field label="Foto (URL)">
              <Input
                placeholder="https://..."
                value={editing.foto}
                onChange={(e) => setEditing({ ...editing, foto: e.target.value })}
              />
            </Field>

            <div className="flex items-center gap-3 py-1">
              <Switch
                checked={editing.ativo === true || editing.ativo === "true" || editing.ativo === "1"}
                onCheckedChange={(v) => setEditing({ ...editing, ativo: v })}
              />
              <Label className="text-sm">Produto ativo (visível nos pedidos)</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="min-w-[100px]">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir produto?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O produto será removido do cardápio.
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
