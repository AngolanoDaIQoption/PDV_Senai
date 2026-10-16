import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db';
import produtoRoutes from './routes/produto.routes';
import usuarioRoutes from './routes/usuario.routes';
import authRoutes from './routes/auth.routes';
import vendaRoutes from './routes/venda.routes';

import clienteRoutes from './routes/cliente.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Aqui a API recebe as configurações comuns antes de encaminhar cada pedido.
app.use(cors());
app.use(express.json());

// Um endereço simples para confirmar se o servidor está no ar.
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API do PDV a correr com sucesso!',
    timestamp: new Date().toISOString()
  });
});

// Cada grupo cuida de um assunto do sistema e fica organizado sob o seu próprio endereço.
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vendas', vendaRoutes);

// Depois de subir o servidor, também verificamos se o banco está acessível.
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor PDV iniciado na porta ${PORT}`);
  console.log(`📍 Endpoint Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
  
  // Teste de conexão com a base de dados
  await testConnection();
});

export default app;