import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Instagram, Phone, MapPin } from "lucide-react";
import { listAll, createRow, updateRow, deleteRow, type Cliente } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clientes")({
  component: ClientesPage,
});

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const empty: Cliente = { id: "", nome: "", telefone: "", instagram: "", cidade: "", aniversario: "", observacoes: "" };

function ClientesPage() {
  const [list, setList] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente>(empty);

  const load = () => listAll<Cliente>("CLIENTES").then(setList);
  useEffect(() => { load(); }, []);

  const filtered = list.filter(c =>
    !q || c.nome?.toLowerCase().includes(q.toLowerCase()) || c.cidade?.toLowerCase().includes(q.toLowerCase())
  );

  const save = async () => {
    if (!editing.nome.trim()) return toast.error("Informe o nome");
    if (editing.id) {
      await updateRow("CLIENTES", editing);
      toast.success("Cliente atualizado");
    } else {
      await createRow("CLIENTES", editing);
      toast.success("Cliente cadastrado");
    }
    setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await deleteRow("CLIENTES", id);
    toast.success("Cliente removido"); load();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">{list.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <Field label="Nome *"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone"><Input value={editing.telefone} onChange={(e) => setEditing({ ...editing, telefone: e.target.value })} /></Field>
                <Field label="Instagram"><Input value={editing.instagram} onChange={(e) => setEditing({ ...editing, instagram: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade"><Input value={editing.cidade} onChange={(e) => setEditing({ ...editing, cidade: e.target.value })} /></Field>
                <Field label="Aniversário"><Input type="date" value={editing.aniversario} onChange={(e) => setEditing({ ...editing, aniversario: e.target.value })} /></Field>
              </div>
              <Field label="Observações">
                <Textarea rows={3} value={editing.observacoes} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou cidade..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <Card key={c.id} className="p-4 hover:shadow-[var(--shadow-elegant)] transition-shadow">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{c.nome}</h3>
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  {c.telefone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.telefone}</p>}
                  {c.instagram && <p className="flex items-center gap-1.5"><Instagram className="h-3 w-3" /> {c.instagram}</p>}
                  {c.cidade && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {c.cidade}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => { setEditing({ ...empty, ...c }); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total gasto</span>
              <span className="font-semibold text-primary">{BRL(Number(c.valor_total || 0))}</span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-12">Nenhum cliente encontrado.</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
