import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';

// TODO: Implementar controladores de estadísticas

/**
 * Obtener estadísticas generales del dashboard
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener reportes por categoría
 */
export const getReportsByCategory = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener reportes por estado
 */
export const getReportsByStatus = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener reportes por zona/geografía
 */
export const getReportsByZone = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};

/**
 * Obtener tendencia de reportes en el tiempo
 */
export const getReportsTrend = async (req: Request, res: Response) => {
  sendError(res, 'No implementado', 501);
};
