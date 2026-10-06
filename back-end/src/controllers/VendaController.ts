import { Request, Response } from 'express';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';
import { ProdutoModel } from '../models/Produto.model';
import { UsuarioModel } from '../models/Usuario.model';
import { ItemVendaModel } from '../models/ItemVenda.model';
import { IVendaInput } from '../types';

export class VendaController {
  static async create(req: Request, res: Response): Promise<Response> {
    // Iniciamos uma conexão dedicada para a Transação SQL (RNF04)
    const connection = await pool.getConnection();
    
    try {
      const { cliente_id, usuario_id, autorizado_por, percentual_desconto = 0, forma_pagamento, itens } = req.body as IVendaInput;

      // RN10: Venda deve ter itens
      if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'A venda deve conter pelo menos um item.' });
      }

      // Valida o operador do caixa
      const operador = await UsuarioModel.findById(usuario_id);
      if (!operador || !operador.ativo) {
        return res.status(400).json({ error: 'Operador inválido ou inativo.' });
      }

      // RN04 e RN09: Alçada de desconto acima de 10%
      if (percentual_desconto > 10) {
        if (!autorizado_por) {
          return res.status(403).json({ error: 'Descontos acima de 10% exigem ID de autorização do gerente.' });
        }
        const gerente = await UsuarioModel.findById(autorizado_por);
        if (!gerente || gerente.perfil !== 'GERENTE' || !gerente.ativo) {
          return res.status(403).json({ error: 'Autorizador inválido. Deve ser um Gerente ativo.' });
        }
      }

      // Inicia a transação no banco de dados
      await connection.beginTransaction();

      let valor_subtotal = 0;
      const itensProcessados = [];

      // Processa cada item enviado (RN03, RN06, RN11)
      for (const item of itens) {
        const produto = await ProdutoModel.findById(item.produto_id, connection);
        
        if (!produto || !produto.ativo) {
          throw new Error(`Produto ID ${item.produto_id} não encontrado ou inativo.`);
        }
        if (produto.estoque < item.quantidade) { // RN03: Bloqueia sem estoque
          throw new Error(`Estoque insuficiente para o produto: ${produto.descricao}. Disponível: ${produto.estoque}`);
        }

        const subtotal_item = produto.preco * item.quantidade;
        valor_subtotal += subtotal_item;

        itensProcessados.push({
          produto_id: produto.id,
          quantidade: item.quantidade,
          preco_unitario: produto.preco, // RN06: Grava o preço atual histórico
          subtotal: subtotal_item
        });
      }

      // RN11: Consistência matemática
      const valor_desconto = (valor_subtotal * percentual_desconto) / 100;
      const valor_total = valor_subtotal - valor_desconto;

      // Insere o cabeçalho da Venda usando a conexão transacional
      const [vendaResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO vendas (cliente_id, usuario_id, autorizado_por, valor_subtotal, percentual_desconto, valor_desconto, valor_total, forma_pagamento) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cliente_id || null, usuario_id, autorizado_por || null, valor_subtotal, percentual_desconto, valor_desconto, valor_total, forma_pagamento]
      );
      const venda_id = vendaResult.insertId;

      // Insere os Itens e abate o Estoque (RN07)
      for (const item of itensProcessados) {
        await ItemVendaModel.create({
          venda_id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        }, connection);

        // O delta é negativo para baixar o estoque na venda
        await ProdutoModel.updateEstoque(item.produto_id, -item.quantidade, connection);
      }

      // Se tudo correu bem, consolida a transação
      await connection.commit();
      return res.status(201).json({ message: 'Venda finalizada com sucesso!', venda_id, valor_total });

    } catch (error: any) {
      // Se houver qualquer erro (ex: falta de estoque), desfaz TUDO
      await connection.rollback();
      console.error(error);
      return res.status(400).json({ error: error.message || 'Erro ao processar venda.' });
    } finally {
      // Liberta a conexão de volta para a pool
      connection.release();
    }
  }
}