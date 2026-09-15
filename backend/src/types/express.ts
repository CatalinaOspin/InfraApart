import type { AuthUser } from '../middlewares/auth';

/**
 * Extensión de Express.Request: `req.user` queda disponible en cualquier
 * ruta protegida por authenticateToken.
 *
 * Este archivo es `.ts` (no `.d.ts`) a propósito: cuando `middlewares/auth.ts`
 * lo importa, ts-node en runtime y el build `dist/` emiten un `require`
 * real, y un `.d.ts` no genera ningún artefacto que resolver.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};