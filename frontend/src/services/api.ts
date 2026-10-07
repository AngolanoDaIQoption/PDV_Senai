import type { Cliente, Produto, Usuario, VendaHistorico } from "../types";

const API_URL = "http://localhost:3000/api";

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/login";
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error((erro as { error?: string }).error ?? "Erro na requisição.");
  }

  return response.json() as Promise<T>;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

interface ProdutoApi {
  id: number;
  codigo_barras?: string;
  codigo?: string;
  descricao: string;
  preco?: number;
  estoque?: number;
  ativo?: boolean | number;
}

interface ClienteApi {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
}

function normalizarProduto(item: ProdutoApi): Produto {
  return {
    id: item.id,
    codigo: String(item.codigo_barras ?? item.codigo ?? ""),
    descricao: item.descricao,
    preco: Number(item.preco ?? 0),
    estoque: Number(item.estoque ?? 0),
    ativo: item.ativo === undefined ? true : Boolean(item.ativo),
  };
}

function normalizarCliente(item: ClienteApi): Cliente {
  return {
    id: item.id,
    nome: item.nome,
    cpf: String(item.cpf ?? ""),
    telefone: String(item.telefone ?? ""),
    email: String(item.email ?? ""),
  };
}

export async function buscarProdutos(todos = false): Promise<Produto[]> {
  const caminho = todos ? "/produtos?todos=true" : "/produtos";
  const dados = await apiFetch<ProdutoApi[]>(caminho);
  return Array.isArray(dados) ? dados.map(normalizarProduto) : [];
}

export async function criarProduto(produto: {
  codigo_barras: string;
  descricao: string;
  preco: number;
  estoque: number;
}): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>("/produtos", {
    method: "POST",
    body: JSON.stringify(produto),
  });
}

export async function atualizarProduto(
  id: number,
  produto: {
    codigo_barras?: string;
    descricao?: string;
    preco?: number;
    estoque?: number;
    ativo?: boolean;
  }
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/produtos/${id}`, {
    method: "PUT",
    body: JSON.stringify(produto),
  });
}

export async function inativarProduto(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/produtos/${id}/inativar`, {
    method: "PATCH",
  });
}

export async function reativarProduto(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/produtos/${id}/ativar`, {
    method: "PATCH",
  });
}

export const ativarProduto = reativarProduto;

export async function buscarClientes(): Promise<Cliente[]> {
  const dados = await apiFetch<ClienteApi[]>("/clientes");
  return Array.isArray(dados) ? dados.map(normalizarCliente) : [];
}

export async function criarCliente(cliente: {
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
}): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>("/clientes", {
    method: "POST",
    body: JSON.stringify(cliente),
  });
}

export async function atualizarCliente(
  id: number,
  cliente: { nome: string; telefone?: string; email?: string }
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(cliente),
  });
}

export async function buscarVendas(filtros?: {
  data?: string;
  cliente?: string;
  operador?: string;
}): Promise<VendaHistorico[]> {
  const params = new URLSearchParams();
  if (filtros?.data) params.set("data", filtros.data);
  if (filtros?.cliente) params.set("cliente", filtros.cliente);
  if (filtros?.operador) params.set("operador", filtros.operador);

  const query = params.toString() ? `?${params.toString()}` : "";
  const dados = await apiFetch<VendaHistorico[]>(`/vendas${query}`);
  return Array.isArray(dados) ? dados : [];
}