import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const produtoRoutes = Router();

// A busca é aberta; alterações no catálogo ficam para supervisor e gerente.
produtoRoutes.get('/', ProdutoController.listar);

// Só supervisor e gerente podem alterar o catálogo.
produtoRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.create);
produtoRoutes.put('/:id', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.update);
produtoRoutes.patch('/:id/inativar', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.inativar);
produtoRoutes.patch('/:id/ativar', autenticarToken, autorizarPerfil(['GERENTE', 'SUPERVISOR']), ProdutoController.ativar);

export default produtoRoutes;