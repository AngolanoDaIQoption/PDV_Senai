import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';

export interface IVenda {
  id?: number;
  cliente_id?: number | null;
  usuario_id: number;
  autorizado_por?: number | null;
  valor_subtotal: number;
  percentual_desconto?: number;
  valor_desconto?: number;
  valor_total: number;
  forma_pagamento: 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';
  status?: 'FINALIZADA' | 'CANCELADA';
  motivo_cancelamento?: string | null;
  cancelado_por?: number | null;
  cancelado_em?: Date | string | null;
  data_venda?: Date | string;
}

export class VendaModel {
  static async findAll(): Promise<IVenda[]> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM vendas ORDER BY id DESC');
    return rows as IVenda[];
  }

  static async findById(id: number): Promise<IVenda | null> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM vendas WHERE id = ?', [id]);
    return (rows[0] as IVenda) || null;
  }

  static async findByCliente(clienteId: number): Promise<IVenda[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM vendas WHERE cliente_id = ? ORDER BY id DESC',
      [clienteId]
    );
    return rows as IVenda[];
  }

  static async create(venda: IVenda): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO vendas (
        cliente_id, usuario_id, autorizado_por, valor_subtotal, 
        percentual_desconto, valor_desconto, valor_total, forma_pagamento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        venda.cliente_id || null,
        venda.usuario_id,
        venda.autorizado_por || null,
        venda.valor_subtotal,
        venda.percentual_desconto || 0,
        venda.valor_desconto || 0,
        venda.valor_total,
        venda.forma_pagamento
      ]
    );
    return result.insertId;
  }
}