export type Perfil = "CAIXA" | "GERENTE";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  preco: number;
  estoque: number;
  ativo?: boolean;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export type FormaPagamento = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO";