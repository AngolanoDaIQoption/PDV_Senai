import { Request, Response } from 'express';
import { ProdutoModel } from '../models/Produto.model';
import { IProdutoInput } from '../routes/types';

export class ProdutoController {
  // Validamos os dados principais antes de pedir ao modelo para criar o produto.
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

  // Com termo de busca, retorna correspondências; sem termo, lista os produtos solicitados.
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const termo = req.query.q as string;
      
      if (termo) {
        const produtos = await ProdutoModel.buscar(termo);
        return res.status(200).json(produtos);
      }
      
      // A tela de gestão pode pedir também os inativos com ?todos=true.
      const apenasAtivos = req.query.todos !== "true";
      const todos = await ProdutoModel.findAll(apenasAtivos);
      return res.status(200).json(todos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
  }

  // Em vez de apagar o cadastro, marcamos o produto como inativo.
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

  // Reativar recupera o mesmo cadastro e seu histórico.
  static async ativar(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      const sucesso = await ProdutoModel.ativar(id);
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      
      return res.status(200).json({ message: 'Produto reativado com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao ativar produto.' });
    }
  }

  // Os campos enviados são encaminhados ao modelo para atualização.
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      const { codigo_barras, descricao, preco, estoque, ativo } = req.body;
      const sucesso = await ProdutoModel.update(id, {
        codigo_barras,
        descricao,
        preco,
        estoque,
        ativo,
      });

      if (!sucesso) {
        return res.status(404).json({ error: 'Produto não encontrado ou nenhuma alteração enviada.' });
      }

      return res.status(200).json({ message: 'Produto atualizado com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
  }
}