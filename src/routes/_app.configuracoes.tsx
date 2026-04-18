import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getApiUrl, setApiUrl, isUsingMock, setUsingMock, resetMock } from "@/lib/api";
import { toast } from "sonner";
import { Database, Link as LinkIcon, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const [url, setUrl] = useState("");
  const [mock, setMock] = useState(false);

  useEffect(() => { setUrl(getApiUrl()); setMock(isUsingMock()); }, []);

  const save = () => {
    setApiUrl(url.trim());
    setUsingMock(mock);
    toast.success("Configurações salvas");
  };

  const reset = () => {
    if (!confirm("Restaurar dados de exemplo?")) return;
    resetMock(); toast.success("Dados de exemplo restaurados");
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Conexão com o Google Sheets</p>
      </header>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LinkIcon className="h-4 w-4 text-primary" /> URL do Apps Script
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Endpoint</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" />
          <p className="text-xs text-muted-foreground">
            Cole a URL gerada após "Implantar como aplicativo da Web".
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
          <Database className="h-4 w-4 text-primary" /> Como conectar sua planilha
        </div>
        <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
          <li>Sua planilha precisa ter as abas <strong className="text-foreground">CLIENTES</strong>, <strong className="text-foreground">PRODUTOS</strong> e <strong className="text-foreground">PEDIDOS</strong>.</li>
          <li>Abra <strong className="text-foreground">Extensões → Apps Script</strong> e cole o conteúdo do arquivo <code className="bg-muted px-1.5 py-0.5 rounded">apps-script.gs</code> (na raiz do projeto).</li>
          <li>Clique em <strong className="text-foreground">Implantar → Nova implantação → Aplicativo da Web</strong>.</li>
          <li>Em "Quem tem acesso" escolha <strong className="text-foreground">Qualquer pessoa</strong>.</li>
          <li>Copie a URL gerada e cole acima. Pronto! 🎉</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-4">
          Enquanto não conectar, o app usa dados de exemplo armazenados no seu navegador.
        </p>
      </Card>
    </div>
  );
}
