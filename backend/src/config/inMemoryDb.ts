/**
 * InfraApart - Almacén en memoria para desarrollo local SIN base de datos.
 *
 * Este módulo reemplaza temporalmente las consultas de Prisma cuando PostgreSQL
 * no está disponible (Docker apagado / Supabase no configurado).
 *
 * IMPORTANTE:
 *   - Los datos viven SOLO en la RAM del proceso de Node.js.
 *   - Al reiniciar el servidor se pierden (excepto el admin seed).
 *   - Para producción o persistencia real, levantar Docker o Supabase y
 *     dejar que Prisma se conecte normalmente (el flag `useInMemory` se pone
 *     en `false` automáticamente si la BD está disponible).
 */

import bcrypt from 'bcryptjs';

// ============================================
// Tipos internos (espejo de Prisma/schema)
// ============================================

export interface InMemoryUser {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'admin';
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Estado global en memoria
// ============================================

/** Flag que indica si el servidor usa el almacén en memoria. */
export let useInMemory = false;

export function setUseInMemory(value: boolean): void {
  useInMemory = value;
}

/** Autoincremento de IDs de usuarios. */
let nextUserId = 1;

/** Tabla `users` en memoria. */
const users: InMemoryUser[] = [];

// ============================================
// Seed inicial: usuario administrador de prueba
// ============================================

async function seedAdmin(): Promise<void> {
  const adminExists = users.some((u) => u.email === 'admin@infraapart.com');
  if (adminExists) return;

  const passwordHash = await bcrypt.hash('Admin1234', 10);
  users.push({
    id: nextUserId++,
    fullName: 'Administrador InfraApart',
    email: 'admin@infraapart.com',
    passwordHash,
    role: 'admin',
    phone: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('   🌱 Seed: admin@infraapart.com / Admin1234');
}

/** Inicializa el almacén en memoria (se llama una vez al arrancar). */
export async function initInMemoryDb(): Promise<void> {
  await seedAdmin();
  console.log('   📦 Almacén en memoria listo (datos NO persisten entre reinicios)');
}

// ============================================
// Operaciones CRUD (espejo de Prisma queries)
// ============================================

/** Equivale a prisma.user.findUnique({ where: { email } }) */
export function findUserByEmail(email: string): InMemoryUser | undefined {
  return users.find((u) => u.email === email);
}

/** Equivale a prisma.user.findUnique({ where: { id } }) */
export function findUserById(id: number): InMemoryUser | undefined {
  return users.find((u) => u.id === id);
}

/** Equivale a prisma.user.create({ data }) */
export function createUser(data: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'admin';
  phone: string | null;
}): InMemoryUser {
  const now = new Date();
  const newUser: InMemoryUser = {
    id: nextUserId++,
    fullName: data.fullName,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    phone: data.phone,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);
  return newUser;
}
