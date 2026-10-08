export type Perfil = 'CAIXA' | 'SUPERVISOR' | 'GERENTE';
export interface IUsuario { id: number; nome: string; email: string; senha?: string; perfil: Perfil; ativo: boolean; criado_em?: Date }
export type IUsuarioInput = { nome: string; email: string; senha: string; perfil: Perfil; ativo?: boolean };
export type IUsuarioUpdate = Partial<IUsuarioInput>;

export interface ICliente { id: number; nome: string; cpf: string; telefone?: string | null; email?: string | null; criado_em?: Date }
export type IClienteInput = Omit<ICliente, 'id' | 'criado_em'>;
export type IClienteUpdate = Partial<IClienteInput>;

export interface IProduto { id: number; codigo_barras: string; descricao: string; preco: number; estoque: number; ativo: boolean; criado_em?: Date }
export type IProdutoInput = { codigo_barras: string; descricao: string; preco: number; estoque: number; ativo?: boolean };
export type IProdutoUpdate = Partial<IProdutoInput>;

export interface IItemVenda { id: number; venda_id: number; produto_id: number; quantidade: number; preco_unitario: number; subtotal: number; produto_descricao?: string }
export interface IItemVendaInput { produto_id: number; quantidade: number }

export type FormaPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';
export type StatusVenda = 'FINALIZADA' | 'CANCELADA';
export interface IVenda {
  id: number; cliente_id?: number | null; usuario_id: number; autorizado_por?: number | null;
  valor_subtotal: number; percentual_desconto: number; valor_desconto: number; valor_total: number;
  forma_pagamento: FormaPagamento; status: StatusVenda;
  motivo_cancelamento?: string | null; cancelado_por?: number | null; cancelado_em?: Date | null; data_venda?: Date;
}
export interface IVendaInput {
  cliente_id?: number | null; usuario_id: number; autorizado_por?: number | null;
  percentual_desconto?: number; forma_pagamento: FormaPagamento; itens: IItemVendaInput[];
}
export interface IVendaCompleta extends IVenda { cliente_nome?: string | null; usuario_nome?: string; itens: IItemVenda[] }