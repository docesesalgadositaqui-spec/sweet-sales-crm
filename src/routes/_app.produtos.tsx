import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Cookie } from "lucide-react";
import { listAll, createRow, updateRow, deleteRow, type Produto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/produtos")({
  component: ProdutosPage,
});

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const empty: Produto = { id: "", nome: "", categoria: "", sabor: "", preco: 0, custo: 0, estoque: 0, ativo: true, foto: "" };

function ProdutosPage() {
  const [list, setList] = useState<Produto[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto>(empty);

  const load = () => listAll<Produto>("PRODUTOS").then(setList);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.nome.trim()) return toast.error("Informe o nome");
    const data = { ...editing, preco: Number(editing.preco), custo: Number(editing.custo), estoque: Number(editing.estoque) };
    if (editing.id) { await updateRow("PRODUTOS", data); toast.success("Atualizado"); }
    else { await createRow("PRODUTOS", data); toast.success("Cadastrado"); }
    setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await deleteRow("PRODUTOS", id); toast.success("Removido"); load();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Doces</h1>
          <p className="text-muted-foreground mt-1">{list.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo doce</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing.id ? "Editar doce" : "Novo doce"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <Field label="Nome *"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria"><Input value={editing.categoria} onChange={(e) => setEditing({ ...editing, categoria: e.target.value })} /></Field>
                <Field label="Sabor"><Input value={editing.sabor} onChange={(e) => setEditing({ ...editing, sabor: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Preço"><Input type="number" step="0.01" value={editing.preco} onChange={(e) => setEditing({ ...editing, preco: Number(e.target.value) })} /></Field>
                <Field label="Custo"><Input type="number" step="0.01" value={editing.custo} onChange={(e) => setEditing({ ...editing, custo: Number(e.target.value) })} /></Field>
                <Field label="Estoque"><Input type="number" value={editing.estoque} onChange={(e) => setEditing({ ...editing, estoque: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Foto (URL)"><Input value={editing.foto} onChange={(e) => setEditing({ ...editing, foto: e.target.value })} /></Field>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={!!editing.ativo} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map(p => {
          const lucro = Number(p.preco || 0) - Number(p.custo || 0);
          const margem = p.preco ? (lucro / Number(p.preco)) * 100 : 0;
          return (
            <Card key={p.id} className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-shadow">
              <div className="aspect-video bg-[var(--gradient-soft)] flex items-center justify-center">
                {p.foto
                  ? <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                  : <Cookie className="h-10 w-10 text-primary/40" />}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{p.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.sabor} · {p.categoria}</p>
                  </div>
                  {!p.ativo && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <span className="text-lg font-bold text-primary">{BRL(Number(p.preco || 0))}</span>
                  <span className="text-xs text-muted-foreground">Estoque: {p.estoque}</span>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Lucro: <span className="text-foreground font-medium">{BRL(lucro)}</span>
                  <span className="ml-1">({margem.toFixed(0)}%)</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => { setEditing({ ...empty, ...p, ativo: !!p.ativo }); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-12">Nenhum doce cadastrado.</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
