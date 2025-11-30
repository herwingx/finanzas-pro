import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const categories = await prisma.category.findMany({
            where: { userId },
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve categories.' });
    }
});

export default router;
