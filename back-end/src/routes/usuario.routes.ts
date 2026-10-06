import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioRoutes = Router();

// Endpoints de gestão
usuarioRoutes.get('/', UsuarioController.listar);
usuarioRoutes.post('/', UsuarioController.create);

// Endpoint de login
usuarioRoutes.post('/login', UsuarioController.login);

export default usuarioRoutes;