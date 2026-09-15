import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  updateReportStatus,
  deleteReport,
  getMyReports,
} from '../controllers/reportController';
import { authenticateToken, roleMiddleware } from '../middlewares/auth';

const router = Router();

/**
 * Todas las rutas de reportes exigen un JWT válido (authenticateToken).
 * El cambio de estado y la eliminación además requieren rol "admin".
 * Nota: `/mine` debe registrarse antes que `/:id` para no ser capturada.
 */
router.use(authenticateToken);

router.post('/', createReport);
router.get('/', getReports);
router.get('/mine', getMyReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.patch('/:id/status', roleMiddleware(['admin']), updateReportStatus);
router.delete('/:id', roleMiddleware(['admin']), deleteReport);

export default router;