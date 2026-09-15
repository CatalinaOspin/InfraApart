import apiClient from './api';
import {
  ApiResponse,
  PaginatedResponse,
  Report,
  ReportCreateInput,
  ReportQuery,
  ReportUpdateInput,
} from '../types';

/**
 * Servicios de Reportes Viales conectados al backend (/api/reports/*).
 * Todas las llamadas requieren JWT (lo inyecta el interceptor de api.ts).
 */

/** POST /reports — Crear un reporte vial (autenticado). */
export const createReport = async (input: ReportCreateInput): Promise<Report> => {
  const { data } = await apiClient.post<ApiResponse<Report>>('/reports', input);
  return data.data!;
};

/** GET /reports — Listar con filtros opcionales y paginación. */
export const getReports = async (query: ReportQuery = {}): Promise<PaginatedResponse<Report>> => {
  const { data } = await apiClient.get<PaginatedResponse<Report>>('/reports', {
    params: {
      category: query.category,
      severity: query.severity,
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return data;
};

/** GET /reports/mine — Reportes del usuario autenticado. */
export const getMyReports = async (query: Pick<ReportQuery, 'page' | 'limit'> = {}): Promise<PaginatedResponse<Report>> => {
  const { data } = await apiClient.get<PaginatedResponse<Report>>('/reports/mine', {
    params: { page: query.page ?? 1, limit: query.limit ?? 20 },
  });
  return data;
};

/** GET /reports/:id — Detalle de un reporte (con historial). */
export const getReportById = async (id: number): Promise<Report> => {
  const { data } = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
  return data.data!;
};

/** PUT /reports/:id — Editar datos del reporte (dueño o admin). */
export const updateReport = async (id: number, input: ReportUpdateInput): Promise<Report> => {
  const { data } = await apiClient.put<ApiResponse<Report>>(`/reports/${id}`, input);
  return data.data!;
};

/** PATCH /reports/:id/status — Cambiar estado (requiere rol admin). */
export const updateReportStatus = async (id: number, status: string, comment?: string): Promise<Report> => {
  const { data } = await apiClient.patch<ApiResponse<Report>>(`/reports/${id}/status`, { status, comment });
  return data.data!;
};

/** DELETE /reports/:id — Eliminar reporte (requiere rol admin). */
export const deleteReport = async (id: number): Promise<void> => {
  await apiClient.delete(`/reports/${id}`);
};