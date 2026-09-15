import { z } from 'zod';

// ============================================
// Schemas de validación con Zod
// Inventario:
//   registerSchema → POST /api/auth/register
//   loginSchema    → POST /api/auth/login
//
// NOTA: zod descarta (strip) por defecto las claves desconocidas del body.
// Eso significa que campos como `role` enviados por el cliente se IGNORAN:
// la asignación de rol es responsabilidad exclusiva del servidor.
// ============================================

const emailSchema = z
  .string('El email es obligatorio')
  .trim()
  .toLowerCase()
  .min(1, 'El email es obligatorio')
  .email('El email no tiene un formato válido');

/** Esquema de registro de usuario */
export const registerSchema = z.object({
  full_name: z
    .string('El nombre completo es obligatorio')
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(150, 'El nombre completo no puede superar los 150 caracteres'),
  email: emailSchema,
  password: z
    .string('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  // Teléfono colombiano: 10 dígitos, comienza con 3 (opcional)
  phone: z
    .string()
    .trim()
    .regex(
      /^3\d{9}$/,
      'El teléfono debe tener 10 dígitos y comenzar con 3 (formato colombiano)'
    )
    .optional()
    .nullable(),
});

/** Esquema de inicio de sesión */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string('La contraseña es obligatoria')
    .min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// Reportes viales
// Esquemas: reportCreateSchema → POST /api/reports
//           reportUpdateSchema → PUT /api/reports/:id
//           reportStatusSchema → PATCH /api/reports/:id/status
// ============================================

/** Tipos de daño admitidos (espejo del enum damage_type de PostgreSQL). */
const damageTypeSchema = z.enum(
  ['pothole', 'crack', 'flooding', 'sidewalk', 'signage', 'lighting', 'drainage', 'other'],
  'El tipo de daño no es válido'
);

/** Niveles de severidad admitidos (espejo del enum severity_level). */
const severityLevelSchema = z.enum(
  ['low', 'medium', 'high', 'critical'],
  'El nivel de severidad no es válido'
);

/** Coordenadas geográficas obligatorias y en rango válido. */
const latitudeSchema = z
  .number('La latitud es obligatoria')
  .min(-90, 'La latitud debe estar entre -90 y 90')
  .max(90, 'La latitud debe estar entre -90 y 90');

const longitudeSchema = z
  .number('La longitud es obligatoria')
  .min(-180, 'La longitud debe estar entre -180 y 180')
  .max(180, 'La longitud debe estar entre -180 y 180');

/** Creación de un reporte vial (POST /api/reports). */
export const reportCreateSchema = z.object({
  title: z
    .string('El título es obligatorio')
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar los 200 caracteres'),
  description: z
    .string()
    .trim()
    .max(2000, 'La descripción no puede superar los 2000 caracteres')
    .optional()
    .nullable(),
  damage_type: damageTypeSchema,
  severity_level: severityLevelSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  location_address: z
    .string()
    .trim()
    .max(255, 'La dirección no puede superar los 255 caracteres')
    .optional()
    .nullable(),
  image_url: z
    .string()
    .trim()
    .url('La URL de la imagen no es válida')
    .max(255, 'La URL de la imagen no puede superar los 255 caracteres')
    .optional()
    .nullable(),
});

/** Edición parcial de un reporte (PUT /api/reports/:id). */
export const reportUpdateSchema = z.object({
  title: z
    .string('El título es obligatorio')
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar los 200 caracteres')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'La descripción no puede superar los 2000 caracteres')
    .optional()
    .nullable(),
  damage_type: damageTypeSchema.optional(),
  severity_level: severityLevelSchema.optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  location_address: z
    .string()
    .trim()
    .max(255, 'La dirección no puede superar los 255 caracteres')
    .optional()
    .nullable(),
  image_url: z
    .string()
    .trim()
    .url('La URL de la imagen no es válida')
    .max(255, 'La URL de la imagen no puede superar los 255 caracteres')
    .optional()
    .nullable(),
});

/** Cambio de estado de un reporte (PATCH /api/reports/:id/status). */
export const reportStatusSchema = z.object({
  status: z.enum(
    ['pending', 'in_review', 'in_progress', 'resolved', 'rejected'],
    'El estado no es válido'
  ),
  comment: z
    .string()
    .trim()
    .max(500, 'El comentario no puede superar los 500 caracteres')
    .optional()
    .nullable(),
});

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;
export type ReportStatusInput = z.infer<typeof reportStatusSchema>;