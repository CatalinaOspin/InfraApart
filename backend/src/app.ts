import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './config/database';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();

// ============================================
// Middlewares globales
// ============================================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Rutas de la API
// ============================================
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/stats', statsRoutes);

// Ruta de health check: verifica el estado real de la base de datos
app.get('/api/health', async (_req, res) => {
  try {
    // Consulta ligera contra PostgreSQL (handshake real)
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      db: 'connected',
      message: 'InfraApart API funcionando correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check - BD no disponible:', (error as Error).message);
    res.status(503).json({
      status: 'degraded',
      db: 'disconnected',
      message: 'InfraApart API activa pero sin conexión a la base de datos',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================
// Manejador de rutas no encontradas
// ============================================
app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ============================================
// Manejador global de errores
// ============================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err.message);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
