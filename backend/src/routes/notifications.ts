import { Router } from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { SmartAlertService } from '../services/smartAlertService';

const router = Router();
router.use(authMiddleware);

// Get active notifications
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Mark as read/dismiss
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// Mark all as read
router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error updating notifications' });
  }
});

// DEBUG: Test trigger
router.post('/debug-trigger', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Fetch a real account and category for the user to make the debug notification functional
    const account = await prisma.account.findFirst({
      where: { userId, type: { in: ['DEBIT', 'CASH'] } }
    });
    const category = await prisma.category.findFirst({
      where: { userId }
    });

    const types = ['PAYMENT_DUE', 'CC_CUTOFF_NEAR', 'DUPLICATE_WARNING'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'PAYMENT_DUE') {
      await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_DUE',
          title: 'Simulación: Netflix Vence Hoy',
          body: 'Tienes un pago recurrente de $199 MXN programado para hoy.',
          data: {
            amount: 199,
            accountId: account?.id,
            categoryId: category?.id,
            description: 'Netflix (Debug)'
          }
        }
      });
    } else if (type === 'CC_CUTOFF_NEAR') {
      const cc = await prisma.account.findFirst({
        where: { userId, type: 'CREDIT' }
      });
      await prisma.notification.create({
        data: {
          userId,
          type: 'CC_CUTOFF_NEAR',
          title: `Corte de ${cc?.name || 'Tarjeta HB'} en 3 días`,
          body: 'Tus gastos del periodo suman $4,500. Recuerda que los MSI no son exigibles todavía.',
          data: { accountId: cc?.id }
        }
      });
    } else {
      await prisma.notification.create({
        data: {
          userId,
          type: 'DUPLICATE_WARNING',
          title: 'Posible Doble Cargo',
          body: 'Detectamos dos cargos de $50 en OXXO seguidos. ¿Fue un error?',
          data: {}
        }
      });
    }

    res.json({ success: true, message: 'Notification triggered' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error triggering debug notification' });
  }
});

export default router;
