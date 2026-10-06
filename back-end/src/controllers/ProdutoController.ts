import { Request, Response } from 'express';
import { ProdutoModel } from '../models/Produto.model';
import { IProdutoInput } from '../types';

export class ProdutoController {
  // Cadastro de produto (com validação de preço e código único)
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { codigo_barras, descricao, preco, estoque } = req.body as IProdutoInput;

      if (!codigo_barras || !descricao || preco === undefined || estoque === undefined) {
        return res.status(400).json({ error: 'Código, descrição, preço e estoque são obrigatórios.' });
      }

      if (preco <= 0) {
        return res.status(400).json({ error: 'O preço do produto deve ser maior que zero.' });
      }

      const produtoExistente = await ProdutoModel.findByCodigoBarras(codigo_barras);
      if (produtoExistente) {
        return res.status(409).json({ error: 'Já existe um produto com este código de barras.' });
      }

      const id = await ProdutoModel.create({ codigo_barras, descricao, preco, estoque, ativo: true });
      return res.status(201).json({ message: 'Produto cadastrado com sucesso', id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar produto.' });
    }
  }

  // Busca rápida para o caixa (por nome/código) ou lista de todos os ativos
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const termo = req.query.q as string;
      
      if (termo) {
        const produtos = await ProdutoModel.buscar(termo);
        return res.status(200).json(produtos);
      }
      
      // Retorna apenas os ativos por padrão para não poluir o PDV
      const todos = await ProdutoModel.findAll(true);
      return res.status(200).json(todos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
  }

  // Inativação lógica do produto
  static async inativar(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      const sucesso = await ProdutoModel.inativar(id);
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      
      return res.status(200).json({ message: 'Produto inativado com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao inativar produto.' });
    }
  }
}