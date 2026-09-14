import { Router } from 'express';
import {
  getDashboardStats,
  getReportsByCategory,
  getReportsByStatus,
  getReportsByZone,
  getReportsTrend,
} from '../controllers/statsController';

const router = Router();

router.get('/dashboard', getDashboardStats);
router.get('/by-category', getReportsByCategory);
router.get('/by-status', getReportsByStatus);
router.get('/by-zone', getReportsByZone);
router.get('/trend', getReportsTrend);

export default router;