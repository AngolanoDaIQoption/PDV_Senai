import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'; // Suporte a transações e retorno das linhas do banco
import pool from '../config/db'; // Conexão compartilhada da aplicação
import { IItemVenda } from '../routes/types'; // Tipo do item vendido usado no histórico e na resposta da API

export interface IItemVendaInsert {
  venda_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export class ItemVendaModel {
  // Quando a venda está numa transação, usamos a conexão dela para gravar tudo junto.
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

  // O histórico mostra a descrição junto ao item, evitando que a tela precise fazer outra consulta.
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
