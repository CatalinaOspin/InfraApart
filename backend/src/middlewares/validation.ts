import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validación de datos de entrada
 * 
 * TODO: Implementar validación de schemas por ruta
 */
export const validateRequest = (schema: Record<string, unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Validar req.body contra el schema proporcionado
    next();
  };
};