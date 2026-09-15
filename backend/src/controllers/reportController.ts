import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { sendError, sendPaginated, sendSuccess } from '../utils/responses';
import { calculatePagination, generateCode } from '../utils/helpers';
import {
  reportCreateSchema,
  reportStatusSchema,
  reportUpdateSchema,
} from '../utils/validators';
import '../types/express';

/**
 * Controlador de Reportes Viales.
 * Todas las rutas están protegidas por JWT desde src/routes/reportRoutes.ts.
 */

// ---------------------------------------------------------------------------
// Constantes de dominio (espejo de los enums de PostgreSQL, ver schema.prisma)
// ---------------------------------------------------------------------------
const DAMAGE_TYPES = [
  'pothole',
  'crack',
  'flooding',
  'sidewalk',
  'signage',
  'lighting',
  'drainage',
  'other',
] as const;
type DamageTypeValue = (typeof DAMAGE_TYPES)[number];

const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
type SeverityValue = (typeof SEVERITY_LEVELS)[number];

const STATUS_NAMES = ['pending', 'in_review', 'in_progress', 'resolved', 'rejected'] as const;
type StatusNameValue = (typeof STATUS_NAMES)[number];

/** Relaciones incluidas en listas y detalle (sin datos sensibles). */
const REPORT_INCLUDE = {
  user: { select: { id: true, fullName: true, email: true } },
  category: { select: { id: true, name: true } },
  status: { select: { id: true, name: true, label: true, color: true } },
} as const satisfies Prisma.ReportInclude;

type ReportWithRelations = Prisma.ReportGetPayload<{ include: typeof REPORT_INCLUDE }>;

const HISTORY_INCLUDE = {
  include: {
    previous: { select: { id: true, name: true, label: true } },
    next: { select: { id: true, name: true, label: true } },
    changedBy: { select: { id: true, fullName: true } },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseReportId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Código de referencia único: IA-YYYYMMDD-XXXXXX (máx. 20 chars). */
function generateReferenceCode(): string {
  const now = new Date();
  const yyyymmdd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  return `IA-${yyyymmdd}-${generateCode(6)}`;
}

/** DTO público de un reporte (snake_case, sin campos internos). */
function toReportDto(report: ReportWithRelations) {
  return {
    id: report.id,
    reference_code: report.referenceCode,
    title: report.title,
    description: report.description,
    damage_type: report.damageType,
    severity_level: report.severityLevel,
    latitude: report.latitude,
    longitude: report.longitude,
    location_address: report.locationAddress,
    image_url: report.imageUrl,
    status: report.status,
    category: report.category,
    user: { id: report.user.id, full_name: report.user.fullName },
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };
}

async function listReports(where: Prisma.ReportWhereInput, page: number, limit: number) {
  const total = await prisma.report.count({ where });
  const meta = calculatePagination(page, limit, total);
  const items = await prisma.report.findMany({
    where,
    include: REPORT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    skip: meta.offset,
    take: meta.limit,
  });
  return { items: items.map(toReportDto), meta };
}

async function sendReportsPage(res: Response, where: Prisma.ReportWhereInput, page: number, limit: number, message: string) {
  const { items, meta } = await listReports(where, page, limit);
  return sendPaginated(res, items, meta, message);
}

// ---------------------------------------------------------------------------
// POST /api/reports — Crear reporte (autenticado)
// ---------------------------------------------------------------------------
export const createReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'No autenticado', 401);

    const result = reportCreateSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 'Datos de entrada inválidos', 400, result.error.message);
    }

    const { damage_type, ...fields } = result.data;

    // La categoría se deriva del tipo de daño: las categorías sembradas usan
    // exactamente los mismos nombres que el enum damage_type.
    const category = await prisma.category.findUnique({ where: { name: damage_type } });
    if (!category) {
      return sendError(res, `No existe la categoría para el tipo de daño '${damage_type}'`, 400);
    }

    // Todo reporte inicia en "pending" (Recibido/Pendiente).
    const pendingStatus = await prisma.reportStatus.findUnique({ where: { name: 'pending' } });
    if (!pendingStatus) {
      return sendError(res, 'El estado inicial "pending" no está configurado en la BD', 500);
    }

    let created: ReportWithRelations | undefined;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await prisma.report.create({
          data: {
            referenceCode: generateReferenceCode(),
            userId: req.user.id,
            categoryId: category.id,
            statusId: pendingStatus.id,
            title: fields.title,
            description: fields.description ?? null,
            damageType: damage_type,
            severityLevel: fields.severity_level,
            latitude: fields.latitude,
            longitude: fields.longitude,
            locationAddress: fields.location_address ?? null,
            imageUrl: fields.image_url ?? null,
          },
          include: REPORT_INCLUDE,
        });
        break;
      } catch (error) {
        const collides =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          String(error.meta?.target ?? '').includes('reference_code');
        if (!collides || attempt === 4) throw error;
      }
    }

    return sendSuccess(res, toReportDto(created!), 'Reporte creado correctamente', 201);
  } catch (error) {
    console.error('Error en createReport:', (error as Error).message);
    return sendError(res);
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports — Listar con filtros (categoría, gravedad, estado)
// ---------------------------------------------------------------------------
export const getReports = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(String(req.query.page ?? '1'), 10) || 1;
    const limit = Number.parseInt(String(req.query.limit ?? '20'), 10) || 20;
    const category = asString(req.query.category);
    const severity = asString(req.query.severity);
    const status = asString(req.query.status);

    const where: Prisma.ReportWhereInput = {};

    if (category) {
      if (!DAMAGE_TYPES.includes(category as DamageTypeValue)) {
        return sendError(res, `Categoría inválida. Valores: ${DAMAGE_TYPES.join(', ')}`, 400);
      }
      where.category = { name: category };
    }
    if (severity) {
      if (!SEVERITY_LEVELS.includes(severity as SeverityValue)) {
        return sendError(res, `Severidad inválida. Valores: ${SEVERITY_LEVELS.join(', ')}`, 400);
      }
      where.severityLevel = severity as SeverityValue;
    }
    if (status) {
      if (!STATUS_NAMES.includes(status as StatusNameValue)) {
        return sendError(res, `Estado inválido. Valores: ${STATUS_NAMES.join(', ')}`, 400);
      }
      where.status = { name: status };
    }

    return sendReportsPage(res, where, page, limit, 'Reportes obtenidos correctamente');
  } catch (error) {
    console.error('Error en getReports:', (error as Error).message);
    return sendError(res);
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/mine — Reportes del usuario autenticado
// ---------------------------------------------------------------------------
export const getMyReports = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'No autenticado', 401);
    const page = Number.parseInt(String(req.query.page ?? '1'), 10) || 1;
    const limit = Number.parseInt(String(req.query.limit ?? '20'), 10) || 20;
    return sendReportsPage(res, { userId: req.user.id }, page, limit, 'Tus reportes obtenidos correctamente');
  } catch (error) {
    console.error('Error en getMyReports:', (error as Error).message);
    return sendError(res);
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/:id — Detalle (incluye historial de estados)
// ---------------------------------------------------------------------------
export const getReportById = async (req: Request, res: Response) => {
  try {
    const id = parseReportId(req.params.id);
    if (id === null) return sendError(res, 'ID de reporte inválido', 400);

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        ...REPORT_INCLUDE,
        history: {
          orderBy: { createdAt: 'desc' },
          ...HISTORY_INCLUDE,
        },
      },
    });

    if (!report) return sendError(res, 'Reporte no encontrado', 404);

    return sendSuccess(res, {
      ...toReportDto(report),
      history: report.history.map((entry) => ({
        id: entry.id,
        comment: entry.comment,
        previous: entry.previous,
        next: entry.next,
        changed_by: { id: entry.changedBy.id, full_name: entry.changedBy.fullName },
        created_at: entry.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error en getReportById:', (error as Error).message);
    return sendError(res);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/reports/:id — Editar datos del reporte (dueño o admin)
// ---------------------------------------------------------------------------
export const updateReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'No autenticado', 401);
    const id = parseReportId(req.params.id);
    if (id === null) return sendError(res, 'ID de reporte inválido', 400);

    const result = reportUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 'Datos de entrada inválidos', 400, result.error.message);
    }

    const existing = await prisma.report.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing) return sendError(res, 'Reporte no encontrado', 404);

    if (existing.userId !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'No tienes permisos para editar este reporte', 403);
    }

    const { damage_type, ...fields } = result.data;
    const data: Prisma.ReportUncheckedUpdateInput = {};

    if (damage_type !== undefined) {
      const category = await prisma.category.findUnique({ where: { name: damage_type } });
      if (!category) {
        return sendError(res, `No existe la categoría para el tipo de daño '${damage_type}'`, 400);
      }
      data.categoryId = category.id;
      data.damageType = damage_type;
    }
    if (fields.title !== undefined) data.title = fields.title;
    if (fields.description !== undefined) data.description = fields.description ?? null;
    if (fields.severity_level !== undefined) data.severityLevel = fields.severity_level;
    if (fields.latitude !== undefined) data.latitude = fields.latitude;
    if (fields.longitude !== undefined) data.longitude = fields.longitude;
    if (fields.location_address !== undefined) data.locationAddress = fields.location_address ?? null;
    if (fields.image_url !== undefined) data.imageUrl = fields.image_url ?? null;

    const updated = await prisma.report.update({
      where: { id },
      data,
      include: REPORT_INCLUDE,
    });

    return sendSuccess(res, toReportDto(updated), 'Reporte actualizado correctamente');
  } catch (error) {
    console.error('Error en updateReport:', (error as Error).message);
    return sendError(res);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/reports/:id/status — Cambiar estado (requiere rol "admin")
// Inserta una fila en report_history cuando el estado cambia. Transaccional.
// ---------------------------------------------------------------------------
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'No autenticado', 401);
    const id = parseReportId(req.params.id);
    if (id === null) return sendError(res, 'ID de reporte inválido', 400);

    const result = reportStatusSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 'Datos de entrada inválidos', 400, result.error.message);
    }

    const { status, comment } = result.data;
    const nextStatus = await prisma.reportStatus.findUnique({ where: { name: status } });
    if (!nextStatus) return sendError(res, 'Estado no encontrado', 404);

    const authUser = req.user;

    const outcome = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id }, select: { statusId: true } });
      if (!report) return null;

      const changed = report.statusId !== nextStatus.id;

      const updated = await tx.report.update({
        where: { id },
        data: { statusId: nextStatus.id },
        include: REPORT_INCLUDE,
      });

      if (changed) {
        await tx.reportHistory.create({
          data: {
            reportId: id,
            previousStatusId: report.statusId,
            newStatusId: nextStatus.id,
            changedByUserId: authUser.id,
            comment: comment ?? null,
          },
        });
      }
      return { report: updated, changed };
    });

    if (!outcome) return sendError(res, 'Reporte no encontrado', 404);

    return sendSuccess(
      res,
      toReportDto(outcome.report),
      outcome.changed
        ? 'Estado del reporte actualizado correctamente'
        : 'El reporte ya estaba en ese estado'
    );
  } catch (error) {
    console.error('Error en updateReportStatus:', (error as Error).message);
    return sendError(res);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/reports/:id — Eliminar reporte (requiere rol "admin")
// ---------------------------------------------------------------------------
export const deleteReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'No autenticado', 401);
    if (req.user.role !== 'admin') {
      return sendError(res, 'No tienes permisos para eliminar reportes', 403);
    }

    const id = parseReportId(req.params.id);
    if (id === null) return sendError(res, 'ID de reporte inválido', 400);

    const existing = await prisma.report.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return sendError(res, 'Reporte no encontrado', 404);

    await prisma.report.delete({ where: { id } });
    return sendSuccess(res, { id }, 'Reporte eliminado correctamente');
  } catch (error) {
    console.error('Error en deleteReport:', (error as Error).message);
    return sendError(res);
  }
};
