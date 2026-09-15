import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
// Carga la ampliación de Express.Request (`req.user`). Es un `import` a
// propósito: sin él, ts-node en runtime no incluye los .d.ts de tsconfig
// (`--files` apagado) y falla con TS2339.
import '../types/express';

/**
 * Payload mínimo del JWT de InfraApart.
 * Se incluye únicamente `{ id, role }` (principio de mínimo privilegio).
 */
export interface AuthUser {
  id: number;
  role: string;
}

/**
 * Middleware de autenticación JWT.
 * Verifica la cabecera `Authorization: Bearer <token>` y expone
 * `req.user = { id, role }` para los handlers posteriores.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Token de autenticación no proporcionado',
    });
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;

    if (typeof payload.id !== 'number' || typeof payload.role !== 'string') {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
      return;
    }

    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

/** Alias por compatibilidad con el API anterior del repositorio. */
export const authMiddleware = authenticateToken;

/**
 * Middleware de autorización por roles.
 * Requiere que `authenticateToken` haya corrido antes (para `req.user`).
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
      });
      return;
    }

    next();
  };
};