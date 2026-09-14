/**
 * diagnose-postgis.js
 * Diagnóstico temporal: localiza la extensión PostGIS, el search_path
 * y el estado de triggers/seeds en la BD (Supabase).
 * Uso: node scripts/diagnose-postgis.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const postgis = await prisma.$queryRaw`
    SELECT extname, extnamespace::regnamespace::text AS schema,
           extversion, extconfig::text AS config
    FROM pg_extension WHERE extname = 'postgis'`;

  const searchPath = await prisma.$queryRaw`SHOW search_path`;

  const stFunctions = await prisma.$queryRaw`
    SELECT n.nspname AS schema, count(*)::int AS functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN ('st_makepoint', 'st_setsrid')
    GROUP BY n.nspname`;

  const triggers = await prisma.$queryRaw`
    SELECT c.relname::text AS table_name, count(*)::int AS triggers
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE NOT t.tgisinternal
    GROUP BY c.relname ORDER BY 1`;

  const seeds = await prisma.$queryRaw`
    SELECT (SELECT count(*)::int FROM categories) AS categories,
           (SELECT count(*)::int FROM report_statuses) AS report_statuses`;

  console.log(
    JSON.stringify(
      {
        postgis_extension: postgis,
        search_path: searchPath,
        st_functions: stFunctions,
        triggers: triggers,
        seeds: seeds,
      },
      null,
      2
    )
  );
})()
  .catch((error) => {
    console.error('DIAG_FAIL:', error?.message ?? String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());