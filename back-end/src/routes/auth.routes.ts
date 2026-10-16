import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

const authRoutes = Router();

// O login é público: ele é o ponto de entrada para receber o token de acesso.
authRoutes.post('/login', UsuarioController.login);

export default authRoutes;
