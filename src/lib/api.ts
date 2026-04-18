// Cliente de API para o Google Apps Script.
// Usa fallback de mock quando os endpoints novos ainda não estão publicados.

const STORAGE_KEY = "crm_apps_script_url";
const DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbySxVeU3a8lyIv8c5ffReibMr4YpUPCiOQGox7ewAorYCqg_kfcyd60Sn8KEfFdwn8/exec";

export type SheetName = "CLIENTES" | "PRODUTOS" | "PEDIDOS";

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  instagram?: string;
  cidade?: string;
  aniversario?: string;
  ultima_compra?: string;
  valor_total?: number;
  observacoes?: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria?: string;
  sabor?: string;
  preco: number;
  custo?: number;
  estoque?: number;
  ativo?: boolean | string;
  foto?: string;
}

export interface PedidoItem {
  produto_id: string;
  nome: string;
  qtd: number;
  preco: number;
}

export type PedidoStatus =
  | "Orçamento"
  | "Aguardando pagamento"
  | "Em produção"
  | "Pronto"
  | "Entregue"
  | "Cancelado";

export interface Pedido {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  itens: PedidoItem[] | string;
  valor_total: number;
  pagamento?: string;
  data_pedido: string;
  data_entrega?: string;
  status: PedidoStatus;
  observacoes?: string;
}

export function getApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setApiUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url);
}

export function isUsingMock(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("crm_use_mock") === "1";
}

export function setUsingMock(v: boolean) {
  localStorage.setItem("crm_use_mock", v ? "1" : "0");
}

// ----------------- MOCK -----------------
const MOCK_KEY = "crm_mock_data_v1";

function seed() {
  const data = {
    CLIENTES: [
      { id: "c1", nome: "Marina Silva", telefone: "(11) 98888-1111", instagram: "@marina", cidade: "São Paulo", aniversario: "1992-03-15", ultima_compra: "2025-04-10", valor_total: 580, observacoes: "Adora brigadeiro gourmet" },
      { id: "c2", nome: "Júlia Costa", telefone: "(11) 97777-2222", instagram: "@juliac", cidade: "São Paulo", aniversario: "1988-07-22", ultima_compra: "2025-04-12", valor_total: 1240, observacoes: "" },
      { id: "c3", nome: "Beatriz Lima", telefone: "(21) 96666-3333", instagram: "@bia", cidade: "Rio de Janeiro", aniversario: "1995-11-02", ultima_compra: "2025-03-28", valor_total: 320, observacoes: "Sem lactose" },
      { id: "c4", nome: "Camila Rocha", telefone: "(11) 95555-4444", instagram: "@cami", cidade: "Campinas", aniversario: "1990-05-18", ultima_compra: "2025-04-15", valor_total: 890, observacoes: "" },
      { id: "c5", nome: "Larissa Mendes", telefone: "(11) 94444-5555", instagram: "@lari", cidade: "São Paulo", aniversario: "1993-09-30", ultima_compra: "2025-04-16", valor_total: 2150, observacoes: "Cliente VIP" },
    ],
    PRODUTOS: [
      { id: "p1", nome: "Brigadeiro Gourmet", categoria: "Doces", sabor: "Chocolate Belga", preco: 4.5, custo: 1.5, estoque: 120, ativo: true, foto: "" },
      { id: "p2", nome: "Beijinho", categoria: "Doces", sabor: "Coco", preco: 4, custo: 1.2, estoque: 80, ativo: true, foto: "" },
      { id: "p3", nome: "Cake Pop", categoria: "Bolos", sabor: "Red Velvet", preco: 8, custo: 3, estoque: 40, ativo: true, foto: "" },
      { id: "p4", nome: "Macaron", categoria: "Doces Finos", sabor: "Pistache", preco: 9, custo: 3.5, estoque: 60, ativo: true, foto: "" },
      { id: "p5", nome: "Trufa", categoria: "Doces", sabor: "Maracujá", preco: 5.5, custo: 2, estoque: 90, ativo: true, foto: "" },
      { id: "p6", nome: "Bolo no Pote", categoria: "Bolos", sabor: "Ninho com Nutella", preco: 18, custo: 6, estoque: 25, ativo: true, foto: "" },
    ],
    PEDIDOS: [
      { id: "o1", cliente_id: "c1", cliente_nome: "Marina Silva", itens: [{ produto_id: "p1", nome: "Brigadeiro Gourmet", qtd: 50, preco: 4.5 }], valor_total: 225, pagamento: "PIX", data_pedido: "2025-04-10", data_entrega: "2025-04-18", status: "Em produção" as PedidoStatus, observacoes: "Caixa branca" },
      { id: "o2", cliente_id: "c2", cliente_nome: "Júlia Costa", itens: [{ produto_id: "p4", nome: "Macaron", qtd: 30, preco: 9 }, { produto_id: "p3", nome: "Cake Pop", qtd: 12, preco: 8 }], valor_total: 366, pagamento: "Cartão", data_pedido: "2025-04-12", data_entrega: "2025-04-19", status: "Aguardando pagamento" as PedidoStatus, observacoes: "" },
      { id: "o3", cliente_id: "c5", cliente_nome: "Larissa Mendes", itens: [{ produto_id: "p6", nome: "Bolo no Pote", qtd: 20, preco: 18 }], valor_total: 360, pagamento: "PIX", data_pedido: "2025-04-15", data_entrega: "2025-04-20", status: "Pronto" as PedidoStatus, observacoes: "" },
      { id: "o4", cliente_id: "c4", cliente_nome: "Camila Rocha", itens: [{ produto_id: "p2", nome: "Beijinho", qtd: 100, preco: 4 }], valor_total: 400, pagamento: "PIX", data_pedido: "2025-04-08", data_entrega: "2025-04-14", status: "Entregue" as PedidoStatus, observacoes: "" },
      { id: "o5", cliente_id: "c3", cliente_nome: "Beatriz Lima", itens: [{ produto_id: "p5", nome: "Trufa", qtd: 40, preco: 5.5 }], valor_total: 220, pagamento: "Dinheiro", data_pedido: "2025-04-16", data_entrega: "2025-04-22", status: "Orçamento" as PedidoStatus, observacoes: "" },
      { id: "o6", cliente_id: "c1", cliente_nome: "Marina Silva", itens: [{ produto_id: "p1", nome: "Brigadeiro Gourmet", qtd: 80, preco: 4.5 }], valor_total: 360, pagamento: "PIX", data_pedido: "2025-03-28", data_entrega: "2025-04-02", status: "Entregue" as PedidoStatus, observacoes: "" },
    ],
  };
  localStorage.setItem(MOCK_KEY, JSON.stringify(data));
  return data;
}

function getMock(): Record<SheetName, any[]> {
  if (typeof window === "undefined") return { CLIENTES: [], PRODUTOS: [], PEDIDOS: [] };
  const raw = localStorage.getItem(MOCK_KEY);
  if (!raw) return seed();
  try { return JSON.parse(raw); } catch { return seed(); }
}

function saveMock(data: Record<SheetName, any[]>) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(data));
}

function uuid() { return "id_" + Math.random().toString(36).slice(2, 11); }

// ----------------- API -----------------
async function callApi(method: "GET" | "POST", sheet: SheetName, body?: any): Promise<any> {
  const url = method === "GET" ? `${getApiUrl()}?sheet=${sheet}` : getApiUrl();
  const res = await fetch(url, {
    method,
    redirect: "follow",
    headers: method === "POST" ? { "Content-Type": "text/plain;charset=utf-8" } : undefined,
    body: method === "POST" ? JSON.stringify({ sheet, ...body }) : undefined,
  });
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

export async function listAll<T = any>(sheet: SheetName): Promise<T[]> {
  if (isUsingMock()) return getMock()[sheet] as T[];
  try {
    const data = await callApi("GET", sheet);
    if (Array.isArray(data)) return data as T[];
    // resposta de erro -> cai pro mock
    return getMock()[sheet] as T[];
  } catch {
    return getMock()[sheet] as T[];
  }
}

export async function createRow<T extends { id?: string }>(sheet: SheetName, data: T): Promise<T> {
  const withId = { ...data, id: data.id || uuid() } as T;
  if (isUsingMock()) {
    const all = getMock();
    all[sheet] = [...all[sheet], withId];
    saveMock(all);
    return withId;
  }
  try {
    await callApi("POST", sheet, { action: "create", data: withId });
  } catch { /* ignore — mantemos local */ }
  // sempre espelha local também
  const all = getMock();
  all[sheet] = [...all[sheet], withId];
  saveMock(all);
  return withId;
}

export async function updateRow<T extends { id: string }>(sheet: SheetName, data: T): Promise<T> {
  if (!isUsingMock()) {
    try { await callApi("POST", sheet, { action: "update", id: data.id, data }); } catch {}
  }
  const all = getMock();
  all[sheet] = all[sheet].map((r: any) => r.id === data.id ? { ...r, ...data } : r);
  saveMock(all);
  return data;
}

export async function deleteRow(sheet: SheetName, id: string): Promise<void> {
  if (!isUsingMock()) {
    try { await callApi("POST", sheet, { action: "delete", id }); } catch {}
  }
  const all = getMock();
  all[sheet] = all[sheet].filter((r: any) => r.id !== id);
  saveMock(all);
}

export function resetMock() {
  localStorage.removeItem(MOCK_KEY);
  seed();
}
