import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface UsuarioTokenPayload {
  id: number;
  perfil: 'CAIXA' | 'GERENTE';
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pdv_dev_secret'
    ) as UsuarioTokenPayload;

    (req as any).usuario = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function exigirGerente(req: Request, res: Response, next: NextFunction) {
  const usuario = (req as any).usuario as UsuarioTokenPayload | undefined;

  if (!usuario || usuario.perfil !== 'GERENTE') {
    return res.status(403).json({ error: 'Acesso restrito a gerentes.' });
  }

  next();
}
