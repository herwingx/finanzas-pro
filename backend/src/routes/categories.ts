import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    console.log(`Fetching categories for user: ${userId}`); // Debugging line
    try {
        const categories = await prisma.category.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
        console.log(`Found ${categories.length} categories for user: ${userId}`); // Debugging line
        res.json(categories);
    } catch (error) {
        console.error("Failed to retrieve categories:", error);
        res.status(500).json({ message: 'Failed to retrieve categories.' });
    }
});

router.post('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    console.log(`Creating category for user: ${userId}`); // Debugging line
    const { name, icon, color, type, budgetType } = req.body || {};

    if (!name || !icon || !color || !type) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const newCategory = await prisma.category.create({
            data: {
                name,
                icon,
                color,
                type,
                budgetType,
                userId: userId, // Explicitly use the authenticated user's ID
            }
        });
        res.status(201).json(newCategory);
    } catch (error) {
        if ((error as any).code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ message: 'Ya existe una categoría con este nombre.' });
        }
        console.error("Failed to create category:", error);
        res.status(500).json({ message: 'Failed to create category.' });
    }
});

router.put('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, icon, color, type, budgetType } = req.body || {};

    if (!name && !icon && !color && !type && !budgetType) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        const updatedCategory = await prisma.category.updateMany({
            where: { id, userId },
            data: {
                name,
                icon,
                color,
                type,
                budgetType,
            },
        });

        if (updatedCategory.count === 0) {
            return res.status(404).json({ message: 'Category not found or you do not have permission to update it.' });
        }
        
        const category = await prisma.category.findFirst({ where: { id, userId } });
        res.json(category);

    } catch (error) {
        if ((error as any).code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ message: 'Ya existe una categoría con este nombre.' });
        }
        res.status(500).json({ message: 'Failed to update category.' });
    }
});

router.delete('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { newCategoryId } = req.body || {}; // Safe destructuring

    try {
        // SCENARIO 1: Reassign transactions to a new category, then delete.
        if (newCategoryId) {
            await prisma.$transaction(async (tx) => {
                const oldCategory = await tx.category.findFirst({ where: { id, userId } });
                const newCategory = await tx.category.findFirst({ where: { id: newCategoryId, userId } });

                if (!oldCategory || !newCategory) {
                    throw new Error('Una de las categorías no fue encontrada o no tienes permiso.');
                }
                if (oldCategory.type !== newCategory.type) {
                    throw new Error('Las categorías deben ser del mismo tipo (ingreso/gasto).');
                }

                await tx.transaction.updateMany({ where: { categoryId: id }, data: { categoryId: newCategoryId } });
                await tx.recurringTransaction.updateMany({ where: { categoryId: id }, data: { categoryId: newCategoryId } });
                await tx.category.delete({ where: { id } });
            });
            return res.status(204).send();
        }

        // SCENARIO 2: No new category provided, check if it's safe to delete.
        const transactionsCount = await prisma.transaction.count({ where: { categoryId: id, userId } });
        const recurringCount = await prisma.recurringTransaction.count({ where: { categoryId: id, userId } });

        if (transactionsCount > 0 || recurringCount > 0) {
            return res.status(409).json({ message: 'Esta categoría tiene transacciones asociadas.' });
        }

        // SCENARIO 3: Safe to delete.
        const deletedCategory = await prisma.category.deleteMany({ where: { id, userId } });
        if (deletedCategory.count === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }
        return res.status(204).send();

    } catch (error: any) {
        if (error.message.includes('mismo tipo')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al eliminar la categoría.' });
    }
});

export default router;
