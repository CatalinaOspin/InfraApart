import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

/**
 * Envía una respuesta exitosa
 */
export const sendSuccess = <T>(res: Response, data: T, message = 'Operación exitosa', statusCode = 200): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

/**
 * Envía una respuesta de error
 */
export const sendError = (res: Response, message = 'Error interno del servidor', statusCode = 500, error?: string): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  res.status(statusCode).json(response);
};

/**
 * Envía una respuesta paginada
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = 'Operación exitosa'
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  res.status(200).json(response);
};
