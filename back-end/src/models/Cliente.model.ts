import { ResultSetHeader, RowDataPacket } from 'mysql2/promise'; // Tipos de retorno MySQL usados em INSERT/SELECT
import pool from '../config/db'; // Pool de conexão com o banco
import { ICliente, IClienteInput, IClienteUpdate } from '../routes/types'; // Tipos do cliente e dos dados de entrada/atualização

const COLS = 'id, nome, cpf, telefone, email, criado_em';
const CAMPOS = ['nome', 'cpf', 'telefone', 'email'];

// Este modelo concentra as consultas de clientes; os controladores cuidam das regras e respostas HTTP.
export class ClienteModel {
  static async create(d: IClienteInput): Promise<number> {
    const [r] = await pool.execute<ResultSetHeader>(
      'INSERT INTO clientes (nome, cpf, telefone, email) VALUES (?, ?, ?, ?)',
      [d.nome, d.cpf, d.telefone ?? null, d.email ?? null]);
    return r.insertId;
  }
  static async findById(id: number): Promise<ICliente | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS} FROM clientes WHERE id = ?`, [id]);
    return (rows[0] as ICliente) ?? null;
  }
  static async findByCpf(cpf: string): Promise<ICliente | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS} FROM clientes WHERE cpf = ?`, [cpf]);
    return (rows[0] as ICliente) ?? null;
  }
  static async findAll(): Promise<ICliente[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS} FROM clientes ORDER BY nome`);
    return rows as ICliente[];
  }
  static async update(id: number, d: IClienteUpdate): Promise<boolean> {
    // Atualizamos só os campos recebidos e permitidos, sem montar valores direto na consulta.
    const campos = CAMPOS.filter(c => (d as any)[c] !== undefined);
    if (!campos.length) return false;
    const [r] = await pool.execute<ResultSetHeader>(
      `UPDATE clientes SET ${campos.map(c => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...campos.map(c => (d as any)[c]), id]);
    return r.affectedRows > 0;
  }
}