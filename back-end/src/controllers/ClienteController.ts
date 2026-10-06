import { Request, Response } from 'express';
import { ClienteModel } from '../models/Cliente.model';
import { IClienteInput, IClienteUpdate } from '../types';

export class ClienteController {
  // RF05: Criar novo cliente
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, cpf, telefone, email } = req.body as IClienteInput;

      // Validação básica obrigatória
      if (!nome || !cpf) {
        return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
      }

      // Validação de formato (só números e exatamente 11 dígitos)
      const cpfLimpo = cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ error: 'O CPF deve ter 11 dígitos numéricos.' });
      }

      // RN01: Bloqueio de CPF duplicado
      const clienteExistente = await ClienteModel.findByCpf(cpfLimpo);
      if (clienteExistente) {
        return res.status(409).json({ error: 'Já existe um cliente cadastrado com este CPF.' });
      }

      // Inserção no banco
      const id = await ClienteModel.create({
        nome,
        cpf: cpfLimpo,
        telefone,
        email
      });

      return res.status(201).json({ message: 'Cliente criado com sucesso', id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao criar cliente.' });
    }
  }

  // RF05: Consultar todos os clientes
  static async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const clientes = await ClienteModel.findAll();
      return res.status(200).json(clientes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  }

  // RF05: Consultar cliente por ID
  static async findById(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      const cliente = await ClienteModel.findById(id);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      return res.status(200).json(cliente);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
  }

  // RF05: Editar cliente
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      const { nome, telefone, email } = req.body as IClienteUpdate;

      // Impede a atualização do CPF para manter integridade das vendas passadas
      if (req.body.cpf) {
         return res.status(400).json({ error: 'O CPF não pode ser alterado após o cadastro.' });
      }

      const atualizado = await ClienteModel.update(id, { nome, telefone, email });
      
      if (!atualizado) {
        return res.status(404).json({ error: 'Cliente não encontrado ou nenhuma alteração enviada.' });
      }

      return res.status(200).json({ message: 'Cliente atualizado com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
  }
}