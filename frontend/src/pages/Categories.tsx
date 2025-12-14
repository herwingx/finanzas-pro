import React, { useState, useMemo } from 'react';
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useApi';
import { TransactionType, Category } from '../types';
import { toastSuccess, toastError } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { IconSelector } from '../components/IconSelector'; // Assumed exists and refined
import { CategorySelector } from '../components/CategorySelector';
import { ToggleButtonGroup, Button } from '../components/Button'; // New Button components

// Presets (Simplified for cleaner code)
const DEFAULT_CATEGORY_STATE = { name: '', icon: 'category', color: '#6B5FFF', type: 'expense' as TransactionType, budgetType: undefined };
const COLORS = ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#6B5FFF', '#FF9F1C', '#FF477E', '#34D399', '#60A5FA'];
const ICONS = ['category', 'shopping_cart', 'restaurant', 'local_cafe', 'directions_car', 'flight', 'home', 'payments', 'school', 'fitness_center', 'movie', 'medical_services', 'pets', 'work', 'star']; // Reduced set for brevity

// --- Sub-component: Form ---
const CategoryForm: React.FC<any> = ({ category, setCategory, onSubmit, isSaving, onCancel }) => {
    return (
        <div className="bg-app-surface border border-app-border rounded-2xl p-5 mb-6 animate-scale-in shadow-lg">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-app-text">{category.id ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-app-subtle text-app-muted hover:text-app-text transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">

                {/* Name & Preview Row */}
                <div className="flex gap-4">
                    <div className="size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-transparent transition-all"
                        style={{ backgroundColor: category.color, color: 'white' }}>
                        <span className="material-symbols-outlined text-3xl">{category.icon}</span>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-app-muted uppercase mb-1.5 block pl-1">Nombre</label>
                        <input
                            type="text"
                            placeholder="Ej: Restaurantes"
                            value={category.name}
                            onChange={e => setCategory({ ...category, name: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-app-bg border border-app-border text-sm focus:ring-2 focus:ring-app-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Type Selector */}
                <div>
                    <label className="text-[10px] font-bold text-app-muted uppercase mb-1.5 block pl-1">Tipo de transacción</label>
                    <ToggleButtonGroup
                        options={[
                            { value: 'expense', label: 'Gastos' },
                            { value: 'income', label: 'Ingresos' }
                        ]}
                        value={category.type}
                        onChange={(val) => setCategory({ ...category, type: val as any })}
                    />
                </div>

                {/* Colors Grid */}
                <div>
                    <label className="text-[10px] font-bold text-app-muted uppercase mb-2 block pl-1">Color</label>
                    <div className="flex flex-wrap gap-2.5">
                        {COLORS.map(color => (
                            <button
                                type="button" key={color}
                                onClick={() => setCategory({ ...category, color })}
                                className={`size-8 rounded-full transition-transform duration-200 ${category.color === color ? 'ring-2 ring-offset-2 ring-offset-app-surface ring-app-text scale-110' : 'hover:scale-110 active:scale-95'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div className="relative">
                            <input
                                type="color"
                                value={category.color}
                                onChange={e => setCategory({ ...category, color: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="size-8 rounded-full border-2 border-dashed border-app-muted/50 flex items-center justify-center hover:border-app-muted hover:bg-app-subtle transition-colors">
                                <span className="material-symbols-outlined text-[14px] text-app-muted">add</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget 50/30/20 (Expenses Only) */}
                {category.type === 'expense' && (
                    <div>
                        <label className="text-[10px] font-bold text-app-muted uppercase mb-1.5 block pl-1">Regla 50/30/20</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'need', label: 'Necesidad (50%)' },
                                { id: 'want', label: 'Deseo (30%)' },
                                { id: 'savings', label: 'Ahorro (20%)' }
                            ].map(b => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => setCategory({ ...category, budgetType: category.budgetType === b.id ? undefined : b.id })}
                                    className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg border transition-all ${category.budgetType === b.id
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                                        : 'bg-app-subtle border-transparent text-app-muted hover:border-app-border'
                                        }`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <Button type="submit" isLoading={isSaving} fullWidth variant="primary">Guardar Categoría</Button>
                </div>
            </form>
        </div>
    );
};

const Categories: React.FC = () => {
    // --- Hooks & State ---
    const { data: categories, isLoading } = useCategories();
    const addMutation = useAddCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formState, setFormState] = useState<any>(DEFAULT_CATEGORY_STATE);

    // Reassignment Logic
    const [reassignData, setReassignData] = useState<{ categoryToDelete: Category } | null>(null);
    const [reassignTargetId, setReassignTargetId] = useState<string>('');

    // --- Derived Data ---
    const expenses = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);
    const incomes = useMemo(() => categories?.filter(c => c.type === 'income') || [], [categories]);
    const reassignList = useMemo(() =>
        categories?.filter(c => reassignData && c.type === reassignData.categoryToDelete.type && c.id !== reassignData.categoryToDelete.id) || []
        , [categories, reassignData]);

    // --- Handlers ---
    const handleOpenForm = (cat?: Category) => {
        if (cat) {
            setEditingCategory(cat);
            setFormState({ ...cat });
        } else {
            setEditingCategory(null);
            setFormState(DEFAULT_CATEGORY_STATE);
        }
        setIsFormOpen(true);
        // Scroll top logic could go here
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateMutation.mutateAsync({ id: editingCategory.id, category: formState });
                toastSuccess('Categoría actualizada');
            } else {
                await addMutation.mutateAsync(formState);
                toastSuccess('Categoría creada');
            }
            handleCloseForm();
        } catch (e: any) {
            toastError(e.message);
        }
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

    // --- Sub-render List ---
    const renderList = (title: string, list: Category[]) => (
        <div className="mb-6">
            <h3 className="text-xs font-bold text-app-muted uppercase mb-3 ml-2 tracking-wide flex items-center gap-2">
                {title} <span className="bg-app-subtle px-1.5 rounded text-[10px]">{list.length}</span>
            </h3>

            <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border shadow-sm">
                {list.map(cat => (
                    <div key={cat.id} className="group flex items-center justify-between p-3.5 hover:bg-app-subtle/50 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="size-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-app-text truncate">{cat.name}</p>
                                {cat.budgetType && (
                                    <p className="text-[10px] text-app-muted uppercase tracking-wide">
                                        {cat.budgetType === 'need' ? 'Necesidad' : cat.budgetType === 'want' ? 'Deseo' : 'Ahorro'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenForm(cat)} className="p-2 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => handleDeleteClick(cat)} className="p-2 rounded-lg text-app-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                ))}

                {list.length === 0 && <div className="p-6 text-center text-xs text-app-muted">No hay categorías.</div>}
            </div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title="Categorías" showBackButton={true} />

            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Section Header with Add Button */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Gestionar Categorías</h2>
                    {!isFormOpen && (
                        <button
                            onClick={() => handleOpenForm()}
                            className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            <span className="hidden sm:inline">Nueva</span>
                        </button>
                    )}
                </div>

                {isFormOpen && (
                    <CategoryForm
                        category={formState} setCategory={setFormState}
                        onSubmit={handleSubmit} isSaving={addMutation.isPending || updateMutation.isPending}
                        onCancel={handleCloseForm}
                    />
                )}

                {isLoading ? <SkeletonTransactionList count={8} /> : (
                    <>
                        {renderList('Gastos', expenses)}
                        {renderList('Ingresos', incomes)}
                    </>
                )}
            </div>

            {/* Reassign Modal */}
            {reassignData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-sm bg-app-surface rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-app-border">
                        <div className="text-center mb-5">
                            <div className="size-12 bg-app-subtle rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-app-text">move_down</span>
                            </div>
                            <h3 className="text-lg font-bold text-app-text">Categoría en Uso</h3>
                            <p className="text-sm text-app-muted mt-1 leading-snug">
                                <span className="font-semibold text-app-text">"{reassignData.categoryToDelete.name}"</span> tiene movimientos asociados. Elige dónde moverlos para continuar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-app-muted block mb-2 text-center">Nueva categoría destino</label>
                                <div className="max-h-48 overflow-y-auto border border-app-border rounded-xl custom-scrollbar p-2">
                                    <CategorySelector
                                        categories={reassignList} selectedId={reassignTargetId}
                                        onSelect={setReassignTargetId}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="secondary" onClick={() => { setReassignData(null); setReassignTargetId(''); }} fullWidth>Cancelar</Button>
                                <Button variant="danger" disabled={!reassignTargetId || deleteMutation.isPending} onClick={handleReassignConfirm} isLoading={deleteMutation.isPending} fullWidth>
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