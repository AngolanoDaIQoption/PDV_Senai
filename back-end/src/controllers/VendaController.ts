import { Request, Response } from 'express'; // Tipos HTTP usados para receber a venda e devolver resposta da API
import { ResultSetHeader } from 'mysql2/promise'; // Tipo de retorno de INSERT/UPDATE para consultas em MySQL
import jwt from 'jsonwebtoken'; // Valida token do gerente quando há autorização especial de desconto
import pool from '../config/db'; // Pool de conexões com o banco
import { ProdutoModel } from '../models/Produto.model'; // Consulta e atualização de estoque dos itens vendidos
import { UsuarioModel } from '../models/Usuario.model'; // Identificação do operador e do gerente autorizador
import { ItemVendaModel } from '../models/ItemVenda.model'; // Registro dos itens da venda
import { VendaModel } from '../models/Venda.model'; // Consulta do histórico e dados da venda
import { IVendaInput } from '../routes/types'; // Tipo das informações enviadas no pedido de venda

class VendaRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export class VendaController {
  static async create(req: Request, res: Response): Promise<Response> {
    // Uma conexão dedicada garante que venda, itens e estoque usem a mesma transação.
    const connection = await pool.getConnection();
    
    try {
      const { cliente_id, valor_desconto = 0, forma_pagamento, itens } = req.body as IVendaInput;
      const usuario_id = req.usuario?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      // Uma venda sem itens não representa uma compra válida.
      if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'A venda deve conter pelo menos um item.' });
      }

      if (!Number.isFinite(valor_desconto) || valor_desconto < 0) {
        return res.status(400).json({ error: 'O valor do desconto deve ser zero ou maior.' });
      }

      if (itens.some((item) =>
        !Number.isInteger(item.produto_id) ||
        item.produto_id <= 0 ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade <= 0
      )) {
        return res.status(400).json({ error: 'Cada item precisa de um produto válido e uma quantidade inteira maior que zero.' });
      }

      // Confirmamos que quem está registrando a venda ainda é um operador ativo.
      const operador = await UsuarioModel.findById(usuario_id);
      if (!operador || !operador.ativo) {
        return res.status(400).json({ error: 'Operador inválido ou inativo.' });
      }

      // A partir daqui, qualquer falha permite desfazer todas as alterações juntas.
      await connection.beginTransaction();

      let valor_subtotal_centavos = 0;
      const itensProcessados = [];

      // O preço e o estoque são conferidos no servidor, não confiamos nos valores do navegador.
      for (const item of itens) {
        const produto = await ProdutoModel.findById(item.produto_id, connection);
        
        if (!produto || !produto.ativo) {
          throw new Error(`Produto ID ${item.produto_id} não encontrado ou inativo.`);
        }
        if (produto.estoque < item.quantidade) { // Não deixamos a venda passar do estoque disponível.
          throw new Error(`Estoque insuficiente para o produto: ${produto.descricao}. Disponível: ${produto.estoque}`);
        }

        const preco_unitario_centavos = Math.round(produto.preco * 100);
        const subtotal_item_centavos = preco_unitario_centavos * item.quantidade;
        valor_subtotal_centavos += subtotal_item_centavos;

        itensProcessados.push({
          produto_id: produto.id,
          quantidade: item.quantidade,
          preco_unitario: preco_unitario_centavos / 100, // Guardamos o preço de hoje para preservar o histórico da venda.
          subtotal: subtotal_item_centavos / 100
        });
      }

      const valor_desconto_centavos = Math.round(valor_desconto * 100);
      if (valor_desconto_centavos > valor_subtotal_centavos) {
        throw new VendaRequestError('O desconto não pode ser maior que o subtotal.', 400);
      }

      // O servidor calcula o percentual real usando os preços atuais do banco.
      const percentual_desconto = valor_subtotal_centavos > 0
        ? Math.round((valor_desconto_centavos / valor_subtotal_centavos) * 10000) / 100
        : 0;
      const excedeLimiteDesconto = valor_subtotal_centavos > 0 &&
        valor_desconto_centavos * 100 > valor_subtotal_centavos * 10;
      const valor_subtotal = valor_subtotal_centavos / 100;
      const valor_desconto_final = valor_desconto_centavos / 100;
      const valor_total = (valor_subtotal_centavos - valor_desconto_centavos) / 100;
      let autorizado_por: number | null = null;

      // O gerente precisa provar que está autenticado; não confiamos só em um ID vindo do navegador.
      if (excedeLimiteDesconto) {
        if (operador.perfil === 'GERENTE') {
          autorizado_por = operador.id;
        } else {
          const cabecalho = req.header('X-Gerente-Authorization') || '';
          const tokenGerente = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
          if (!tokenGerente) {
            throw new VendaRequestError(
              'Descontos acima de 10% exigem autorização de um gerente.',
              403,
              'MANAGER_AUTH_REQUIRED',
            );
          }

          let payload: jwt.JwtPayload;
          try {
            const verificado = jwt.verify(tokenGerente, process.env.JWT_SECRET || 'pdv_dev_secret');
            if (typeof verificado === 'string') {
              throw new VendaRequestError('Token de autorização inválido.', 403);
            }
            payload = verificado;
          } catch (error) {
            if (error instanceof VendaRequestError) throw error;
            throw new VendaRequestError('Token de autorização inválido ou expirado.', 403);
          }

          if (typeof payload.id !== 'number' || payload.perfil !== 'GERENTE') {
            throw new VendaRequestError('A autorização deve ser feita por um gerente.', 403);
          }

          const gerente = await UsuarioModel.findById(payload.id);
          if (!gerente || gerente.perfil !== 'GERENTE' || !gerente.ativo) {
            throw new VendaRequestError('O gerente autorizador não está ativo.', 403);
          }
          autorizado_por = gerente.id;
        }
      }

      // Primeiro gravamos o resumo da compra para obter seu ID.
      const [vendaResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO vendas (cliente_id, usuario_id, autorizado_por, valor_subtotal, percentual_desconto, valor_desconto, valor_total, forma_pagamento) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cliente_id || null, usuario_id, autorizado_por, valor_subtotal, percentual_desconto, valor_desconto_final, valor_total, forma_pagamento]
      );
      const venda_id = vendaResult.insertId;

      // Depois registramos cada item e descontamos sua quantidade do estoque.
      for (const item of itensProcessados) {
        await ItemVendaModel.create({
          venda_id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        }, connection);

        const estoqueAtualizado = await ProdutoModel.updateEstoque(
          item.produto_id,
          -item.quantidade,
          connection,
        );
        if (!estoqueAtualizado) {
          throw new Error(`Não foi possível atualizar o estoque do produto ID ${item.produto_id}.`);
        }
      }

      // Só confirmamos quando o resumo, os itens e o estoque foram atualizados com sucesso.
      await connection.commit();
      return res.status(201).json({ message: 'Venda finalizada com sucesso!', venda_id, valor_total });

    } catch (error: unknown) {
      // Se algo falhou no meio do processo, o banco volta ao estado anterior.
      await connection.rollback();
      console.error(error);
      const status = error instanceof VendaRequestError ? error.status : 400;
      const code = error instanceof VendaRequestError ? error.code : undefined;
      const message = error instanceof Error ? error.message : 'Erro ao processar venda.';
      return res.status(status).json({ error: message, ...(code ? { code } : {}) });
    } finally {
      // A conexão volta para a pool tanto em caso de sucesso quanto de erro.
      connection.release();
    }
  }

  // O modelo monta o histórico e aplica os filtros pedidos pelo gerente.
  static async listarTodas(req: Request, res: Response): Promise<Response> {
    try {
      const { data, cliente, operador } = req.query as {
        data?: string;
        cliente?: string;
        operador?: string;
      };

      const vendas = await VendaModel.listarComFiltros({ data, cliente, operador });
      return res.status(200).json(vendas);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de vendas.' });
    }
  }

  // Só o gerente pode cancelar uma venda finalizada, e o estoque é devolvido ao sistema.
  static async cancelar(req: Request, res: Response): Promise<Response> {
    const connection = await pool.getConnection();

    try {
      const id = Number(req.params.id);
      const motivo = String(req.body?.motivo ?? '').trim();
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID da venda inválido.' });
      }

      if (!motivo) {
        return res.status(400).json({ error: 'Informe o motivo do cancelamento.' });
      }

      if (req.usuario?.perfil !== 'GERENTE') {
        return res.status(403).json({ error: 'Apenas gerentes podem cancelar vendas.' });
      }

      const venda = await VendaModel.findById(id);
      if (!venda) {
        return res.status(404).json({ error: 'Venda não encontrada.' });
      }

      if (venda.status === 'CANCELADA') {
        return res.status(409).json({ error: 'Esta venda já foi cancelada.' });
      }

      await connection.beginTransaction();

      const itens = await ItemVendaModel.findByVendaId(id, connection);

      for (const item of itens) {
        const estoqueRestaurado = await ProdutoModel.updateEstoque(item.produto_id, item.quantidade, connection);
        if (!estoqueRestaurado) {
          throw new Error(`Não foi possível restaurar o estoque do produto ${item.produto_id}.`);
        }
      }

      const cancelada = await VendaModel.cancelar(id, motivo, usuarioId, connection);
      if (!cancelada) {
        throw new Error('Não foi possível cancelar a venda.');
      }

      await connection.commit();
      return res.status(200).json({ message: 'Venda cancelada com sucesso.', id });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      const mensagem = error instanceof Error ? error.message : 'Erro ao cancelar venda.';
      return res.status(400).json({ error: mensagem });
    } finally {
      connection.release();
    }
  }
}