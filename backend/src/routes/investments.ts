
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment
} from '../controllers/investmentsController';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', getInvestments);
router.get('/:id', getInvestment);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;
