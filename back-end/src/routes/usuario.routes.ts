import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const usuarioRoutes = Router();

// Endpoint de login (público)
usuarioRoutes.post('/login', UsuarioController.login);

// Endpoints de gestão (apenas GERENTE)
usuarioRoutes.get('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.listar);
usuarioRoutes.post('/', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.create);
usuarioRoutes.put('/:id', autenticarToken, autorizarPerfil(['GERENTE']), UsuarioController.update);

export default usuarioRoutes;