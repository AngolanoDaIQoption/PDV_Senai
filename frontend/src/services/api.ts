import type { Cliente, FormaPagamento, Perfil, Produto, Usuario, VendaHistorico } from "../types"; // Tipos compartilhados com a UI para manter as chamadas consistentes

const API_URL = "http://localhost:3000/api"; // Base de todas as rotas do backend da aplicação

// O logout é compartilhado pelo tratamento de sessão e remove os dados do navegador.
// Isso impede que o usuário continue acessando a aplicação com uma sessão inválida.
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/login";
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  logoutOnUnauthorized = true,
): Promise<T> {
  // Centralizamos aqui o token, os cabeçalhos e as mensagens de erro da comunicação com a API.
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
    if (logoutOnUnauthorized) {
      logout();
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const erro = await response.json().catch(() => ({}));
    throw new ApiError(
      (erro as { error?: string }).error ?? "Credenciais inválidas.",
      response.status,
    );
  }

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    const detalhes = erro as { error?: string; code?: string };
    throw new ApiError(
      detalhes.error ?? "Erro na requisição.",
      response.status,
      detalhes.code,
    );
  }

  return response.json() as Promise<T>;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");

  const resposta = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  }, false);

  return {
    ...resposta,
    usuario: normalizarUsuario(resposta.usuario),
  };
}

export interface CriarVendaInput {
  cliente_id?: number | null;
  valor_desconto: number;
  forma_pagamento: FormaPagamento;
  itens: Array<{ produto_id: number; quantidade: number }>;
}

export interface CriarVendaResponse {
  message: string;
  venda_id: number;
  valor_total: number;
}

export async function criarVenda(
  venda: CriarVendaInput,
  tokenGerente?: string,
): Promise<CriarVendaResponse> {
  const headers = new Headers();
  if (tokenGerente) {
    headers.set("X-Gerente-Authorization", `Bearer ${tokenGerente}`);
  }

  return apiFetch<CriarVendaResponse>("/vendas", {
    method: "POST",
    headers,
    body: JSON.stringify(venda),
  });
}

interface UsuarioApi {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean | number;
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
  // A API e a interface usam alguns nomes diferentes; adaptamos o formato numa única passagem.
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

function normalizarUsuario(item: UsuarioApi): Usuario {
  return {
    id: item.id,
    nome: item.nome,
    email: item.email,
    perfil: item.perfil,
    ativo: item.ativo === undefined ? true : Boolean(item.ativo),
  };
}

export async function buscarProdutos(todos = false): Promise<Produto[]> {
  // A opção "todos" também inclui os inativos, necessários na tela de gestão do catálogo.
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

export async function buscarUsuarios(): Promise<Usuario[]> {
  const dados = await apiFetch<UsuarioApi[]>("/usuarios");
  return Array.isArray(dados) ? dados.map(normalizarUsuario) : [];
}
export async function criarUsuario(dados: {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export async function atualizarUsuario(
  id: number,
  dados: Partial<{ perfil: Perfil; ativo: boolean }>
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
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

export async function cancelarVenda(id: number, motivo: string): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>(`/vendas/${id}/cancelar`, {
    method: "PATCH",
    body: JSON.stringify({ motivo }),
  });
}
