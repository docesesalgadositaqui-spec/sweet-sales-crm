import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getApiUrl, setApiUrl, isUsingMock, setUsingMock, resetMock } from "@/lib/api";
import { getComprasApiUrl, setComprasApiUrl } from "@/lib/compras-api";
import { toast } from "sonner";
import { Database, Link as LinkIcon, RefreshCw, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const [url, setUrl] = useState("");
  const [comprasUrl, setComprasUrl] = useState("");
  const [mock, setMock] = useState(false);

  useEffect(() => {
    setUrl(getApiUrl());
    setComprasUrl(getComprasApiUrl());
    setMock(isUsingMock());
  }, []);

  const save = () => {
    setApiUrl(url.trim());
    setComprasApiUrl(comprasUrl.trim());
    setUsingMock(mock);
    toast.success("Configurações salvas");
  };

  const reset = () => {
    if (!confirm("Restaurar dados de exemplo?")) return;
    resetMock();
    toast.success("Dados de exemplo restaurados");
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Conexão com o Google Sheets</p>
      </header>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LinkIcon className="h-4 w-4 text-primary" /> API principal (Clientes, Produtos, Pedidos)
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Endpoint</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
          <p className="text-xs text-muted-foreground">
            Apps Script com as abas <strong>CLIENTES</strong>, <strong>PRODUTOS</strong> e <strong>PEDIDOS</strong>.
          </p>
        </div>

        <div className="border-t pt-4 flex items-center gap-2 text-sm font-semibold">
          <ShoppingCart className="h-4 w-4 text-primary" /> API de Compras (aba "i")
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Endpoint</Label>
          <Input
            value={comprasUrl}
            onChange={(e) => setComprasUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
          <p className="text-xs text-muted-foreground">
            Segundo Apps Script (formato <code className="bg-muted px-1 rounded">acao</code> / <code className="bg-muted px-1 rounded">dados.campos</code>) que acessa a aba <strong>i</strong>.
          </p>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <Label className="text-sm">Usar dados de exemplo (offline)</Label>
            <p className="text-xs text-muted-foreground">Ative para testar sem precisar do Apps Script.</p>
          </div>
          <Switch checked={mock} onCheckedChange={setMock} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={save}>Salvar</Button>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Restaurar exemplo
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Database className="h-4 w-4 text-primary" /> Como funciona
        </div>
        <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
          <li>A <strong className="text-foreground">API principal</strong> alimenta as telas de Clientes, Produtos e Pedidos.</li>
          <li>A <strong className="text-foreground">API de Compras</strong> é independente e alimenta apenas a tela Compras (aba "i").</li>
          <li>Você pode usar a mesma URL nas duas, ou Apps Scripts diferentes — fica a seu critério.</li>
        </ul>
      </Card>
    </div>
  );
}
