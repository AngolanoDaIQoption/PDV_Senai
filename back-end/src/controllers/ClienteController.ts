import { Request, Response } from 'express';
import { ClienteModel } from '../models/Cliente.model';
import { IClienteInput, IClienteUpdate } from '../routes/types';

export class ClienteController {
  // Limpamos a formatação do CPF antes de conferir duplicidade e salvar.
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, cpf, telefone, email } = req.body as IClienteInput;

      // Sem nome e CPF não há como identificar o cadastro.
      if (!nome || !cpf) {
        return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
      }

      // O banco guarda só os 11 números; pontos e traço são apenas apresentação.
      const cpfLimpo = cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ error: 'O CPF deve ter 11 dígitos numéricos.' });
      }

      // O CPF também funciona como identificador único para evitar cadastros repetidos.
      const clienteExistente = await ClienteModel.findByCpf(cpfLimpo);
      if (clienteExistente) {
        return res.status(409).json({ error: 'Já existe um cliente cadastrado com este CPF.' });
      }

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

  // Estas ações de consulta e edição ligam as rotas aos métodos do modelo.
  static async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const clientes = await ClienteModel.findAll();
      return res.status(200).json(clientes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  }

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

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      const { nome, telefone, email } = req.body as IClienteUpdate;

      // O CPF fica fixo depois do cadastro para não alterar a referência de vendas antigas.
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