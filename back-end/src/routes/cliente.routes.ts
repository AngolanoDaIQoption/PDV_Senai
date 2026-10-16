import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { autenticarToken, autorizarPerfil } from '../middlewares/auth.middleware';

const clienteRoutes = Router();

// As permissões ficam junto às rotas, antes de a requisição chegar ao controlador.
// A listagem aceita os três perfis; as demais operações são mais restritas.
clienteRoutes.get('/', autenticarToken, autorizarPerfil(['CAIXA', 'SUPERVISOR', 'GERENTE']), ClienteController.findAll);

// A busca individual fica disponível para caixa e gerente.
clienteRoutes.get('/:id', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), ClienteController.findById);

// Caixa e gerente também podem cadastrar clientes.
clienteRoutes.post('/', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), ClienteController.create);

// A edição segue a mesma permissão do cadastro.
clienteRoutes.put('/:id', autenticarToken, autorizarPerfil(['CAIXA', 'GERENTE']), ClienteController.update);

export default clienteRoutes;