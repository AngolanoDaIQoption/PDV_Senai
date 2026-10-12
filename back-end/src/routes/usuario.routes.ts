import { Router } from 'express';
import bcrypt from 'bcrypt';
import { UsuarioController } from '../controllers/UsuarioController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';
import pool from '../config/db';

const usuarioRoutes = Router();

// Endpoint de Seed (Público para setup inicial)
usuarioRoutes.post('/seed', async (req, res): Promise<any> => {
  try {
    // 1. Verifica se já existem utilizadores registados
    const [linhas]: any = await pool.execute('SELECT id FROM usuarios');
    if (linhas.length > 0) {
      return res.status(400).json({ message: 'O banco de dados já possui usuários cadastrados!' });
    }

    // 2. Criptografa a senha do Gerente Master
    const senhaHash = await bcrypt.hash('123', 10);

    // 3. Insere o primeiro Gerente
    await pool.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, ?)',
      ['Matheus Master', 'matheus@ms2.com', senhaHash, 'GERENTE', true]
    );

    return res.status(201).json({ 
      message: '✅ Usuário Gerente criado com sucesso! Email: matheus@ms2.com | Senha: 123' 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao executar o seeding no banco de dados.' });
  }
});

// Endpoint de login (público)
usuarioRoutes.post('/login', UsuarioController.login);

// Endpoints de gestão (apenas GERENTE)
usuarioRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.listar);
usuarioRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.create);
usuarioRoutes.put('/:id', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.update);

export default usuarioRoutes;