import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const produtoRoutes = Router();

// Endpoint para buscar (aberto para todos autenticados)
produtoRoutes.get('/', ProdutoController.listar);

// Endpoints de escrita: GERENTE e SUPERVISOR podem criar, editar e inativar/ativar
produtoRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.create);
produtoRoutes.put('/:id', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.update);
produtoRoutes.patch('/:id/inativar', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.inativar);
produtoRoutes.patch('/:id/ativar', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.ativar);

export default produtoRoutes;