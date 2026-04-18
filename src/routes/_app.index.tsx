import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { ShoppingBag, Users, DollarSign, Clock, Wallet, TrendingUp } from "lucide-react";
import { listAll, type Cliente, type Pedido, type Produto, type PedidoItem } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfMonth, isSameMonth, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    Promise.all([
      listAll<Cliente>("CLIENTES"),
      listAll<Produto>("PRODUTOS"),
      listAll<Pedido>("PEDIDOS"),
    ]).then(([c, p, o]) => {
      setClientes(c); setProdutos(p); setPedidos(o);
    });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const monthOrders = pedidos.filter(p => {
      try { return isSameMonth(parseISO(p.data_pedido), now); } catch { return false; }
    });
    const faturamento = monthOrders
      .filter(p => p.status === "Entregue")
      .reduce((s, p) => s + Number(p.valor_total || 0), 0);
    const emAndamento = pedidos.filter(p =>
      ["Aguardando pagamento", "Em produção", "Pronto"].includes(p.status)
    ).length;
    const aReceber = pedidos
      .filter(p => p.status === "Aguardando pagamento")
      .reduce((s, p) => s + Number(p.valor_total || 0), 0);
    return { faturamento, vendas: monthOrders.length, emAndamento, aReceber };
  }, [pedidos]);

  const ranking = useMemo(() => {
    const map = new Map<string, number>();
    pedidos.forEach(p => {
      const itens: PedidoItem[] = Array.isArray(p.itens)
        ? p.itens
        : (typeof p.itens === "string" ? safeParse(p.itens) : []);
      itens.forEach(i => map.set(i.nome, (map.get(i.nome) || 0) + Number(i.qtd || 0)));
    });
    return Array.from(map.entries())
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);
  }, [pedidos]);

  const vendasPeriodo = useMemo(() => {
    const days = 14;
    const start = subDays(new Date(), days - 1);
    const arr: { dia: string; total: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = subDays(new Date(), days - 1 - i);
      const total = pedidos
        .filter(p => {
          try { return format(parseISO(p.data_pedido), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"); }
          catch { return false; }
        })
        .reduce((s, p) => s + Number(p.valor_total || 0), 0);
      arr.push({ dia: format(d, "dd/MM"), total });
    }
    return arr;
  }, [pedidos]);

  const recentes = pedidos.slice().sort((a, b) => (b.data_pedido > a.data_pedido ? 1 : -1)).slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Olá, doçura ✨</h1>
          <p className="text-muted-foreground mt-1">
            Resumo de {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">{clientes.length} clientes · {produtos.length} doces</Badge>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento do mês" value={BRL(stats.faturamento)} icon={DollarSign} />
        <StatCard label="Vendas do mês" value={String(stats.vendas)} icon={ShoppingBag} accent="success" />
        <StatCard label="Em andamento" value={String(stats.emAndamento)} icon={Clock} accent="warning" />
        <StatCard label="A receber" value={BRL(stats.aReceber)} icon={Wallet} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Vendas dos últimos 14 dias</h2>
              <p className="text-xs text-muted-foreground">Valor total por dia</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v) => BRL(Number(v))}
                />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5}
                  dot={{ fill: "var(--primary)", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">Top doces vendidos</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="nome" stroke="var(--muted-foreground)" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                />
                <Bar dataKey="qtd" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3">Pedidos recentes</h2>
          <div className="space-y-3">
            {recentes.map(p => (
              <div key={p.id} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{p.cliente_nome}</p>
                  <p className="text-xs text-muted-foreground">{p.data_pedido}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{BRL(Number(p.valor_total || 0))}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {recentes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Clientes recentes
          </h2>
          <div className="space-y-3">
            {clientes.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.cidade}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{BRL(Number(c.valor_total || 0))}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function safeParse(s: string): PedidoItem[] {
  try { const r = JSON.parse(s); return Array.isArray(r) ? r : []; } catch { return []; }
}

function StatusBadge({ status }: { status: string }) {
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
