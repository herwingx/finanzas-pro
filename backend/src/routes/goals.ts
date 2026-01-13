import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  withdrawFromGoal
} from '../controllers/goalsController';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

// Actions
router.post('/:id/contribute', addContribution);
router.post('/:id/withdraw', withdrawFromGoal);

export default router;
