/**
 * Interfaces manuales de los modelos de dominio.
 *
 * NOTA: desde la Fase 2 la fuente de verdad de los tipos es el cliente
 * generado por `@prisma/client` (npx prisma generate). Estas interfaces se
 * mantienen para capas de DTO/validación y reflejan docs/database_schema.sql.
 */
import type { DamageType, SeverityLevel, UserRole } from '../types';

/**
 * Modelo de Usuario
 *
 * Representa a los usuarios del sistema (ciudadanos y administradores).
 * Tabla: users
 */
export interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Modelo de Categoría de Daño
 *
 * Tabla: categories
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
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
  description?: string;
  is_active: boolean;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Modelo de Reporte de Daño Vial
 *
 * Representa un reporte hecho por un ciudadano.
 * Tabla: reports · geolocalización vía latitude/longitude (Float).
 */
export interface Report {
  id: number;
  reference_code: string;
  user_id: number;
  category_id: number;
  status_id: number;
  title: string;
  description?: string;
  damage_type: DamageType;
  severity_level: SeverityLevel;
  latitude: number;
  longitude: number;
  location_address?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Modelo de Historial de Reporte
 *
 * Tabla: report_history
 */
export interface ReportHistory {
  id: number;
  report_id: number;
  previous_status_id?: number;
  new_status_id: number;
  changed_by_user_id: number;
  comment?: string;
  created_at: Date;
}
