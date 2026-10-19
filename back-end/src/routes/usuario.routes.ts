import { Router } from 'express'; // Cria o grupo de rotas de usuário e seed inicial
import bcrypt from 'bcrypt'; // Criptografa as senhas para evitar armazenar texto puro
import { UsuarioController } from '../controllers/UsuarioController'; // Implementa as regras de autenticação e gestão de usuários
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware'; // Regras de login e permissões por perfil
import pool from '../config/db'; // Consulta direta do banco para criação do primeiro gerente

const usuarioRoutes = Router();

// No primeiro uso, este endpoint cria um gerente somente se ainda não houver usuários.
usuarioRoutes.post('/seed', async (req, res): Promise<any> => {
  try {
    // Assim evitamos que a rota de configuração inicial crie outros gerentes depois.
    const [linhas]: any = await pool.execute('SELECT id FROM usuarios');
    if (linhas.length > 0) {
      return res.status(400).json({ message: 'O banco de dados já possui usuários cadastrados!' });
    }

    // A tela pode fornecer os dados; os valores padrão ajudam na configuração local.
    const email = req.body.email?.trim() || 'gerente@ms2.com';
    const senhaLimpa = req.body.senha || '123456';
    const nome = req.body.nome || 'Gerente Principal';

    // Mesmo no cadastro inicial, a senha não é salva em texto aberto.
    const senhaHash = await bcrypt.hash(senhaLimpa, 10);

    // A primeira conta recebe o perfil com maior permissão para configurar o sistema.
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

// O login é público porque acontece antes de existir uma sessão autenticada.
usuarioRoutes.post('/login', UsuarioController.login);

// Depois do login, só o gerente administra as contas da equipe.
usuarioRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.listar);
usuarioRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.create);
usuarioRoutes.put('/:id', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.update);

export default usuarioRoutes;