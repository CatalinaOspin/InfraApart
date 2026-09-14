import app from './app';
import { connectDB, disconnectDB } from './config/database';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function startServer(): Promise<void> {
  try {
    // 1) Verificar la conexión con PostgreSQL (PostGIS)
    await connectDB();

    // 2) Levantar el servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('============================================');
      console.log('  🚧 InfraApart API Server');
      console.log(`  📍 Puerto: ${PORT}`);
      console.log(`  🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  🔗 http://localhost:${PORT}/api/health`);
      console.log('============================================');
    });

    // 3) Cierre ordenado: libera el pool de Prisma
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} recibido, cerrando servidor...`);
      server.close();
      await disconnectDB();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(
      '🚨 No se pudo iniciar el servidor:',
      (error as Error).message
    );
    process.exit(1);
  }
}

startServer();
