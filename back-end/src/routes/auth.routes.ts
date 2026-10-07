import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

const authRoutes = Router();

authRoutes.post('/login', UsuarioController.login);

export default authRoutes;
