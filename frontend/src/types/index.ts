// ============================================
// Tipos globales del Frontend
// ============================================

/** Roles de usuario en el sistema */
export type UserRole = 'citizen' | 'admin';

/** Usuario autenticado */
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

/** Estados posibles de un reporte */
export type ReportStatus =
  | 'pending'
  | 'in_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

/** Categorías de daños viales */
export type DamageCategory =
  | 'pothole'
  | 'crack'
  | 'flooding'
  | 'sidewalk'
  | 'signage'
  | 'lighting'
  | 'drainage'
  | 'other';

/** Coordenadas geográficas */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Reporte de daño vial */
export interface Report {
  id: number;
  userId: number;
  category: DamageCategory;
  status: ReportStatus;
  title: string;
  description: string;
  location: GeoPoint;
  address?: string;
  neighborhood?: string;
  photoUrl?: string;
  referenceCode: string;
  createdAt: string;
  updatedAt: string;
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