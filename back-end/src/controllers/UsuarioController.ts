import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/Usuario.model';
import { IUsuarioInput } from '../routes/types';

export class UsuarioController {
  // RF02: Cadastrar usuário com senha encriptada
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, email, senha, perfil } = req.body as IUsuarioInput;

      if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ error: 'Nome, email, senha e perfil são obrigatórios.' });
      }

      const usuarioExistente = await UsuarioModel.findByEmail(email);
      if (usuarioExistente) {
        return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
      }

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      const id = await UsuarioModel.create({
        nome,
        email,
        senha: senhaHash,
        perfil,
        ativo: true
      });

      return res.status(201).json({ message: 'Usuário criado com sucesso.', id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
  }

  // RF01: Autenticação (Login)
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const usuario = await UsuarioModel.findByEmail(email);

      if (!usuario || !usuario.ativo) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha!);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const { senha: _, ...dadosUsuario } = usuario;
      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil },
        process.env.JWT_SECRET || 'pdv_dev_secret',
        { expiresIn: '8h' }
      );

      return res.status(200).json({
        message: 'Login efetuado com sucesso.',
        token,
        usuario: dadosUsuario,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao efetuar login.' });
    }
  }

  // Listar todos os usuários (sem retornar senha)
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await UsuarioModel.findAll();
      return res.status(200).json(usuarios);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  }

  // Editar perfil e/ou status ativo de um usuário (apenas GERENTE)
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'ID inválido.' });

      const { perfil, ativo } = req.body as { perfil?: string; ativo?: boolean };
      if (perfil === undefined && ativo === undefined) {
        return res.status(400).json({ error: 'Informe ao menos um campo para atualizar (perfil ou ativo).' });
      }

      const usuarioAlvo = await UsuarioModel.buscarPorId(id);
      if (!usuarioAlvo) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (usuarioAlvo.perfil === 'GERENTE' && perfil !== undefined && perfil !== 'GERENTE') {
        return res.status(403).json({
          error: 'Operação bloqueada: Não é permitido despromover ou alterar o perfil de um Gerente.'
        });
      }

      const atualizado = await UsuarioModel.update(id, { perfil: perfil as any, ativo });
      if (!atualizado) {
        return res.status(400).json({ error: 'Nenhuma alteração foi realizada.' });
      }

      return res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
  }
}
