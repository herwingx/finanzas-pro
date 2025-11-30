import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // For now, we'll return a default currency and empty avatar
        const profile = {
            ...user,
            currency: 'USD',
            avatar: ''
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve profile.' });
    }
});

export default router;
