// ============================================
// Tipos globales de la aplicación
// ============================================

/** Roles de usuario en el sistema */
export enum UserRole {
  CITIZEN = 'citizen',
  ADMIN = 'admin',
}

/** Estados posibles de un reporte */
export enum ReportStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

/** Categorías de daños viales */
export enum DamageCategory {
  POTHOLE = 'pothole',
  CRACK = 'crack',
  FLOODING = 'flooding',
  SIDEWALK = 'sidewalk',
  SIGNAGE = 'signage',
  LIGHTING = 'lighting',
  DRAINAGE = 'drainage',
  OTHER = 'other',
}

/** Estructura base de respuesta API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/** Estructura de paginación */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Respuesta paginada */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/** Coordenadas geográficas (PostGIS) */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
