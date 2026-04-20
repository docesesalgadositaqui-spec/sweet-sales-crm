import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, ShoppingCart, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  listCompras, addCompra, updateCompra, deleteCompra, type CompraItem,
} from "@/lib/compras-api";

export const Route = createFileRoute("/_app/compras")({
  component: ComprasPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ComprasPage() {
  const [list, setList] = useState<CompraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteLinha, setDeleteLinha] = useState<number | null>(null);
  const [editing, setEditing] = useState<CompraItem>({ linha: 0, produto: "", preco: 0 });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    listCompras()
      .then(setList)
      .catch(() => toast.error("Não foi possível carregar a aba i"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return list;
    return list.filter((c) => c.produto.toLowerCase().includes(t));
  }, [list, q]);

  const total = useMemo(
    () => list.reduce((s, c) => s + Number(c.preco || 0), 0),
    [list],
  );

  const save = async () => {
    if (!editing.produto.trim()) return toast.error("Informe o nome do item");
    setSaving(true);
    try {
      if (editing.linha > 0) {
        await updateCompra(editing.linha, editing.produto.trim(), Number(editing.preco) || 0);
        toast.success("Item atualizado");
      } else {
        await addCompra(editing.produto.trim(), Number(editing.preco) || 0);
        toast.success("Item adicionado");
      }
      setOpen(false);
      setEditing({ linha: 0, produto: "", preco: 0 });
      load();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (linha: number) => {
    try {
      await deleteCompra(linha);
      toast.success("Item removido");
      setDeleteLinha(null);
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Compras</h1>
          <p className="text-muted-foreground mt-1">
            {list.length} {list.length === 1 ? "item" : "itens"} · Total {BRL(total)}
          </p>
        </div>
        <Button
          className="gap-2 shadow-[var(--shadow-soft)]"
          onClick={() => { setEditing({ linha: 0, produto: "", preco: 0 }); setOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Novo item
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[var(--gradient-soft)] rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          <p className="text-2xl font-bold mt-1">{list.length}</p>
        </div>
        <div className="bg-[var(--gradient-soft)] rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Valor total</p>
          <p className="text-2xl font-bold mt-1 text-primary">{BRL(total)}</p>
        </div>
        <div className="bg-[var(--gradient-soft)] rounded-xl border p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Preço médio</p>
          <p className="text-2xl font-bold mt-1">
            {list.length > 0 ? BRL(total / list.length) : BRL(0)}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar item..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQ("")}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Item</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="w-[120px] text-right pr-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 opacity-20 mx-auto mb-2" />
                  <p className="text-sm">Nenhum item encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.linha}>
                  <TableCell className="pl-4 font-medium">{c.produto}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {BRL(Number(c.preco || 0))}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { setEditing(c); setOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteLinha(c.linha)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing({ linha: 0, produto: "", preco: 0 }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.linha > 0 ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Item *</Label>
              <Input
                placeholder="Ex: Leite Condensado"
                value={editing.produto}
                onChange={(e) => setEditing({ ...editing, produto: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={editing.preco || ""}
                onChange={(e) => setEditing({ ...editing, preco: Number(e.target.value) })}
              />
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
      <Dialog open={deleteLinha !== null} onOpenChange={(o) => !o && setDeleteLinha(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir item?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação irá limpar a linha na planilha. Não é possível desfazer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteLinha(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteLinha !== null && remove(deleteLinha)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
