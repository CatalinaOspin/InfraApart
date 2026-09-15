import { DamageType, ReportStatusName, SeverityLevel } from '../types';

/**
 * Catálogos y etiquetas en español para los enums de la plataforma.
 */

export const DAMAGE_TYPES: DamageType[] = [
  'pothole',
  'crack',
  'flooding',
  'sidewalk',
  'signage',
  'lighting',
  'drainage',
  'other',
];

export const SEVERITY_LEVELS: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

export const STATUS_NAMES: ReportStatusName[] = [
  'pending',
  'in_review',
  'in_progress',
  'resolved',
  'rejected',
];

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  pothole: 'Hueco/bache',
  crack: 'Grieta',
  flooding: 'Inundación',
  sidewalk: 'Andén deteriorado',
  signage: 'Señalización',
  lighting: 'Alumbrado público',
  drainage: 'Drenaje/alcantarilla',
  other: 'Otro',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: '#2e7d32',
  medium: '#f9a825',
  high: '#ef6c00',
  critical: '#c62828',
};

/** Formatea una fecha ISO a formato local (es-CO). */
export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};