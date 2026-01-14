import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { useCategories, useDeleteCategory } from '../hooks/useApi';

// Components
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { SwipeableItem } from '../components/SwipeableItem';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { CategorySelector } from '../components/CategorySelector';
import { Button } from '../components/Button';

// Utils
import { toastSuccess, toastError } from '../utils/toast';
import { getValidIcon } from '../utils/icons';
import { Category } from '../types';

/* ==================================================================================
   SUB-COMPONENT: DETAIL SHEET (Quick View)
   ================================================================================== */
const CategoryDetailSheet = ({ category, onClose, onEdit, onDelete }: any) => {
    if (!category) return null;

    const typeMap = {
        'need': { label: 'Necesidad (50%)', color: 'bg-emerald-500', text: 'text-emerald-600' },
        'want': { label: 'Deseo (30%)', color: 'bg-purple-500', text: 'text-purple-600' },
        'savings': { label: 'Ahorro (20%)', color: 'bg-amber-500', text: 'text-amber-600' },
    } as any;

    // Normalize budget type keys
    const rawKey = category.budgetType?.toLowerCase();
    const budgetInfo = typeMap[rawKey] || { label: 'Sin Clasificar', color: 'bg-gray-400', text: 'text-app-muted' };

    return (
        <SwipeableBottomSheet isOpen={!!category} onClose={onClose}>
            <div className="pt-2 pb-6 px-4">

                {/* 1. Header Hero */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="size-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-sm border border-black/5"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                        <span className="material-symbols-outlined text-[40px]">{getValidIcon(category.icon)}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-app-text tracking-tight text-center leading-tight mb-1">{category.name}</h2>
                    <span className="px-3 py-0.5 bg-app-subtle border border-app-border rounded-full text-[10px] uppercase font-bold tracking-wider text-app-muted">
                        {category.type === 'expense' ? 'Gasto' : 'Ingreso'}
                    </span>
                </div>

                {/* 2. Rule Info */}
                {category.type === 'expense' && (
                    <div className="bento-card bg-app-subtle/50 p-4 flex items-center gap-4 mb-6 border-app-border/50">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${budgetInfo.text} bg-white dark:bg-black`}>
                            <div className={`size-3 rounded-full ${budgetInfo.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-app-muted tracking-wide mb-0.5">Regla de Presupuesto</p>
                            <p className="text-base font-bold text-app-text">{budgetInfo.label}</p>
                        </div>
                    </div>
                )}

                {/* 3. Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { onClose(); onEdit(); }}
                        className="h-12 flex items-center justify-center gap-2 rounded-xl bg-app-surface border border-app-border text-sm font-bold text-app-text hover:bg-app-subtle active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                    </button>
                    <button
                        onClick={() => { onClose(); onDelete(); }}
                        className="h-12 flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 text-sm font-bold text-rose-600 dark:text-rose-400 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        </SwipeableBottomSheet>
    );
};

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */

const Categories: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { openCategorySheet } = useGlobalSheets();

    // Query & Mutation
    const { data: categories, isLoading } = useCategories();
    const deleteMutation = useDeleteCategory();

    // Local UI State
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null); // For Confirmation Sheet

    // Reassignment State
    const [reassignSource, setReassignSource] = useState<Category | null>(null); // If failed deletion
    const [reassignTargetId, setReassignTargetId] = useState('');

    // Derived Lists
    const { expenses, incomes } = useMemo(() => ({
        expenses: categories?.filter(c => c.type === 'expense') || [],
        incomes: categories?.filter(c => c.type === 'income') || []
    }), [categories]);

    // Derived List for Reassign (Excluding source)
    const reassignList = useMemo(() => {
        if (!reassignSource) return [];
        return categories?.filter(c => c.type === reassignSource.type && c.id !== reassignSource.id) || [];
    }, [categories, reassignSource]);


    // Handlers
    useEffect(() => {
        if (searchParams.get('action') === 'new') openCategorySheet();
    }, [searchParams, openCategorySheet]);

    const handleEdit = (cat: Category) => openCategorySheet(cat);

    // Step 1: Request Deletion
    const handleDeleteClick = (cat: Category) => setDeleteTarget(cat);

    // Step 2: Confirm Deletion -> Try API
    const executeDelete = async () => {
        if (!deleteTarget) return;
        const target = deleteTarget;

        // Optimistic UI closure
        setDeleteTarget(null);

        try {
            await deleteMutation.mutateAsync({ id: target.id });
            toastSuccess('Categoría eliminada');
        } catch (e: any) {
            // Step 3: Handle Constraint Error (Need Reassign)
            if (e.message === 'in-use' || e.message.includes('foreign key')) {
                setReassignSource(target); // Trigger Reassign Modal
            } else {
                toastError('No se pudo eliminar');
            }
        }
    };

    // Step 4: Execute Reassignment & Deletion
    const executeReassign = async () => {
        if (!reassignSource || !reassignTargetId) return;

        try {
            await deleteMutation.mutateAsync({
                id: reassignSource.id,
                newCategoryId: reassignTargetId
            });
            toastSuccess('Reasignado y eliminado correctamente');
            setReassignSource(null);
            setReassignTargetId('');
        } catch (e) {
            toastError('Error al reasignar');
        }
    };


    const renderGroup = (title: string, list: Category[]) => (
        <div className="mb-8 md:mb-12">
            <h3 className="px-1 mb-4 md:mb-6 text-xs font-bold text-app-muted uppercase tracking-wider flex items-center gap-2">
                {title}
                <span className="bg-app-subtle px-1.5 py-0.5 rounded text-[10px] text-app-text">{list.length}</span>
            </h3>

            <div className="space-y-3">
                {list.length > 0 ? list.map(cat => (
                    <SwipeableItem
                        key={cat.id}
                        leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                        onSwipeRight={() => handleEdit(cat)}
                        rightAction={{ icon: 'delete', color: '#F43F5E', label: 'Borrar' }}
                        onSwipeLeft={() => handleDeleteClick(cat)}
                        className="rounded-3xl"
                    >
                        <div
                            onClick={() => setSelectedCategory(cat)}
                            className="bento-card p-4 flex items-center gap-3.5 hover:border-app-border-strong cursor-pointer active:scale-[0.99] transition-all bg-app-surface"
                        >
                            <div
                                className="size-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-black/5"
                                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                            >
                                <span className="material-symbols-outlined text-[20px]">{getValidIcon(cat.icon)}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-app-text truncate">{cat.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {/* Small Dot Color */}
                                    <div className="size-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    {cat.budgetType && (
                                        <p className="text-[10px] font-medium text-app-muted uppercase tracking-wide">
                                            {cat.budgetType === 'need' ? 'Necesidad' : cat.budgetType === 'want' ? 'Deseo' : 'Ahorro'}
                                        </p>
                                    )}
                                    {!cat.budgetType && <p className="text-[10px] text-app-muted italic">General</p>}
                                </div>
                            </div>

                            <span className="material-symbols-outlined text-app-border text-lg -mr-1">chevron_right</span>
                        </div>
                    </SwipeableItem>
                )) : (
                    <div className="p-8 border-2 border-dashed border-app-border rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                        <span className="material-symbols-outlined text-3xl mb-2 text-app-muted">folder_off</span>
                        <p className="text-xs text-app-muted">Sin categorías.</p>
                    </div>
                )}
            </div>
        </div>
    );


    return (
        <div className="min-h-dvh bg-app-bg text-app-text pb-safe font-sans">

            {/* 1. Header (Floating on Desktop, Sticky on Mobile) */}
            <PageHeader
                title="Categorías"
                showBackButton
                rightAction={
                    <button onClick={() => openCategorySheet()} className="flex items-center justify-center size-8 bg-app-text text-app-bg rounded-full hover:scale-105 active:scale-95 transition-all shadow-md">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                }
            />

            {/* 2. Content */}
            <div className="max-w-xl mx-auto px-4 py-4 animate-fade-in pb-20">
                {isLoading ? <SkeletonTransactionList count={6} /> : (
                    <>
                        {renderGroup('Gastos & Egresos', expenses)}
                        {renderGroup('Ingresos & Entradas', incomes)}
                    </>
                )}

                {/* Empty Tip */}
                {!isLoading && expenses.length + incomes.length === 0 && (
                    <div className="mt-8 text-center p-6">
                        <p className="font-bold text-lg mb-2">¡Comienza!</p>
                        <p className="text-sm text-app-muted mb-4">No tienes categorías. Crea la primera para organizar tus finanzas.</p>
                        <button onClick={() => openCategorySheet()} className="btn btn-primary px-6 py-2 rounded-xl text-sm font-bold">
                            Crear Categoría
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Reassign Modal (System Native Look) */}
            {reassignSource && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-app-surface rounded-3xl p-6 shadow-2xl animate-scale-in relative border border-app-border">

                        {/* Modal Header */}
                        <div className="text-center mb-6">
                            <div className="size-14 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-3xl">move_down</span>
                            </div>
                            <h3 className="text-lg font-bold text-app-text">Mover Movimientos</h3>
                            <p className="text-sm text-app-muted mt-2 leading-relaxed">
                                <strong className="text-app-text">{reassignSource.name}</strong> contiene historial financiero. Elige un nuevo destino antes de borrarla.
                            </p>
                        </div>

                        {/* Selector Area */}
                        <div className="space-y-4">
                            <div className="bg-app-subtle p-2 rounded-2xl border border-app-border max-h-[220px] overflow-y-auto custom-scrollbar">
                                <CategorySelector
                                    categories={reassignList}
                                    selectedId={reassignTargetId}
                                    onSelect={setReassignTargetId}
                                />
                                {reassignList.length === 0 && (
                                    <p className="text-center text-xs text-app-muted py-4">No hay otras categorías disponibles.</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setReassignSource(null); setReassignTargetId(''); }}
                                    className="flex-1 rounded-xl h-11 text-xs font-bold"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    disabled={!reassignTargetId || deleteMutation.isPending}
                                    onClick={executeReassign}
                                    className="flex-1 rounded-xl h-11 text-xs font-bold"
                                >
                                    Confirmar Mover
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Delete Confirm Sheet */}
            {deleteTarget && (
                <DeleteConfirmationSheet
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={executeDelete}
                    itemName={deleteTarget.name}
                    isDeleting={deleteMutation.isPending}
                    warningMessage={`¿Eliminar ${deleteTarget.name}?`}
                    warningDetails={["Esta acción es permanente para la categoría.", "Si hay datos, te pediremos reasignarlos."]}
                />
            )}

            {/* 5. Detail View Sheet */}
            <CategoryDetailSheet
                category={selectedCategory}
                onClose={() => setSelectedCategory(null)}
                onEdit={() => {
                    handleEdit(selectedCategory!);
                    setSelectedCategory(null);
                }}
                onDelete={() => {
                    handleDeleteClick(selectedCategory!);
                    setSelectedCategory(null);
                }}
            />

        </div>
    );
};

export default Categories;