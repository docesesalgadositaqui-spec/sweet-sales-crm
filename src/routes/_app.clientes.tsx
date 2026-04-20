import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Plus, Search, Pencil, Trash2, Instagram, Phone, MapPin,
  Cake, ShoppingBag, Star, X, Filter, SortAsc, ChevronDown,
  User, MessageCircle,
} from "lucide-react";
import { listAll, createRow, updateRow, deleteRow, type Cliente } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clientes")({
  component: ClientesPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const empty: Cliente = {
  id: "", nome: "", telefone: "", instagram: "",
  cidade: "", aniversario: "", observacoes: "",
};

function initials(nome: string) {
  return nome.trim().split(" ").filter(Boolean).slice(0, 2)
    .map((n) => n[0]).join("").toUpperCase();
}

function isBirthdayThisMonth(aniversario?: string) {
  if (!aniversario) return false;
  const month = new Date().getMonth() + 1;
  const parts = aniversario.split("-");
  return parts.length >= 2 && Number(parts[1]) === month;
}

function getClientTier(valor: number) {
  if (valor >= 2000) return { label: "VIP", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  if (valor >= 500) return { label: "Fiel", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" };
  return { label: "Novo", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" };
}

// Avatar color palette (hue rotation based on name)
const AVATAR_COLORS = [
  "from-rose-400 to-pink-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-600",
  "from-sky-400 to-blue-600",
  "from-fuchsia-400 to-pink-500",
];

function avatarColor(nome: string) {
  const code = nome.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function ClientesPage() {
  const [list, setList] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"nome" | "valor" | "recente">("nome");
  const [filterCity, setFilterCity] = useState("todas");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Cliente>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => listAll<Cliente>("CLIENTES").then(setList);
  useEffect(() => { load(); }, []);

  const cities = useMemo(() =>
    ["todas", ...Array.from(new Set(list.map(c => c.cidade).filter(Boolean) as string[]))].sort(),
    [list]);

  const filtered = useMemo(() => {
    let data = list.filter(c => {
      const qLower = q.toLowerCase();
      const matchQ = !q ||
        c.nome?.toLowerCase().includes(qLower) ||
        c.cidade?.toLowerCase().includes(qLower) ||
        c.telefone?.includes(q) ||
        c.instagram?.toLowerCase().includes(qLower);
      const matchCity = filterCity === "todas" || c.cidade === filterCity;
      return matchQ && matchCity;
    });
    if (sort === "nome") data = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
    if (sort === "valor") data = [...data].sort((a, b) => Number(b.valor_total || 0) - Number(a.valor_total || 0));
    if (sort === "recente") data = [...data].sort((a, b) =>
      (b.ultima_compra || "").localeCompare(a.ultima_compra || ""));
    return data;
  }, [list, q, sort, filterCity]);

  const totalGasto = list.reduce((s, c) => s + Number(c.valor_total || 0), 0);
  const aniversariantes = list.filter(c => isBirthdayThisMonth(c.aniversario));

  const save = async () => {
    if (!editing.nome.trim()) return toast.error("Informe o nome do cliente");
    setSaving(true);
    try {
      if (editing.id) {
        await updateRow("CLIENTES", editing);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await createRow("CLIENTES", editing);
        toast.success("Cliente cadastrado com sucesso!");
      }
      setOpen(false);
      setEditing(empty);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await deleteRow("CLIENTES", id);
    setDeleteId(null);
    toast.success("Cliente removido");
    load();
  };

  const openEdit = (c: Cliente) => {
    setEditing({ ...empty, ...c });
    setOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            {list.length} cadastrados · {BRL(totalGasto)} em compras totais
          </p>
        </div>
        <Button className="gap-2 shadow-[var(--shadow-soft)]" onClick={() => { setEditing(empty); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </header>

      {/* Stats bar */}
      {aniversariantes.length > 0 && (
        <div className="flex items-center gap-3 bg-[var(--gradient-soft)] border rounded-xl px-4 py-3 text-sm">
          <Cake className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>{aniversariantes.length} cliente{aniversariantes.length > 1 ? "s fazem" : " faz"} aniversário</strong> este mês:{" "}
            {aniversariantes.map(c => c.nome.split(" ")[0]).join(", ")}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, cidade, telefone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQ("")}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cities.map(c => (
              <SelectItem key={c} value={c}>{c === "todas" ? "Todas as cidades" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-[160px]">
            <SortAsc className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nome">Ordenar por nome</SelectItem>
            <SelectItem value="valor">Maior valor gasto</SelectItem>
            <SelectItem value="recente">Compra recente</SelectItem>
          </SelectContent>
        </Select>

        {(q || filterCity !== "todas") && (
          <Badge variant="secondary" className="gap-1">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => {
          const tier = getClientTier(Number(c.valor_total || 0));
          const birthday = isBirthdayThisMonth(c.aniversario);
          return (
            <Card
              key={c.id}
              className="group p-5 hover:shadow-[var(--shadow-elegant)] transition-all duration-300 relative overflow-hidden"
            >
              {/* Birthday ribbon */}
              {birthday && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Cake className="h-3 w-3" /> Aniversário!
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${avatarColor(c.nome)} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md`}>
                  {initials(c.nome)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate pr-2">{c.nome}</h3>
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tier.color} mt-0.5`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {c.telefone && (
                  <a href={`tel:${c.telefone}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{c.telefone}</span>
                  </a>
                )}
                {c.instagram && (
                  <p className="flex items-center gap-2">
                    <Instagram className="h-3 w-3 shrink-0" />
                    <span>{c.instagram}</span>
                  </p>
                )}
                {c.cidade && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{c.cidade}</span>
                  </p>
                )}
                {c.aniversario && (
                  <p className="flex items-center gap-2">
                    <Cake className="h-3 w-3 shrink-0" />
                    <span>{new Date(c.aniversario + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</span>
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" />
                  {c.ultima_compra
                    ? `Última: ${new Date(c.ultima_compra + "T00:00:00").toLocaleDateString("pt-BR")}`
                    : "Sem compras"}
                </div>
                <span className="text-sm font-bold text-primary">{BRL(Number(c.valor_total || 0))}</span>
              </div>

              {c.observacoes && (
                <p className="mt-2 text-[11px] text-muted-foreground italic border-l-2 border-primary/20 pl-2 truncate">
                  {c.observacoes}
                </p>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground gap-3">
            <User className="h-12 w-12 opacity-20" />
            <p className="text-sm">Nenhum cliente encontrado</p>
            {q && <Button variant="link" onClick={() => setQ("")}>Limpar busca</Button>}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing.id ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <Field label="Nome completo *">
              <Input
                placeholder="Ex: Maria das Graças Silva"
                value={editing.nome}
                onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone / WhatsApp">
                <Input
                  placeholder="(11) 99999-0000"
                  value={editing.telefone}
                  onChange={(e) => setEditing({ ...editing, telefone: e.target.value })}
                />
              </Field>
              <Field label="Instagram">
                <Input
                  placeholder="@usuario"
                  value={editing.instagram}
                  onChange={(e) => setEditing({ ...editing, instagram: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade">
                <Input
                  placeholder="Ex: São Paulo"
                  value={editing.cidade}
                  onChange={(e) => setEditing({ ...editing, cidade: e.target.value })}
                />
              </Field>
              <Field label="Data de aniversário">
                <Input
                  type="date"
                  value={editing.aniversario}
                  onChange={(e) => setEditing({ ...editing, aniversario: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Observações">
              <Textarea
                rows={3}
                placeholder="Preferências, alergias, informações importantes..."
                value={editing.observacoes}
                onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="min-w-[100px]">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir cliente?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O histórico de compras deste cliente será mantido nos pedidos.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && remove(deleteId)}>
              Excluir
            </Button>
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
