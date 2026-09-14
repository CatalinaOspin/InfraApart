import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';

// TODO: Implementar controladores de reportes

/**
 * Crear un nuevo reporte de daño vial
 */
export const createReport = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener todos los reportes (con filtros y paginación)
 */
export const getReports = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener un reporte por ID
 */
export const getReportById = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Actualizar un reporte
 */
export const updateReport = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Eliminar un reporte
 */
export const deleteReport = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener reportes del usuario autenticado
 */
export const getMyReports = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};
