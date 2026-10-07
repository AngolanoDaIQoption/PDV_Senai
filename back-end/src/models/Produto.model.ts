import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';
import { IProduto, IProdutoInput, IProdutoUpdate } from '../routes/types';

const COLS = 'id, codigo_barras, descricao, preco, estoque, ativo, criado_em';
const CAMPOS = ['codigo_barras', 'descricao', 'preco', 'estoque', 'ativo'];

export class ProdutoModel {
  static async create(d: IProdutoInput): Promise<number> {
    const [r] = await pool.execute<ResultSetHeader>(
      'INSERT INTO produtos (codigo_barras, descricao, preco, estoque, ativo) VALUES (?, ?, ?, ?, ?)',
      [d.codigo_barras, d.descricao, d.preco, d.estoque, d.ativo ?? true]);
    return r.insertId;
  }
  static async findById(id: number, connection?: PoolConnection): Promise<IProduto | null> {
    const [rows] = await (connection || pool).execute<RowDataPacket[]>(`SELECT ${COLS} FROM produtos WHERE id = ?`, [id]);
    return (rows[0] as IProduto) ?? null;
  }
  static async findByCodigoBarras(codigo: string): Promise<IProduto | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS} FROM produtos WHERE codigo_barras = ?`, [codigo]);
    return (rows[0] as IProduto) ?? null;
  }
  // RF04: busca por nome/descrição ou código (só produtos ativos)
  static async buscar(termo: string): Promise<IProduto[]> {
    const like = `%${termo}%`;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${COLS} FROM produtos WHERE ativo = TRUE AND (descricao LIKE ? OR codigo_barras LIKE ?) ORDER BY descricao LIMIT 50`,
      [like, like]);
    return rows as IProduto[];
  }
  static async findAll(apenasAtivos = false): Promise<IProduto[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${COLS} FROM produtos ${apenasAtivos ? 'WHERE ativo = TRUE' : ''} ORDER BY descricao`);
    return rows as IProduto[];
  }
  static async update(id: number, d: IProdutoUpdate): Promise<boolean> {
    const campos = CAMPOS.filter(c => (d as any)[c] !== undefined);
    if (!campos.length) return false;
    const [r] = await pool.execute<ResultSetHeader>(
      `UPDATE produtos SET ${campos.map(c => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...campos.map(c => (d as any)[c]), id]);
    return r.affectedRows > 0;
  }
  // delta positivo = entrada, negativo = saída; não deixa o estoque ficar negativo
  static async updateEstoque(id: number, delta: number, connection?: PoolConnection): Promise<boolean> {
    const [r] = await (connection || pool).execute<ResultSetHeader>(
      'UPDATE produtos SET estoque = estoque + ? WHERE id = ? AND (estoque + ?) >= 0', [delta, id, delta]);
    return r.affectedRows > 0;
  }
  static async inativar(id: number): Promise<boolean> {
    const [r] = await pool.execute<ResultSetHeader>('UPDATE produtos SET ativo = FALSE WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
  static async ativar(id: number): Promise<boolean> {
    const [r] = await pool.execute<ResultSetHeader>('UPDATE produtos SET ativo = TRUE WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
}