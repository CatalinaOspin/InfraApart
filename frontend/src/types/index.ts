// ============================================
// Tipos globales del Frontend
// Espejo de los DTO snake_case del backend (src/controllers/*).
// ============================================

/** Roles de usuario en el sistema */
export type UserRole = 'citizen' | 'admin';

/** Usuario autenticado (respuesta de /api/auth) */
export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Datos de registro enviados a /api/auth/register */
export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

/** Respuesta de /api/auth/login */
export interface LoginResponse {
  token: string;
  user: User;
}

/** Estados posibles de un reporte (report_statuses.name) */
export type ReportStatusName =
  | 'pending'
  | 'in_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

/** Estado formateado que devuelve el backend */
export interface ReportStatusInfo {
  id: number;
  name: ReportStatusName;
  label: string;
  color: string;
}

/** Tipos de daño (enum damage_type) */
export type DamageType =
  | 'pothole'
  | 'crack'
  | 'flooding'
  | 'sidewalk'
  | 'signage'
  | 'lighting'
  | 'drainage'
  | 'other';

/** Niveles de severidad (enum severity_level) */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/** Categoría derivada del tipo de daño */
export interface ReportCategory {
  id: number;
  name: DamageType;
}

/** Referencia ligera al creador del reporte */
export interface ReportUserRef {
  id: number;
  full_name: string;
}

/** Reporte de daño vial (DTO del backend) */
export interface Report {
  id: number;
  reference_code: string;
  title: string;
  description: string | null;
  damage_type: DamageType;
  severity_level: SeverityLevel;
  latitude: number;
  longitude: number;
  location_address: string | null;
  image_url: string | null;
  status: ReportStatusInfo;
  category: ReportCategory;
  user: ReportUserRef;
  created_at: string;
  updated_at: string;
}

/** Entrada del historial de cambios de estado */
export interface ReportHistoryEntry {
  id: number;
  comment: string | null;
  previous: { id: number; name: ReportStatusName; label: string } | null;
  next: { id: number; name: ReportStatusName; label: string };
  changed_by: { id: number; full_name: string };
  created_at: string;
}

/** Detalle de un reporte (GET /reports/:id) */
export interface ReportDetail extends Report {
  history: ReportHistoryEntry[];
}

/** Cuerpo de creación de reporte (POST /reports) */
export interface ReportCreateInput {
  title: string;
  description?: string | null;
  damage_type: DamageType;
  severity_level: SeverityLevel;
  latitude: number;
  longitude: number;
  location_address?: string | null;
  image_url?: string | null;
}

/** Cuerpo de edición parcial (PUT /reports/:id) */
export interface ReportUpdateInput {
  title?: string;
  description?: string | null;
  damage_type?: DamageType;
  severity_level?: SeverityLevel;
  latitude?: number;
  longitude?: number;
  location_address?: string | null;
  image_url?: string | null;
}

/** Filtros de listado (GET /reports) */
export interface ReportQuery {
  category?: DamageType;
  severity?: SeverityLevel;
  status?: ReportStatusName;
  page?: number;
  limit?: number;
}

/** Respuesta base de la API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/** Metadatos de paginación */
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