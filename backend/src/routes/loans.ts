import { Router, Response } from 'express';
import prisma from '../services/database';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Loan } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET all loans for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const loans = await prisma.loan.findMany({
      where: { userId },
      include: { account: true },
      orderBy: [
        { status: 'asc' }, // active first, then partial, then paid
        { expectedPayDate: 'asc' }, // earliest expected payment first
        { createdAt: 'desc' }
      ]
    });
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// GET loan summary (what you owe and what's owed to you)
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const loans = await prisma.loan.findMany({
      where: { userId },
    });

    const activeLoans = loans.filter((l: Loan) => l.status === 'active' || l.status === 'partial');
    const paidLoans = loans.filter((l: Loan) => l.status === 'paid');

    // Préstamos que di (me deben)
    const lentLoans = activeLoans.filter((l: Loan) => (l as any).loanType === 'lent');
    const totalOwedToMe = lentLoans.reduce((sum: number, l: Loan) => sum + l.remainingAmount, 0);

    // Préstamos que me dieron (debo)
    const borrowedLoans = activeLoans.filter((l: Loan) => (l as any).loanType === 'borrowed');
    const totalIOwe = borrowedLoans.reduce((sum: number, l: Loan) => sum + l.remainingAmount, 0);

    const totalRecovered = loans.reduce((sum: number, l: Loan) => sum + (l.originalAmount - l.remainingAmount), 0);

    res.json({
      totalLoans: loans.length,
      activeLoansCount: activeLoans.length,
      paidLoansCount: paidLoans.length,
      // Lo que me deben
      totalOwedToMe,
      lentLoansCount: lentLoans.length,
      // Lo que debo
      totalIOwe,
      borrowedLoansCount: borrowedLoans.length,
      // Balance neto
      netBalance: totalOwedToMe - totalIOwe,
      totalRecovered,
    });
  } catch (error) {
    console.error('Error fetching loan summary:', error);
    res.status(500).json({ message: 'Failed to fetch loan summary' });
  }
});

// GET single loan by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  try {
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
      include: { account: true }
    });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ message: 'Failed to fetch loan' });
  }
});

// POST create new loan
router.post('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const {
    borrowerName,
    borrowerPhone,
    borrowerEmail,
    reason,
    loanType = 'lent', // 'lent' = presté (me deben), 'borrowed' = me prestaron (debo)
    originalAmount,
    loanDate,
    expectedPayDate,
    notes,
    accountId,
    affectBalance = true
  } = req.body;

  if (!borrowerName || !originalAmount || !loanDate) {
    return res.status(400).json({
      message: 'Se requiere nombre, monto y fecha del préstamo'
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the loan
      const loan = await tx.loan.create({
        data: {
          borrowerName,
          borrowerPhone,
          borrowerEmail,
          reason,
          loanType,
          originalAmount: parseFloat(originalAmount),
          remainingAmount: parseFloat(originalAmount),
          loanDate: new Date(loanDate),
          expectedPayDate: expectedPayDate ? new Date(expectedPayDate) : null,
          notes,
          status: 'active',
          userId,
          accountId: accountId || null,
        } as any,
        include: { account: true }
      });

      const amount = parseFloat(originalAmount);

      // Create a transaction for history tracking
      if (accountId && affectBalance) {
        const account = await tx.account.findFirst({
          where: { id: accountId, userId }
        });

        if (!account) {
          throw new Error('Cuenta no encontrada');
        }

        // Create transaction for record-keeping
        const transactionType = loanType === 'lent' ? 'expense' : 'income';
        const descriptionText = loanType === 'lent'
          ? `Préstamo a ${borrowerName}`
          : `Préstamo de ${borrowerName}`;

        const finalDescription = notes ? `${descriptionText} - ${notes}` : descriptionText;

        await tx.transaction.create({
          data: {
            amount,
            description: finalDescription,
            type: transactionType,
            date: new Date(loanDate),
            userId,
            accountId,
            loanId: loan.id, // Link to loan
          } as any
        });

        // Adjust account balance
        if (loanType === 'lent') {
          // Presté dinero: mi cuenta disminuye (o deuda aumenta si es crédito)
          if (account.type === 'CREDIT') {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { increment: amount } }
            });
          } else {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { decrement: amount } }
            });
          }
        } else {
          // Me prestaron: mi cuenta aumenta (o deuda disminuye si es crédito)
          if (account.type === 'CREDIT') {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { decrement: amount } }
            });
          } else {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { increment: amount } }
            });
          }
        }
      }

      return loan;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating loan:', error);
    res.status(500).json({ message: error.message || 'Failed to create loan' });
  }
});

// PUT update loan
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  const {
    borrowerName,
    borrowerPhone,
    borrowerEmail,
    reason,
    expectedPayDate,
    notes,
    originalAmount,
    accountId,
    affectBalance = true
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingLoan = await tx.loan.findFirst({
        where: { id, userId }
      });

      if (!existingLoan) {
        throw new Error('Préstamo no encontrado');
      }

      const newOriginal = originalAmount !== undefined ? parseFloat(originalAmount) : existingLoan.originalAmount;
      const oldOriginal = existingLoan.originalAmount;
      const amountDiff = newOriginal - oldOriginal;

      // Handle remaining amount recalculation if original amount changed
      let newRemainingAmount = existingLoan.remainingAmount;
      if (originalAmount !== undefined && originalAmount !== oldOriginal) {
        const alreadyPaid = oldOriginal - existingLoan.remainingAmount;
        newRemainingAmount = Math.max(0, newOriginal - alreadyPaid);
      }

      // --- BALANCE ADJUSTMENT LOGIC ---
      if (affectBalance) {
        const oldAccountId = existingLoan.accountId;
        const newAccountId = accountId;

        // If account changed or is being set for the first time
        if (newAccountId !== undefined && newAccountId !== oldAccountId) {
          // 1. Revert Old Account (if it existed)
          if (oldAccountId) {
            const oldAcc = await tx.account.findUnique({ where: { id: oldAccountId } });
            if (oldAcc) {
              const isLent = (existingLoan as any).loanType === 'lent';
              const revertAmount = oldOriginal;
              if (isLent) {
                if (oldAcc.type === 'CREDIT') await tx.account.update({ where: { id: oldAccountId }, data: { balance: { decrement: revertAmount } } });
                else await tx.account.update({ where: { id: oldAccountId }, data: { balance: { increment: revertAmount } } });
              } else {
                if (oldAcc.type === 'CREDIT') await tx.account.update({ where: { id: oldAccountId }, data: { balance: { increment: revertAmount } } });
                else await tx.account.update({ where: { id: oldAccountId }, data: { balance: { decrement: revertAmount } } });
              }
            }
          }

          // 2. Apply to New Account (if provided)
          if (newAccountId) {
            const newAcc = await tx.account.findUnique({ where: { id: newAccountId } });
            if (newAcc) {
              const isLent = (existingLoan as any).loanType === 'lent';
              const applyAmount = newOriginal;
              if (isLent) {
                if (newAcc.type === 'CREDIT') await tx.account.update({ where: { id: newAccountId }, data: { balance: { increment: applyAmount } } });
                else await tx.account.update({ where: { id: newAccountId }, data: { balance: { decrement: applyAmount } } });
              } else {
                if (newAcc.type === 'CREDIT') await tx.account.update({ where: { id: newAccountId }, data: { balance: { decrement: applyAmount } } });
                else await tx.account.update({ where: { id: newAccountId }, data: { balance: { increment: applyAmount } } });
              }
            }
          }

          // 3. Update or Create Transaction
          const initialTx = await tx.transaction.findFirst({ where: { loanId: id, amount: oldOriginal } as any });
          if (initialTx) {
            if (newAccountId) {
              await tx.transaction.update({
                where: { id: initialTx.id },
                data: { amount: newOriginal, accountId: newAccountId }
              });
            } else {
              await tx.transaction.delete({ where: { id: initialTx.id } });
            }
          } else if (newAccountId) {
            const transactionType = (existingLoan as any).loanType === 'lent' ? 'expense' : 'income';
            const desc = (existingLoan as any).loanType === 'lent' ? `Préstamo a ${borrowerName || existingLoan.borrowerName}` : `Préstamo de ${borrowerName || existingLoan.borrowerName}`;
            await tx.transaction.create({
              data: {
                amount: newOriginal,
                description: desc,
                type: transactionType,
                date: existingLoan.loanDate,
                userId,
                accountId: newAccountId,
                loanId: id
              } as any
            });
          }
        }
        // If account is the same but amount changed
        else if (oldAccountId && Math.abs(amountDiff) > 0.01) {
          const account = await tx.account.findUnique({ where: { id: oldAccountId } });
          if (account) {
            const isLent = (existingLoan as any).loanType === 'lent';
            if (isLent) {
              if (account.type === 'CREDIT') await tx.account.update({ where: { id: oldAccountId }, data: { balance: { increment: amountDiff } } });
              else await tx.account.update({ where: { id: oldAccountId }, data: { balance: { decrement: amountDiff } } });
            } else {
              if (account.type === 'CREDIT') await tx.account.update({ where: { id: oldAccountId }, data: { balance: { decrement: amountDiff } } });
              else await tx.account.update({ where: { id: oldAccountId }, data: { balance: { increment: amountDiff } } });
            }
          }
          const initialTx = await tx.transaction.findFirst({ where: { loanId: id, amount: oldOriginal } as any });
          if (initialTx) {
            await tx.transaction.update({ where: { id: initialTx.id }, data: { amount: newOriginal } });
          }
        }
      } else {
        // --- CASE: affectBalance is FALSE ---
        // If it WAS affecting an account, we REVERT and REMOVE link
        if (existingLoan.accountId) {
          const oldAcc = await tx.account.findUnique({ where: { id: existingLoan.accountId } });
          if (oldAcc) {
            const isLent = (existingLoan as any).loanType === 'lent';
            const revertAmount = oldOriginal;
            if (isLent) {
              if (oldAcc.type === 'CREDIT') await tx.account.update({ where: { id: existingLoan.accountId }, data: { balance: { decrement: revertAmount } } });
              else await tx.account.update({ where: { id: existingLoan.accountId }, data: { balance: { increment: revertAmount } } });
            } else {
              if (oldAcc.type === 'CREDIT') await tx.account.update({ where: { id: existingLoan.accountId }, data: { balance: { increment: revertAmount } } });
              else await tx.account.update({ where: { id: existingLoan.accountId }, data: { balance: { decrement: revertAmount } } });
            }
          }
          // Delete initial transaction
          await tx.transaction.deleteMany({ where: { loanId: id, amount: oldOriginal } as any });
        }
      }

      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          borrowerName: borrowerName ?? existingLoan.borrowerName,
          borrowerPhone: borrowerPhone ?? existingLoan.borrowerPhone,
          borrowerEmail: borrowerEmail ?? existingLoan.borrowerEmail,
          reason: reason ?? existingLoan.reason,
          expectedPayDate: expectedPayDate === null
            ? null
            : (expectedPayDate ? new Date(expectedPayDate) : existingLoan.expectedPayDate),
          notes: notes ?? existingLoan.notes,
          originalAmount: originalAmount ? parseFloat(originalAmount) : undefined,
          remainingAmount: newRemainingAmount,
          accountId: affectBalance ? (accountId ?? existingLoan.accountId) : null, // IMPORTANTE: Borrar si es FALSE
        },
        include: { account: true }
      });

      return updatedLoan;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error updating loan:', error);
    res.status(500).json({ message: error.message || 'Failed to update loan' });
  }
});

// POST register payment received on a loan
router.post('/:id/payment', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  const { amount, paymentDate, notes, accountId } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Se requiere el monto del pago' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id, userId }
      });

      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      if (loan.status === 'paid') {
        throw new Error('Este préstamo ya está completamente pagado');
      }

      const paymentAmount = parseFloat(amount);
      const newRemainingAmount = Math.max(0, loan.remainingAmount - paymentAmount);
      const newStatus = newRemainingAmount <= 0.01 ? 'paid' :
        newRemainingAmount < loan.originalAmount ? 'partial' : 'active';

      // Update loan
      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
          notes: notes ? `${loan.notes || ''}\n[Pago ${new Date().toLocaleDateString()}]: ${notes}`.trim() : loan.notes
        },
        include: { account: true }
      });

      // If loan has an account or accountId is provided, add the money back
      const targetAccountId = accountId || loan.accountId;
      if (targetAccountId) {
        const account = await tx.account.findFirst({
          where: { id: targetAccountId, userId }
        });

        if (account) {
          // type: transactionType,
          // date: new Date(paymentDate || new Date()),
          // userId,
          // accountId: targetAccountId,
          // }
          // });

          const isLent = (loan as any).loanType === 'lent';
          const transactionType = isLent ? 'income' : 'expense';
          const description = isLent
            ? `Abono de ${loan.borrowerName}`
            : `Abono a ${loan.borrowerName}`;

          await tx.transaction.create({
            data: {
              amount: paymentAmount,
              description: notes ? `${description} - ${notes}` : description,
              type: transactionType,
              date: paymentDate ? new Date(paymentDate) : new Date(),
              userId,
              accountId: targetAccountId,
              loanId: id, // Link to loan
            } as any
          });

          if (isLent) {
            // Me pagan (lent): Saldo aumenta (o deuda disminuye)
            if (account.type === 'CREDIT') {
              await tx.account.update({
                where: { id: targetAccountId },
                data: { balance: { decrement: paymentAmount } }
              });
            } else {
              await tx.account.update({
                where: { id: targetAccountId },
                data: { balance: { increment: paymentAmount } }
              });
            }
          } else {
            // Yo pago (borrowed): Saldo disminuye (o deuda aumenta)
            if (account.type === 'CREDIT') {
              await tx.account.update({
                where: { id: targetAccountId },
                data: { balance: { increment: paymentAmount } }
              });
            } else {
              await tx.account.update({
                where: { id: targetAccountId },
                data: { balance: { decrement: paymentAmount } }
              });
            }
          }
        }
      }

      return updatedLoan;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error processing loan payment:', error);
    res.status(500).json({ message: error.message || 'Failed to process payment' });
  }
});

// POST mark loan as fully paid
router.post('/:id/mark-paid', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  const { accountId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id, userId }
      });

      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      if (loan.status === 'paid') {
        throw new Error('Este préstamo ya está pagado');
      }

      // Amount being marked as paid
      const remainingToPay = loan.remainingAmount;

      // Update loan as fully paid
      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          remainingAmount: 0,
          status: 'paid'
        },
        include: { account: true }
      });

      // Add remaining amount back to account and create transaction
      const targetAccountId = accountId || loan.accountId;
      if (targetAccountId && remainingToPay > 0) {
        const account = await tx.account.findFirst({
          where: { id: targetAccountId, userId }
        });

        if (account) {
          const isLent = (loan as any).loanType === 'lent';
          const transactionType = isLent ? 'income' : 'expense';
          const description = isLent
            ? `Cobro final: ${loan.borrowerName}`
            : `Pago final: ${loan.borrowerName}`;

          // Create transaction for history tracking
          await tx.transaction.create({
            data: {
              amount: remainingToPay,
              description: `Liquidación total: ${description}`,
              type: transactionType,
              date: new Date(),
              userId,
              accountId: targetAccountId,
              loanId: id,
            } as any
          });

          if (account.type === 'CREDIT') {
            await tx.account.update({
              where: { id: targetAccountId },
              data: { balance: { [isLent ? 'decrement' : 'increment']: remainingToPay } }
            });
          } else {
            await tx.account.update({
              where: { id: targetAccountId },
              data: { balance: { [isLent ? 'increment' : 'decrement']: remainingToPay } }
            });
          }
        }
      }

      return updatedLoan;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error marking loan as paid:', error);
    res.status(500).json({ message: error.message || 'Failed to mark loan as paid' });
  }
});

// DELETE a loan
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  const revertBalance = req.query.revert === 'true';

  try {
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id, userId }
      });

      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      // If reverting balance and loan has an account
      if (revertBalance && loan.accountId && loan.status !== 'paid') {
        const account = await tx.account.findFirst({
          where: { id: loan.accountId, userId }
        });

        if (account) {
          const isLent = (loan as any).loanType === 'lent';
          // Revert logic:
          // If Lent: I lose remaining asset -> Balance decreases? No, wait.
          // When I LENT, balance decreased. Deleting means getting money back?
          // Revert usually means "undo the pending state".
          // If I lent 1000 and 800 is remaining. If I delete and revert, it means I got the 800 back somehow (e.g. forgave debt or cash return).
          // Assuming "Revert" means "Cancel debt and return money to me/them".

          if (isLent) {
            // Lent money returning to me -> Increase balance
            if (account.type === 'CREDIT') {
              await tx.account.update({
                where: { id: loan.accountId },
                data: { balance: { decrement: loan.remainingAmount } }
              });
            } else {
              await tx.account.update({
                where: { id: loan.accountId },
                data: { balance: { increment: loan.remainingAmount } }
              });
            }
          } else {
            // Borrowed money leaving me -> Decrease balance
            if (account.type === 'CREDIT') {
              await tx.account.update({
                where: { id: loan.accountId },
                data: { balance: { increment: loan.remainingAmount } }
              });
            } else {
              await tx.account.update({
                where: { id: loan.accountId },
                data: { balance: { decrement: loan.remainingAmount } }
              });
            }
          }
        }
      }

      // Delete associated transactions first (to avoid constraint errors if any, though cascade should handle it ideally)
      // But we want to explicitly remove them from history
      await tx.transaction.deleteMany({
        where: { loanId: id } as any
      });

      // Delete the loan
      await tx.loan.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ message: error.message || 'Failed to delete loan' });
  }
});

export default router;
