import { Router } from 'express'; // Router do módulo de vendas
import { VendaController } from '../controllers/VendaController'; // Controlador responsável pela lógica da venda e do histórico
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware'; // Garante sessão válida e perfil permitido no fluxo de vendas

const vendaRoutes = Router();

// Caixa e gerente podem registrar vendas; só o gerente consulta o histórico completo.
vendaRoutes.post('/', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), VendaController.create);

// O histórico completo fica restrito ao gerente.
vendaRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), VendaController.listarTodas);

// Apenas gerentes podem cancelar uma venda já finalizada, com registro do motivo.
vendaRoutes.patch('/:id/cancelar', autenticarToken, autorizarPerfil(['GERENTE']), VendaController.cancelar);

export default vendaRoutes;