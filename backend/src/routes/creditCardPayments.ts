import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getStatementDetails,
  payFullStatement,
  payMsiInstallment,
  revertStatementPayment
} from '../controllers/creditCardPaymentsController';

const router = express.Router();

router.use(authMiddleware);

// Get detailed statement for a credit card
router.get('/statement/:accountId', getStatementDetails);

// Pay full statement (all MSI + regular purchases for current cycle)
router.post('/pay-statement/:accountId', payFullStatement);

// Pay individual MSI installment
router.post('/pay-msi/:installmentId', payMsiInstallment);

// Revert/undo a statement payment
router.post('/revert/:transactionId', revertStatementPayment);

export default router;
