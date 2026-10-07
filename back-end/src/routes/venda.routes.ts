import { Router } from 'express';
import { VendaController } from '../controllers/VendaController';
import { autenticar } from '../middlewares/auth';

const vendaRoutes = Router();

// Endpoint para registar uma nova venda no PDV
vendaRoutes.post('/', autenticar, VendaController.create);

export default vendaRoutes;