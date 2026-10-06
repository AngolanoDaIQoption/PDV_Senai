import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UsuarioModel } from '../models/Usuario.model';
import { IUsuarioInput } from '../routes/types';

export class UsuarioController {
  // RF02: Cadastrar utilizador com palavra-passe encriptada
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, email, senha, perfil } = req.body as IUsuarioInput;

      if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ error: 'Nome, email, senha e perfil são obrigatórios.' });
      }

      // Valida se o email já existe
      const usuarioExistente = await UsuarioModel.findByEmail(email);
      if (usuarioExistente) {
        return res.status(409).json({ error: 'Já existe um utilizador com este email.' });
      }

      // Encripta a palavra-passe com bcrypt (RNF03)
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      const id = await UsuarioModel.create({
        nome,
        email,
        senha: senhaHash,
        perfil,
        ativo: true
      });

      return res.status(201).json({ message: 'Utilizador criado com sucesso', id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar utilizador.' });
    }
  }

  // RF01: Autenticação (Login)
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      const usuario = await UsuarioModel.findByEmail(email);
      
      // Verifica se o utilizador existe e se está ativo (RN12)
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }
      if (!usuario.ativo) {
        return res.status(403).json({ error: 'Utilizador inativo. Acesso negado.' });
      }

      // Compara a palavra-passe inserida com o hash do banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha!);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Remove a senha do objeto antes de devolver ao frontend
      const { senha: _, ...dadosUsuario } = usuario;

      return res.status(200).json({ 
        message: 'Login efetuado com sucesso.', 
        usuario: dadosUsuario 
        // Nota: Numa aplicação real completa adicionaríamos aqui a geração do Token JWT
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao efetuar login.' });
    }
  }

  // Listar todos os utilizadores (para o painel do Gerente)
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await UsuarioModel.findAll();
      return res.status(200).json(usuarios);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar utilizadores.' });
    }
  }
}