import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useDeleteCategory } from '../hooks/useApi';
import { Category } from '../types';
import { toastSuccess, toastError } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { SwipeableItem } from '../components/SwipeableItem';
import { CategorySelector } from '../components/CategorySelector';
import { Button } from '../components/Button';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { getValidIcon } from '../utils/icons';

// ============== CATEGORY DETAIL SHEET ==============
const CategoryDetailSheet = ({
    category,
    onClose,
    onEdit,
    onDelete
}: {
    category: Category | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    if (!category) return null;

    const budgetLabels: Record<string, string> = {
        need: 'Necesidad (50%)',
        NEEDS: 'Necesidad (50%)',
        want: 'Deseo (30%)',
        WANTS: 'Deseo (30%)',
        savings: 'Ahorro (20%)',
        SAVINGS: 'Ahorro (20%)'
    };

    return (
        <SwipeableBottomSheet isOpen={!!category} onClose={onClose}>
            <div className="text-center mb-6">
                <div
                    className="size-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-sm"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                    <span className="material-symbols-outlined">{getValidIcon(category.icon)}</span>
                </div>
                <h2 className="text-xl font-bold text-app-text">{category.name}</h2>
                <p className="text-sm text-app-muted capitalize">{category.type === 'expense' ? 'Gasto' : 'Ingreso'}</p>
            </div>

            {/* Info Card */}
            <div className="bg-app-subtle rounded-2xl p-5 mb-6 border border-app-border/50">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest mb-1">Tipo</p>
                        <p className="text-sm font-semibold text-app-text capitalize">
                            {category.type === 'expense' ? 'Gasto' : 'Ingreso'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest mb-1">Regla 50/30/20</p>
                        <p className="text-sm font-semibold text-app-text">
                            {category.budgetType ? budgetLabels[category.budgetType] || category.budgetType : 'Sin asignar'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="hidden md:flex gap-3">
                <button
                    onClick={onEdit}
                    className="flex-1 py-3.5 rounded-xl bg-app-primary text-white font-bold shadow-lg shadow-app-primary/25 hover:bg-app-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Editar
                </button>
                <button
                    onClick={onDelete}
                    className="py-3.5 px-5 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-bold hover:opacity-80 transition-opacity flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        </SwipeableBottomSheet>
    );
};

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const { data: categories, isLoading } = useCategories();
    const deleteMutation = useDeleteCategory();

    // Reassignment Modal State
    const [reassignData, setReassignData] = useState<{ categoryToDelete: Category } | null>(null);
    const [reassignTargetId, setReassignTargetId] = useState<string>('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<Category | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Derived Data
    const expenses = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);
    const incomes = useMemo(() => categories?.filter(c => c.type === 'income') || [], [categories]);
    const reassignList = useMemo(() =>
        categories?.filter(c => (reassignData || deleteConfirmation) && c.type === (reassignData?.categoryToDelete.type || deleteConfirmation?.type) && c.id !== (reassignData?.categoryToDelete.id || deleteConfirmation?.id)) || []
        , [categories, reassignData, deleteConfirmation]);

    // Handlers
    const handleEdit = (cat: Category) => {
        navigate(`/categories/edit/${cat.id}`);
    };

    const handleDeleteClick = (category: Category) => {
        setDeleteConfirmation(category);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        try {
            await deleteMutation.mutateAsync({ id: deleteConfirmation.id });
            toastSuccess('Categoría eliminada');
            setDeleteConfirmation(null);
        } catch (error: any) {
            setDeleteConfirmation(null);
            if (error.message === 'in-use') {
                setReassignData({ categoryToDelete: deleteConfirmation });
            } else {
                toastError(error.message);
            }
        }
    };

    const handleReassignConfirm = async () => {
        if (!reassignData || !reassignTargetId) return;
        try {
            await deleteMutation.mutateAsync({ id: reassignData.categoryToDelete.id, newCategoryId: reassignTargetId });
            toastSuccess('Categoría eliminada y reasignada');
            setReassignData(null);
            setReassignTargetId('');
        } catch (e: any) { toastError(e.message); }
    };

    // Render Category List with Swipe
    const renderList = (title: string, list: Category[]) => (
        <div className="mb-6">
            <h3 className="text-xs font-bold text-app-muted uppercase mb-3 ml-2 tracking-wide flex items-center gap-2">
                {title} <span className="bg-app-subtle px-1.5 rounded text-[10px]">{list.length}</span>
            </h3>

            <div className="space-y-2">
                {list.map(cat => (
                    <SwipeableItem
                        key={cat.id}
                        onSwipeRight={() => handleEdit(cat)}
                        leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                        onSwipeLeft={() => handleDeleteClick(cat)}
                        rightAction={{ icon: 'delete', color: '#ef4444', label: 'Borrar' }}
                        className="rounded-2xl"
                    >
                        <div
                            onClick={() => setSelectedCategory(cat)}
                            className="bg-app-surface border border-app-border rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer hover:border-app-primary/30 active:scale-[0.98] transition-all">
                            <div
                                className="size-11 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                            >
                                <span className="material-symbols-outlined text-[22px]">{getValidIcon(cat.icon)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-app-text truncate">{cat.name}</p>
                                {cat.budgetType && (
                                    <p className="text-[10px] text-app-muted uppercase tracking-wide">
                                        {cat.budgetType === 'need' ? 'Necesidad' : cat.budgetType === 'want' ? 'Deseo' : 'Ahorro'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </SwipeableItem>
                ))}

                {list.length === 0 && (
                    <div className="bg-app-surface border border-app-border rounded-2xl p-6 text-center text-xs text-app-muted">
                        No hay categorías de este tipo.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title="Categorías" showBackButton />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Section Header with Add Button */}
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Gestionar Categorías</h2>
                    <button
                        onClick={() => navigate('/categories/new')}
                        className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Nueva</span>
                    </button>
                </div>

                {isLoading ? <SkeletonTransactionList count={8} /> : (
                    <>
                        {renderList('Gastos', expenses)}
                        {renderList('Ingresos', incomes)}
                    </>
                )}

                {/* Tip */}
                <div className="mt-6 p-4 bg-app-subtle/50 rounded-2xl border border-app-border flex items-start gap-3">
                    <span className="material-symbols-outlined text-app-muted text-xl shrink-0">swipe</span>
                    <p className="text-xs text-app-muted leading-relaxed">
                        <strong className="text-app-text">Tip:</strong> Desliza a la derecha para editar o a la izquierda para eliminar una categoría.
                    </p>
                </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirmation && (
                <DeleteConfirmationSheet
                    isOpen={!!deleteConfirmation}
                    onClose={() => setDeleteConfirmation(null)}
                    onConfirm={confirmDelete}
                    itemName={deleteConfirmation.name}
                    warningMessage="¿Eliminar categoría?"
                    warningDetails={['Se te pedirá reasignar las transacciones si existen movimientos asociados.']}
                    isDeleting={deleteMutation.isPending}
                />
            )}

            {/* Reassign Modal */}
            {reassignData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-app-surface rounded-3xl p-6 shadow-2xl animate-scale-in border border-app-border">
                        <div className="text-center mb-5">
                            <div className="size-12 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-2xl">warning</span>
                            </div>
                            <h3 className="text-lg font-bold text-app-text">Categoría en Uso</h3>
                            <p className="text-sm text-app-muted mt-1 leading-snug">
                                <span className="font-semibold text-app-text">"{reassignData.categoryToDelete.name}"</span> tiene movimientos asociados. Elige dónde moverlos para continuar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-app-muted block mb-2 text-center">
                                    Nueva categoría destino
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-app-border rounded-xl custom-scrollbar p-2">
                                    <CategorySelector
                                        categories={reassignList}
                                        selectedId={reassignTargetId}
                                        onSelect={setReassignTargetId}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setReassignData(null); setReassignTargetId(''); }}
                                    fullWidth
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="danger"
                                    disabled={!reassignTargetId || deleteMutation.isPending}
                                    onClick={handleReassignConfirm}
                                    isLoading={deleteMutation.isPending}
                                    fullWidth
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Detail Sheet */}
            <CategoryDetailSheet
                category={selectedCategory}
                onClose={() => setSelectedCategory(null)}
                onEdit={() => {
                    if (selectedCategory) {
                        handleEdit(selectedCategory);
                        setSelectedCategory(null);
                    }
                }}
                onDelete={() => {
                    if (selectedCategory) {
                        handleDeleteClick(selectedCategory);
                        setSelectedCategory(null);
                    }
                }}
            />
        </div>
    );
};

export default Categories;