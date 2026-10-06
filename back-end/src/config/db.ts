import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ms2_vestuario',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true // Retorna campos DECIMAL como number em vez de string
});

/**
 * Função utilitária para testar a conectividade com o banco de dados na inicialização
 */
export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com o banco de dados MySQL estabelecida com sucesso!');
    connection.release();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados MySQL:', error);
  }
}

export default pool;

