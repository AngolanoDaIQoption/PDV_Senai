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

export interface ItemVendaHistorico {
  id: number;
  venda_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_descricao?: string;
}

export interface VendaHistorico {
  id: number;
  cliente_id?: number | null;
  cliente_nome?: string | null;
  usuario_id: number;
  usuario_nome?: string;
  autorizado_por?: number | null;
  autorizado_por_nome?: string | null;
  cancelado_por?: number | null;
  cancelado_por_nome?: string | null;
  cancelado_em?: string | null;
  motivo_cancelamento?: string | null;
  valor_subtotal: number;
  percentual_desconto: number;
  valor_desconto: number;
  valor_total: number;
  forma_pagamento: FormaPagamento;
  status: "FINALIZADA" | "CANCELADA";
  data_venda?: string;
  itens: ItemVendaHistorico[];
}