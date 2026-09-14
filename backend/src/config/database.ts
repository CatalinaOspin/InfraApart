import { PrismaClient } from '@prisma/client';
import { config } from './env';

// ============================================
// Cliente singleton de Prisma (PostgreSQL + PostGIS)
// ============================================
const prisma = new PrismaClient({
  log: config.nodeEnv === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export { prisma };

// Datos de conexión legibles (referencia del docker-compose.yml)
export const databaseConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
};

// ============================================
// Verificación de conexión (handshake con PostgreSQL)
// ============================================
export async function connectDB(): Promise<void> {
  try {
    // Prisma utiliza internamente el pool de conexiones de PostgreSQL;
    // $queryRaw es un plan (no cachea) y ejecuta el handshake real.
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa a PostgreSQL con PostGIS');
    console.log(
      `   BD: ${config.db.name} @ ${config.db.host}:${config.db.port}`
    );
  } catch (error) {
    console.error(
      '❌ No se pudo conectar a la base de datos:',
      (error as Error).message
    );
    throw error;
  }
}

// ============================================
// Desconexión (graceful shutdown / tests)
// ============================================
export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
