import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const clienteRoutes = Router();

// Endpoint para listar todos (CAIXA, SUPERVISOR e GERENTE)
clienteRoutes.get('/', autenticarToken, autorizarPerfil(['CAIXA', 'SUPERVISOR', 'GERENTE']), ClienteController.findAll);

// Endpoint para buscar por ID (CAIXA e GERENTE)
clienteRoutes.get('/:id', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), ClienteController.findById);

// Endpoint para cadastrar (CAIXA e GERENTE)
clienteRoutes.post('/', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), ClienteController.create);

// Endpoint para editar (CAIXA e GERENTE)
clienteRoutes.put('/:id', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), ClienteController.update);

export default clienteRoutes;