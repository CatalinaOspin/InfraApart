import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { config } from '../config/env';
import { sendError, sendSuccess } from '../utils/responses';
import { loginSchema, registerSchema } from '../utils/validators';
import {
  useInMemory,
  findUserByEmail,
  findUserById,
  createUser as createInMemoryUser,
} from '../config/inMemoryDb';
import '../types/express';

/** Rondas de salt para bcryptjs (estándar OWASP: ≥ 10). */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Usuario "seguro" para enviar al cliente: NUNCA incluye passwordHash.
 * Sigue la convención snake_case de los DTOs (src/models/index.ts).
 */
interface SafeUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toSafeUser(user: {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

/**
 * POST /api/auth/register
 * Crea un ciudadano. El rol SIEMPRE es 'citizen': aunque el cliente envíe
 * `role: "admin"`, zod lo descarta (strip) y aquí se fuerza el valor.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 'Datos de entrada inválidos', 400, result.error.message);
    }

    const { full_name, email, password, phone } = result.data;
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // ------------------------------------------------------------------
    // Modo en memoria (sin PostgreSQL)
    // ------------------------------------------------------------------
    if (useInMemory) {
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return sendError(res, 'El correo electrónico ya está registrado', 409);
      }

      const createdUser = createInMemoryUser({
        fullName: full_name,
        email,
        passwordHash,
        role: 'citizen',
        phone: phone ?? null,
      });

      return sendSuccess(res, { user: toSafeUser(createdUser) }, 'Usuario registrado correctamente', 201);
    }

    // ------------------------------------------------------------------
    // Modo normal (PostgreSQL vía Prisma)
    // ------------------------------------------------------------------

    // Email único: verificación previa para no exponer el "porqué" técnico
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'El correo electrónico ya está registrado', 409);
    }

    const createdUser = await prisma.user.create({
      data: {
        fullName: full_name,
        email,
        passwordHash,
        role: 'citizen', // bloqueo explícito de auto-asignación de roles
        phone: phone ?? null,
      },
    });

    return sendSuccess(res, { user: toSafeUser(createdUser) }, 'Usuario registrado correctamente', 201);
  } catch (error) {
    // Carrera de unicidad (dos peticiones paralelas con el mismo email)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return sendError(res, 'El correo electrónico ya está registrado', 409);
    }
    console.error('Error en register:', (error as Error).message);
    return sendError(res);
  }
};

/**
 * POST /api/auth/login
 * Valida credenciales y emite un JWT con { id, role } y expiración 24h.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 'Datos de entrada inválidos', 400, result.error.message);
    }

    const { email, password } = result.data;

    // ------------------------------------------------------------------
    // Modo en memoria (sin PostgreSQL)
    // ------------------------------------------------------------------
    if (useInMemory) {
      const memUser = findUserByEmail(email);

      if (!memUser) {
        return sendError(res, 'Credenciales inválidas', 401);
      }

      const passwordValid = await bcrypt.compare(password, memUser.passwordHash);
      if (!passwordValid) {
        return sendError(res, 'Credenciales inválidas', 401);
      }

      if (!memUser.isActive) {
        return sendError(res, 'La cuenta está desactivada', 401);
      }

      const token = jwt.sign(
        { id: memUser.id, role: memUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return sendSuccess(
        res,
        { token, user: toSafeUser(memUser) },
        'Inicio de sesión exitoso'
      );
    }

    // ------------------------------------------------------------------
    // Modo normal (PostgreSQL vía Prisma)
    // ------------------------------------------------------------------
    const user = await prisma.user.findUnique({ where: { email } });

    // Mensaje genérico: no revelar si el email existe (anti-enumeración)
    if (!user) {
      return sendError(res, 'Credenciales inválidas', 401);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return sendError(res, 'Credenciales inválidas', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'La cuenta está desactivada', 401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return sendSuccess(
      res,
      { token, user: toSafeUser(user) },
      'Inicio de sesión exitoso'
    );
  } catch (error) {
    console.error('Error en login:', (error as Error).message);
    return sendError(res);
  }
};

/**
 * GET /api/auth/profile
 * Devuelve el usuario autenticado (protegido por authenticateToken).
 * El frontend lo usa para validar/restaurar la sesión al recargar la app.
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'No autenticado', 401);
    }

    // ------------------------------------------------------------------
    // Modo en memoria (sin PostgreSQL)
    // ------------------------------------------------------------------
    if (useInMemory) {
      const memUser = findUserById(req.user.id);
      if (!memUser) {
        return sendError(res, 'Usuario no encontrado', 404);
      }
      return sendSuccess(res, toSafeUser(memUser), 'Perfil obtenido correctamente');
    }

    // ------------------------------------------------------------------
    // Modo normal (PostgreSQL vía Prisma)
    // ------------------------------------------------------------------
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }

    return sendSuccess(res, toSafeUser(user), 'Perfil obtenido correctamente');
  } catch (error) {
    console.error('Error en getProfile:', (error as Error).message);
    return sendError(res);
  }
};