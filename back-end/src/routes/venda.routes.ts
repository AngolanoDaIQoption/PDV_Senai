import { Router } from 'express';
import { VendaController } from '../controllers/VendaController';

const vendaRoutes = Router();

// Endpoint para registar uma nova venda no PDV
vendaRoutes.post('/', VendaController.create);

export default vendaRoutes;