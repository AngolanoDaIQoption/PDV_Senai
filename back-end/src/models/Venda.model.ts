import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';
import { ItemVendaModel } from './ItemVenda.model';
import { IVendaCompleta } from '../routes/types';

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

  static async listarComFiltros(filtros: { data?: string; cliente?: string; operador?: string }): Promise<IVendaCompleta[]> {
    let sql = `
      SELECT 
        v.id, v.cliente_id, v.usuario_id, v.autorizado_por,
        v.valor_subtotal, v.percentual_desconto, v.valor_desconto, v.valor_total,
        v.forma_pagamento, v.status, v.motivo_cancelamento, v.cancelado_por,
        v.cancelado_em, v.data_venda,
        c.nome AS cliente_nome,
        u.nome AS usuario_nome,
        ga.nome AS autorizado_por_nome,
        gc.nome AS cancelado_por_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      JOIN usuarios u ON u.id = v.usuario_id
      LEFT JOIN usuarios ga ON ga.id = v.autorizado_por
      LEFT JOIN usuarios gc ON gc.id = v.cancelado_por
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filtros.data) {
      sql += ' AND DATE(v.data_venda) = ?';
      params.push(filtros.data);
    }
    if (filtros.cliente) {
      sql += ' AND (c.nome LIKE ? OR v.cliente_id = ?)';
      params.push(`%${filtros.cliente}%`, Number(filtros.cliente) || 0);
    }
    if (filtros.operador) {
      sql += ' AND (u.nome LIKE ? OR v.usuario_id = ?)';
      params.push(`%${filtros.operador}%`, Number(filtros.operador) || 0);
    }

    sql += ' ORDER BY v.id DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    const vendas = rows as (IVenda & {
      cliente_nome?: string;
      usuario_nome?: string;
      autorizado_por_nome?: string;
      cancelado_por_nome?: string;
    })[];

    const resultado = await Promise.all(
      vendas.map(async (venda) => {
        const itens = venda.id ? await ItemVendaModel.findByVendaId(venda.id) : [];
        return {
          ...venda,
          itens,
        } as unknown as IVendaCompleta;
      })
    );

    return resultado;
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