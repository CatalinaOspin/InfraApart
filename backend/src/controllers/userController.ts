import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';

// TODO: Implementar controladores de usuarios

/**
 * Registrar un nuevo usuario
 */
export const register = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Iniciar sesión
 */
export const login = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Actualizar perfil del usuario
 */
export const updateProfile = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};
