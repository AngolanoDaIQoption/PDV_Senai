import { Router } from 'express';
import { VendaController } from '../controllers/VendaController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const vendaRoutes = Router();

// Caixa e gerente podem registrar vendas; só o gerente consulta o histórico completo.
vendaRoutes.post('/', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), VendaController.create);

// O histórico completo fica restrito ao gerente.
vendaRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), VendaController.listarTodas);

export default vendaRoutes;