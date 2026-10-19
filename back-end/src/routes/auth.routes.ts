import { Router } from 'express'; // Cria um roteador isolado para as rotas públicas de autenticação
import { UsuarioController } from '../controllers/UsuarioController'; // Controlador que valida as credenciais e gera o token JWT

const authRoutes = Router();

// O login é público: ele é o ponto de entrada para receber o token de acesso.
authRoutes.post('/login', UsuarioController.login);

export default authRoutes;
