import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';
import { IItemVenda } from '../routes/types';

export interface IItemVendaInsert {
  venda_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export class ItemVendaModel {
  /**
   * Insere um item associado a uma venda
   * Suporta transação passando conexão
   */
  static async create(
    item: IItemVendaInsert,
    connection?: PoolConnection,
  ): Promise<number> {
    const sql = `
      INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      item.venda_id,
      item.produto_id,
      item.quantidade,
      item.preco_unitario,
      item.subtotal,
    ];

    const executor = connection || pool;
    const [result] = await executor.execute<ResultSetHeader>(sql, params);
    return result.insertId;
  }

  /**
   * Busca todos os itens de uma venda específica, trazendo também o nome do produto
   */
  static async findByVendaId(
    vendaId: number,
    connection?: PoolConnection,
  ): Promise<IItemVenda[]> {
    const sql = `
      SELECT iv.id, iv.venda_id, iv.produto_id, p.descricao AS produto_descricao,
       iv.quantidade, iv.preco_unitario, iv.subtotal
      FROM itens_venda iv
      INNER JOIN produtos p ON p.id = iv.produto_id
      WHERE iv.venda_id = ?
      ORDER BY iv.id ASC
    `;
    const executor = connection || pool;
    const [rows] = await executor.execute<RowDataPacket[]>(sql, [vendaId]);
    return rows as IItemVenda[];
  }
}
