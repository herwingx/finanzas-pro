import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useApi';
import { TransactionType, Category } from '../types';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { IconSelector } from '../components/IconSelector';
import { CategorySelector } from '../components/CategorySelector';

const ICONS = ['category', 'shopping_cart', 'restaurant', 'lunch_dining', 'local_cafe', 'directions_car', 'local_gas_station', 'flight', 'hotel', 'home', 'apartment', 'cottage', 'payments', 'savings', 'account_balance', 'credit_card', 'school', 'science', 'sports_esports', 'fitness_center', 'movie', 'music_note', 'medical_services', 'local_hospital', 'pets', 'stroller', 'checkroom', 'watch', 'diamond', 'work', 'business_center', 'build', 'star', 'favorite', 'bolt', 'receipt_long', 'redeem', 'local_offer'];
const DEFAULT_CATEGORY_STATE = { name: '', icon: 'category', color: '#6B5FFF', type: 'expense' as TransactionType, budgetType: undefined };

const COLORS = ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#6B5FFF', '#FF9F1C', '#FF477E', '#34D399', '#60A5FA'];

const CategoryForm: React.FC<any> = ({ category, setCategory, onSubmit, isSaving, formTitle, onCancel }) => {
    const handleBudgetTypeToggle = (type: 'need' | 'want' | 'savings') => {
        setCategory({ ...category, budgetType: category.budgetType === type ? undefined : type });
    };

    return (
        <div className="bg-app-card rounded-2xl border border-app-border p-4 mb-6 shadow-premium animate-scale-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">{formTitle}</h3>
                <button onClick={onCancel} className="p-1 text-app-muted hover:text-app-text"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                {/* Preview */}
                <div className="flex justify-center mb-2">
                    <div
                        className="size-16 rounded-2xl flex items-center justify-center shadow-lg transition-all"
                        style={{ backgroundColor: category.color }}
                    >
                        <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: '"FILL" 1' }}>
                            {category.icon}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Nombre</label>
                        <input type="text" placeholder="Ej: Comida" value={category.name} onChange={e => setCategory({ ...category, name: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl bg-app-elevated border border-app-border text-sm" />
                    </div>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {COLORS.map(color => (
                            <button
                                type="button"
                                key={color}
                                onClick={() => setCategory({ ...category, color })}
                                className={`size-8 rounded-full transition-all ${category.color === color
                                    ? 'ring-2 ring-offset-2 ring-offset-app-card ring-app-text scale-110'
                                    : 'hover:scale-110'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <input
                            type="color"
                            value={category.color}
                            onChange={e => setCategory({ ...category, color: e.target.value })}
                            className="size-8 rounded-full border-2 border-dashed border-app-border bg-transparent cursor-pointer"
                            title="Color personalizado"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Icono</label>
                    <IconSelector
                        icons={ICONS}
                        selectedIcon={category.icon}
                        selectedColor={category.color}
                        onSelect={(icon) => setCategory({ ...category, icon })}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Tipo</label>
                    <div className="flex bg-app-elevated p-1 rounded-xl border border-app-border">
                        <button type="button" onClick={() => setCategory({ ...category, type: 'expense' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${category.type === 'expense' ? 'bg-app-card text-app-danger shadow-sm border border-app-border' : 'text-app-muted'}`}>Gasto</button>
                        <button type="button" onClick={() => setCategory({ ...category, type: 'income', budgetType: undefined })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${category.type === 'income' ? 'bg-app-card text-app-success shadow-sm border border-app-border' : 'text-app-muted'}`}>Ingreso</button>
                    </div>
                </div>

                {category.type === 'expense' && (
                    <div>
                        <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Clasificación 50/30/20 (Opcional)</label>
                        <div className="flex bg-app-elevated p-1 rounded-xl border border-app-border">
                            {[{ id: 'need', label: '50% Necesidad', color: 'text-blue-500' }, { id: 'want', label: '30% Deseo', color: 'text-purple-500' }, { id: 'savings', label: '20% Ahorro', color: 'text-green-500' }].map(type => (
                                <button key={type.id} type="button" onClick={() => handleBudgetTypeToggle(type.id as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${category.budgetType === type.id ? `bg-app-card ${type.color} shadow-sm border border-app-border` : 'text-app-muted'}`}>{type.label}</button>
                            ))}
                        </div>
                    </div>
                )}
                <button type="submit" disabled={isSaving} className="btn-modern btn-primary w-full py-3 font-bold text-sm shadow-premium mt-2 disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar'}</button>
            </form>
        </div>
    );
};

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const addCategoryMutation = useAddCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const [showForm, setShowForm] = useState(false);
    const [formState, setFormState] = useState<Omit<Category, 'id'>>(DEFAULT_CATEGORY_STATE);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [reassigningDelete, setReassigningDelete] = useState<Category | null>(null);
    const [reassignTargetId, setReassignTargetId] = useState<string>('');

    const reassignCategories = useMemo(() => {
        if (!reassigningDelete || !categories) return [];
        return categories.filter(c => c.id !== reassigningDelete.id && c.type === reassigningDelete.type);
    }, [reassigningDelete, categories]);

    const handleOpenForm = (category: Category | null) => {
        setEditingCategory(category);
        setFormState(category ? { ...category } : DEFAULT_CATEGORY_STATE);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCategory(null);
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateCategoryMutation.mutateAsync({ id: editingCategory.id, category: formState });
                toast.success("Categoría actualizada");
            } else {
                await addCategoryMutation.mutateAsync(formState);
                toast.success("Categoría creada");
            }
            handleCancel();
        } catch (error: any) {
            toast.error(error.message || "Error guardando categoría");
        }
    };

    const handleInitialDelete = async (category: Category) => {
        try {
            await deleteCategoryMutation.mutateAsync({ id: category.id });
            toastSuccess('Categoría eliminada');
        } catch (error: any) {
            if (error.message === 'in-use') {
                setReassigningDelete(category);
            } else {
                toast.error(error.message || 'Error al eliminar');
            }
        }
    };

    const handleReassignAndDelete = async () => {
        if (!reassigningDelete || !reassignTargetId) return;
        try {
            await deleteCategoryMutation.mutateAsync({ id: reassigningDelete.id, newCategoryId: reassignTargetId });
            toastSuccess('Categoría reasignada y eliminada');
            setReassigningDelete(null);
            setReassignTargetId('');
        } catch (error: any) {
            toast.error(error.message || 'Error al reasignar');
        }
    };

    const renderCategoryList = (title: string, catList: Category[]) => (
        <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-app-elevated/50 border-b border-app-border flex justify-between items-center">
                <h3 className="font-bold text-xs">{title}</h3>
                <span className="text-[10px] font-bold bg-app-elevated px-2 py-0.5 rounded-full text-app-muted border border-app-border">{catList.length}</span>
            </div>
            <div className="divide-y divide-app-border">
                {catList.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 p-3">
                        <div
                            className="size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                        >
                            <span className="material-symbols-outlined text-lg text-white" style={{ fontVariationSettings: '"FILL" 1' }}>{cat.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm truncate block">{cat.name}</span>
                            {cat.budgetType && (
                                <span className={`text-[10px] font-medium ${cat.budgetType === 'need' ? 'text-blue-500' :
                                    cat.budgetType === 'want' ? 'text-purple-500' : 'text-green-500'
                                    }`}>
                                    {cat.budgetType === 'need' ? '50% Necesidad' : cat.budgetType === 'want' ? '30% Deseo' : '20% Ahorro'}
                                </span>
                            )}
                        </div>
                        <button onClick={() => handleOpenForm(cat)} className="p-1.5 rounded-md hover:bg-app-elevated transition-colors"><span className="material-symbols-outlined text-base">edit</span></button>
                        <button onClick={() => handleInitialDelete(cat)} className="p-1.5 rounded-md hover:bg-app-elevated transition-colors"><span className="material-symbols-outlined text-base text-app-danger">delete</span></button>
                    </div>
                ))}
                {catList.length === 0 && (
                    <div className="p-6 text-center text-app-muted text-sm">
                        No hay categorías de {title.toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-app-bg text-app-text relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>
            <PageHeader title="Categorías" />
            <div className="p-4 max-w-lg mx-auto space-y-6">
                <div className="flex justify-end">
                    {!showForm && <button onClick={() => handleOpenForm(null)} className="btn-modern bg-app-primary/10 text-app-primary text-xs font-bold px-3 py-1.5 hover:bg-app-primary hover:text-white transition-all shadow-none hover:shadow-md">Añadir Nueva</button>}
                </div>
                {showForm && <CategoryForm category={formState} setCategory={setFormState} onSubmit={handleAddOrUpdate} isSaving={addCategoryMutation.isPending || updateCategoryMutation.isPending} formTitle={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'} onCancel={handleCancel} />}
                {isLoadingCategories ? <SkeletonTransactionList count={6} /> :
                    <div className="space-y-4">
                        {renderCategoryList('Gastos', categories?.filter(c => c.type === 'expense') || [])}
                        {renderCategoryList('Ingresos', categories?.filter(c => c.type === 'income') || [])}
                    </div>
                }
            </div>

            {/* Reassign Modal with CategorySelector */}
            {reassigningDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card rounded-2xl p-6 max-w-sm w-full shadow-lg border border-app-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="size-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: reassigningDelete.color }}
                            >
                                <span className="material-symbols-outlined text-xl text-white" style={{ fontVariationSettings: '"FILL" 1' }}>
                                    {reassigningDelete.icon}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Reasignar y Eliminar</h3>
                                <p className="text-sm text-app-muted">"{reassigningDelete.name}"</p>
                            </div>
                        </div>

                        <p className="text-sm text-app-muted mb-4">
                            Esta categoría tiene transacciones. Selecciona otra categoría para moverlas antes de eliminar.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-app-muted mb-2 uppercase">Mover a:</label>
                            <CategorySelector
                                categories={reassignCategories}
                                selectedId={reassignTargetId}
                                onSelect={setReassignTargetId}
                                emptyMessage="No hay otras categorías disponibles"
                                columns={4}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setReassigningDelete(null); setReassignTargetId(''); }} className="btn-modern btn-ghost px-4 py-2 font-semibold text-sm">Cancelar</button>
                            <button onClick={handleReassignAndDelete} disabled={!reassignTargetId || deleteCategoryMutation.isPending} className="btn-modern bg-app-danger text-white hover:bg-app-danger/90 px-4 py-2 font-semibold text-sm disabled:opacity-50 border-none shadow-md">{deleteCategoryMutation.isPending ? 'Eliminando...' : 'Reasignar y Eliminar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;