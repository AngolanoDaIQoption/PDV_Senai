import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Perfil } from '../routes/types';

export interface UsuarioTokenPayload {
  id: number;
  perfil: Perfil;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioTokenPayload;
    }
  }
}

// Confere o token Bearer antes de deixar o pedido seguir para a rota protegida.
export function autenticarToken(req: Request, res: Response, next: NextFunction): void | Response {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pdv_dev_secret'
    ) as UsuarioTokenPayload;

    req.usuario = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Depois da autenticação, esta etapa verifica se o perfil pode executar aquela ação.
export function autorizarPerfil(perfisPermitidos: Perfil[]) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ error: 'Acesso negado: Requer perfil Gerente' });
    }

    return next();
  };
}
