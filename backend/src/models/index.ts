/**
 * Modelo de Usuario
 * 
 * Representa a los usuarios del sistema (ciudadanos y administradores).
 * Tabla: users
 */
export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Modelo de Reporte de Daño Vial
 * 
 * Representa un reporte hecho por un ciudadano.
 * Tabla: reports
 */
export interface Report {
  id: number;
  user_id: number;
  category_id: number;
  status_id: number;
  title: string;
  description: string;
  location: string;          // GEOMETRY(Point, 4326) en PostGIS
  address?: string;
  neighborhood?: string;
  photo_url?: string;
  reference_code: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Modelo de Estado de Reporte
 * 
 * Tabla: report_statuses
 */
export interface ReportStatusModel {
  id: number;
  name: string;
  label: string;
  color: string;
}

/**
 * Modelo de Categoría de Daño
 * 
 * Tabla: categories
 */
export interface Category {
  id: number;
  name: string;
  label: string;
  icon?: string;
  description?: string;
}

/**
 * Modelo de Historial de Reporte
 * 
 * Tabla: report_history
 */
export interface ReportHistory {
  id: number;
  report_id: number;
  status_id: number;
  changed_by: number;
  notes?: string;
  created_at: Date;
}
