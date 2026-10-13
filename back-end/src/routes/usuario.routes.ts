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

    // 2. Extrai os dados digitados pelo usuário (ou usa valores padrão caso estejam vazios)
    const email = req.body.email?.trim() || 'gerente@ms2.com';
    const senhaLimpa = req.body.senha || '123456';
    const nome = req.body.nome || 'Gerente Principal';

    // 3. Criptografa a senha escolhida pelo usuário
    const senhaHash = await bcrypt.hash(senhaLimpa, 10);

    // 4. Insere o Gerente com os dados fornecidos
    await pool.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, ?)',
      [nome, email, senhaHash, 'GERENTE', true]
    );

    return res.status(201).json({ 
      message: `✅ Usuário Gerente (${email}) criado com sucesso!` 
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