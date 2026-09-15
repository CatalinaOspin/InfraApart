import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Middleware de validación de datos de entrada con Zod.
 *
 * - Si la validación falla → 400 con los errores aplanados (`{ field: [msgs] }`).
 * - Si valida → reemplaza `req.body` por el dato ya tipado por el schema.
 */
export const validateRequest = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: result.error.flatten(),
      });
      return;
    }

    req.body = result.data;
    next();
  };
};