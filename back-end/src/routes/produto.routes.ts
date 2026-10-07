import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const produtoRoutes = Router();

// Endpoint para buscar (aberto para todos)
produtoRoutes.get('/', ProdutoController.listar);

// Endpoint para cadastrar (apenas GERENTE)
produtoRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE']), ProdutoController.create);

// Endpoint para inativar (apenas GERENTE)
produtoRoutes.patch('/:id/inativar', autenticarToken, autorizarPerfil(['GERENTE']), ProdutoController.inativar);

// Endpoint para reativar (apenas GERENTE)
produtoRoutes.patch('/:id/ativar', autenticarToken, autorizarPerfil(['GERENTE']), ProdutoController.ativar);

// Endpoint para editar (apenas GERENTE)
produtoRoutes.put('/:id', autenticarToken, autorizarPerfil(['GERENTE']), ProdutoController.update);

export default produtoRoutes;