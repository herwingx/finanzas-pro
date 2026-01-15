import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();

router.use(authMiddleware);

const defaultCategories = [
    // Expenses
    { name: 'Comida', icon: 'restaurant', color: '#FF6B6B', type: 'expense', budgetType: 'need' },
    { name: 'Transporte', icon: 'directions_car', color: '#FFD166', type: 'expense', budgetType: 'need' },
    { name: 'Vivienda', icon: 'home', color: '#06D6A0', type: 'expense', budgetType: 'need' },
    { name: 'Ocio', icon: 'sports_esports', color: '#118AB2', type: 'expense', budgetType: 'want' },
    { name: 'Salud', icon: 'medical_services', color: '#073B4C', type: 'expense', budgetType: 'need' },
    { name: 'Ahorros', icon: 'savings', color: '#6B5FFF', type: 'expense', budgetType: 'savings' },
    // Incomes
    { name: 'Salario', icon: 'payments', color: '#34D399', type: 'income' },
];

router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const userEmail = req.user!.email;

    try {
        let user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                currency: true,
                timezone: true,
                avatar: true,
                monthlyNetIncome: true,
                incomeFrequency: true,
                taxRate: true,
                notificationsEnabled: true,
                _count: { select: { categories: true } }
            }
        });

        if (!user) {
            // User doesn't exist, create them with default categories
            const newUser = await prisma.user.create({
                data: {
                    id: userId,
                    email: userEmail,
                    password: '', // Not needed
                    name: userEmail.split('@')[0] || 'New User',
                    categories: {
                        create: defaultCategories,
                    },
                },
                select: { name: true, email: true, currency: true, timezone: true, avatar: true }
            });
            return res.json(newUser);
        }

        if (user._count.categories === 0) {
            // User exists but has no categories, add them
            await prisma.category.createMany({
                data: defaultCategories.map(cat => ({ ...cat, userId })),
            });
        }

        // Refetch user data to include the new categories if they were just added
        const finalUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                currency: true,
                timezone: true,
                avatar: true,
                monthlyNetIncome: true,
                incomeFrequency: true,
                taxRate: true,
                notificationsEnabled: true,
            }
        });

        res.json(finalUser);
    } catch (error) {
        console.error("Failed to retrieve or create profile:", error);
        res.status(500).json({ message: 'Failed to retrieve or create profile.' });
    }
});

router.put('/', multer().any(), async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { name, currency, timezone, avatar, monthlyNetIncome, incomeFrequency, taxRate, notificationsEnabled } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name !== undefined ? name : undefined,
                currency: currency !== undefined ? currency : undefined,
                timezone: timezone !== undefined ? timezone : undefined,
                avatar: avatar !== undefined ? avatar : undefined,
                monthlyNetIncome: monthlyNetIncome !== undefined ? (monthlyNetIncome === null ? null : parseFloat(monthlyNetIncome)) : undefined,
                incomeFrequency: incomeFrequency !== undefined ? incomeFrequency : undefined,
                taxRate: taxRate !== undefined ? (taxRate === null ? null : parseFloat(taxRate)) : undefined,
                notificationsEnabled: notificationsEnabled !== undefined ? (typeof notificationsEnabled === 'boolean' ? notificationsEnabled : notificationsEnabled === 'true') : undefined,
            },
            select: {
                name: true,
                email: true,
                currency: true,
                timezone: true,
                avatar: true,
                monthlyNetIncome: true,
                incomeFrequency: true,
                taxRate: true,
                notificationsEnabled: true,
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Failed to update profile:", error);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
});


export default router;
