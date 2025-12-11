import express from 'express';
import { getFinancialPeriodSummary, getUpcomingCommitments } from '../controllers/financialPlanningController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get financial period summary (quincenal/mensual/semanal)
router.get('/summary', authMiddleware, getFinancialPeriodSummary);

// Get upcoming commitments for next X days
router.get('/upcoming', authMiddleware, getUpcomingCommitments);

export default router;
