import mysql from 'mysql2/promise'; // Driver MySQL assíncrono para consultas em Node.js
import dotenv from 'dotenv'; // Carrega variáveis de ambiente do arquivo .env

dotenv.config();

// A pool reaproveita conexões com o MySQL, em vez de abrir uma nova a cada consulta.
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

// Usamos este teste na inicialização para perceber logo se a conexão com o banco falhou.
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
