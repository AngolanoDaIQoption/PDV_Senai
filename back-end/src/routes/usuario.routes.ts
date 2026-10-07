import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const usuarioRoutes = Router();

// Endpoints de gestão (apenas GERENTE)
usuarioRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.listar);
usuarioRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.create);

// Endpoint de login (público)
usuarioRoutes.post('/login', UsuarioController.login);

export default usuarioRoutes;