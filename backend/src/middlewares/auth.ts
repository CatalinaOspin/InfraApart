import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticación JWT
 * 
 * TODO: Implementar verificación de token JWT
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Verificar token JWT en el header Authorization
  // const token = req.headers.authorization?.split(' ')[1];
  // ...
  next();
};

/**
 * Middleware de autorización por roles
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Verificar que el rol del usuario autenticado esté permitido
    next();
  };
};