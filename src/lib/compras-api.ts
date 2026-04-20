// API específica para a aba "i" (Compras / Insumos)
// Usa o formato do Apps Script novo: { acao, aba, dados: { linha, campos } }
// e GET ?aba=i para listar.

import { getApiUrl } from "./api";

export interface CompraItem {
  linha: number; // número da linha na planilha (>= 2)
  produto: string;
  preco: number;
}

const ABA = "i";

// Lê a aba "i" e retorna apenas linhas com produto preenchido nas colunas A/B.
export async function listCompras(): Promise<CompraItem[]> {
  const url = `${getApiUrl()}?aba=${ABA}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error("Erro ao carregar a aba i");
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  // Detecta cabeçalho (primeira linha tem rótulos tipo "Produtos" / "Preços").
  // O Apps Script já devolve objetos com chaves dos cabeçalhos reais.
  // Como a aba "i" tem múltiplos blocos, procuramos as chaves do bloco principal.
  return data
    .map((row: any, idx: number) => {
      const keys = Object.keys(row);
      // tenta achar coluna "produto" e "preço"
      const produtoKey =
        keys.find((k) => /produto/i.test(k)) || keys[0];
      const precoKey =
        keys.find((k) => /pre[çc]o/i.test(k)) || keys[1];
      const produto = String(row[produtoKey] ?? "").trim();
      const preco = Number(row[precoKey] ?? 0) || 0;
      return { linha: idx + 2, produto, preco };
    })
    .filter((r) => r.produto.length > 0);
}

async function postAction(body: any) {
  const res = await fetch(getApiUrl(), {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erro ao salvar");
  return res.json();
}

export async function addCompra(produto: string, preco: number) {
  // tenta ambos os formatos de payload (compatibilidade com os dois Apps Scripts)
  return postAction({
    aba: ABA,
    sheet: ABA,
    acao: "adicionar",
    action: "create",
    dados: { campos: { Produtos: produto, Preços: preco } },
    data: { Produtos: produto, Preços: preco },
  });
}

export async function updateCompra(linha: number, produto: string, preco: number) {
  return postAction({
    aba: ABA,
    sheet: ABA,
    acao: "editar",
    action: "update",
    dados: { linha, campos: { Produtos: produto, Preços: preco } },
    id: linha,
    data: { Produtos: produto, Preços: preco },
  });
}

export async function deleteCompra(linha: number) {
  // Apps Script novo não tem "excluir" — limpamos os campos da linha
  return postAction({
    aba: ABA,
    sheet: ABA,
    acao: "editar",
    action: "delete",
    dados: { linha, campos: { Produtos: "", Preços: "" } },
    id: linha,
  });
}
