/**
 * Prueba de conexión de extremo a extremo con la base de datos real.
 *
 * Uso:
 *   npm run db:test
 *
 * Verifica el handshake con PostgreSQL (PostGIS) y ejecuta consultas
 * ligeras contra datos reales (categorías y estados sembrados por
 * docs/database_schema.sql).
 */
import prisma from '../config/database';

async function main(): Promise<void> {
  console.log('🔌 Probando conexión con PostgreSQL (PostGIS)...');

  // 1) Handshake básico (SELECT 1)
  await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log('✅ Handshake OK (SELECT 1)');

  // 2) Consulta real: categories (seed del schema.sql)
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  console.log(`✅ categories: ${categories.length} registro(s) encontrado(s)`);
  console.table(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      isActive: c.isActive,
    }))
  );

  // 3) Consulta real: report_statuses (seed del schema.sql)
  const statuses = await prisma.reportStatus.findMany({
    orderBy: { orderIndex: 'asc' },
  });
  console.log(`✅ report_statuses: ${statuses.length} registro(s) encontrado(s)`);
  console.table(
    statuses.map((s) => ({
      id: s.id,
      name: s.name,
      label: s.label,
      orderIndex: s.orderIndex,
      isActive: s.isActive,
    }))
  );

  // 4) Conteo de usuarios (tabla vacía al inicio, valida lectura)
  const counts = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*)::int AS total FROM users
  `;
  console.log(`✅ users: ${counts[0].total} registro(s)`);

  console.log('🎉 Conexión de extremo a extremo verificada.');
}

main()
  .catch((error) => {
    console.error(
      '❌ Fallo en la prueba de conexión:',
      (error as Error).message
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔒 Conexión cerrada correctamente.');
  });