import { Router } from 'express';
import { VendaController } from '../controllers/VendaController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const vendaRoutes = Router();

// Endpoint para registar uma nova venda no PDV (CAIXA e GERENTE)
vendaRoutes.post('/', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), VendaController.create);

// Endpoint para consultar histórico de vendas (APENAS GERENTE)
vendaRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), VendaController.listarTodas);

export default vendaRoutes;