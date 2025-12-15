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

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const { data: categories, isLoading } = useCategories();
    const deleteMutation = useDeleteCategory();

    // Reassignment Modal State
    const [reassignData, setReassignData] = useState<{ categoryToDelete: Category } | null>(null);
    const [reassignTargetId, setReassignTargetId] = useState<string>('');

    // Derived Data
    const expenses = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);
    const incomes = useMemo(() => categories?.filter(c => c.type === 'income') || [], [categories]);
    const reassignList = useMemo(() =>
        categories?.filter(c => reassignData && c.type === reassignData.categoryToDelete.type && c.id !== reassignData.categoryToDelete.id) || []
        , [categories, reassignData]);

    // Handlers
    const handleEdit = (cat: Category) => {
        navigate(`/categories/edit/${cat.id}`);
    };

    const handleDeleteClick = async (category: Category) => {
        try {
            await deleteMutation.mutateAsync({ id: category.id });
            toastSuccess('Categoría eliminada');
        } catch (error: any) {
            if (error.message === 'in-use') {
                setReassignData({ categoryToDelete: category });
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
                        leftAction={{ icon: 'edit', color: '#3b82f6', label: 'Editar' }}
                        onSwipeLeft={() => handleDeleteClick(cat)}
                        rightAction={{ icon: 'delete', color: '#ef4444', label: 'Borrar' }}
                    >
                        <div className="bg-app-surface border border-app-border rounded-2xl p-3.5 flex items-center gap-3.5">
                            <div
                                className="size-11 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                            >
                                <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
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
        </div>
    );
};

export default Categories;