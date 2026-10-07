import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';

const produtoRoutes = Router();

// Endpoint para buscar (ex: /api/produtos ou /api/produtos?q=camiseta)
produtoRoutes.get('/', ProdutoController.listar);

// Endpoint para cadastrar
produtoRoutes.post('/', ProdutoController.create);

// Endpoint para inativar (usamos PATCH pois é uma atualização parcial do status)
produtoRoutes.patch('/:id/inativar', ProdutoController.inativar);

// Endpoint para reativar
produtoRoutes.patch('/:id/ativar', ProdutoController.ativar);

// Endpoint para editar
produtoRoutes.put('/:id', ProdutoController.update);

export default produtoRoutes;