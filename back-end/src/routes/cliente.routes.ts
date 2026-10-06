import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';

const clienteRoutes = Router();

// Endpoint para listar todos
clienteRoutes.get('/', ClienteController.findAll);

// Endpoint para buscar por ID
clienteRoutes.get('/:id', ClienteController.findById);

// Endpoint para cadastrar (com validação de duplicidade RN01)
clienteRoutes.post('/', ClienteController.create);

// Endpoint para editar
clienteRoutes.put('/:id', ClienteController.update);

export default clienteRoutes;