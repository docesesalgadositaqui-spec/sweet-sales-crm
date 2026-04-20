// API específica para a aba "i" (Compras / Insumos)
// Usa uma SEGUNDA URL de Apps Script (independente da principal),
// configurável em Configurações.

const STORAGE_KEY = "crm_compras_api_url";
const DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycby96xp6yX9aO1EVjeyXuGmAJiAUnI0HZ2tDn9711pMwT_mWDMDm-BpS6wTWB70ivhzh/exec";

export function getComprasApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setComprasApiUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url);
}

export interface CompraItem {
  linha: number;
  produto: string;
  preco: number;
}

const ABA = "i";

export async function listCompras(): Promise<CompraItem[]> {
  const url = `${getComprasApiUrl()}?aba=${ABA}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error("Erro ao carregar a aba i");
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .map((row: any, idx: number) => {
      const keys = Object.keys(row);
      const produtoKey = keys.find((k) => /produto/i.test(k)) || keys[0];
      const precoKey = keys.find((k) => /pre[çc]o/i.test(k)) || keys[1];
      const produto = String(row[produtoKey] ?? "").trim();
      const preco = Number(row[precoKey] ?? 0) || 0;
      return { linha: idx + 2, produto, preco };
    })
    .filter((r) => r.produto.length > 0);
}

async function postAction(body: any) {
  const res = await fetch(getComprasApiUrl(), {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erro ao salvar");
  return res.json();
}

export async function addCompra(produto: string, preco: number) {
  return postAction({
    aba: ABA,
    acao: "adicionar",
    dados: { campos: { Produtos: produto, Preços: preco } },
  });
}

export async function updateCompra(linha: number, produto: string, preco: number) {
  return postAction({
    aba: ABA,
    acao: "editar",
    dados: { linha, campos: { Produtos: produto, Preços: preco } },
  });
}

export async function deleteCompra(linha: number) {
  return postAction({
    aba: ABA,
    acao: "editar",
    dados: { linha, campos: { Produtos: "", Preços: "" } },
  });
}
