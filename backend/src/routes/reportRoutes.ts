import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getMyReports,
} from '../controllers/reportController';

const router = Router();

router.post('/', createReport);
router.get('/', getReports);
router.get('/mine', getMyReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;