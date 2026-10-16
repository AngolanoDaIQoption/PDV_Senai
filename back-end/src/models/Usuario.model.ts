import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';
import { IUsuario, IUsuarioInput, IUsuarioUpdate } from '../routes/types';

const COLS = 'id, nome, email, perfil, ativo, criado_em';
const CAMPOS = ['nome', 'email', 'senha', 'perfil', 'ativo'];

// Este modelo centraliza as consultas de usuários e controla quais retornam o hash da senha.
export class UsuarioModel {
  static async create(d: IUsuarioInput): Promise<number> {
    const [r] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, ?)',
      [d.nome, d.email, d.senha, d.perfil, d.ativo ?? true]);
    return r.insertId;
  }
  static async findById(id: number): Promise<IUsuario | null> {
    // Nas consultas comuns, a senha nem entra no resultado.
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS} FROM usuarios WHERE id = ?`, [id]);
    return (rows[0] as IUsuario) ?? null;
  }

  static async buscarPorId(id: number): Promise<IUsuario | null> {
    // Esta versão é usada onde o controlador precisa dos dados completos do usuário.
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS}, senha FROM usuarios WHERE id = ?`, [id]);
    return (rows[0] as IUsuario) ?? null;
  }

  // Só o fluxo de autenticação precisa buscar o hash para comparar a senha digitada.
  static async findByEmail(email: string): Promise<IUsuario | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT ${COLS}, senha FROM usuarios WHERE email = ?`, [email]);
    return (rows[0] as IUsuario) ?? null;
  }
  static async findAll(apenasAtivos = false): Promise<IUsuario[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${COLS} FROM usuarios ${apenasAtivos ? 'WHERE ativo = TRUE' : ''} ORDER BY nome`);
    return rows as IUsuario[];
  }
  static async update(id: number, d: IUsuarioUpdate): Promise<boolean> {
    // A lista de campos evita atualizar propriedades que não fazem parte desta operação.
    const campos = CAMPOS.filter(c => (d as any)[c] !== undefined);
    if (!campos.length) return false;
    const [r] = await pool.execute<ResultSetHeader>(
      `UPDATE usuarios SET ${campos.map(c => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...campos.map(c => (d as any)[c]), id]);
    return r.affectedRows > 0;
  }
  static async inativar(id: number): Promise<boolean> {
    const [r] = await pool.execute<ResultSetHeader>('UPDATE usuarios SET ativo = FALSE WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
}