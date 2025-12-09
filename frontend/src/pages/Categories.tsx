import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useApi';
import { TransactionType, Category } from '../types';
import { toast } from 'sonner';
import { PageHeader } from '../components/PageHeader';

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
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Nombre</label>
                        <input type="text" placeholder="Ej: Comida" value={category.name} onChange={e => setCategory({ ...category, name: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl bg-app-elevated border border-app-border text-sm" />
                    </div>
                    <div className="flex flex-col items-center">
                        <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Color</label>
                        <input type="color" value={category.color} onChange={e => setCategory({ ...category, color: e.target.value })} className="w-10 h-10 rounded-full border-2 border-app-border bg-app-elevated cursor-pointer" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Icono</label>
                    <div className="grid grid-cols-7 gap-2 bg-app-elevated p-2 rounded-xl border border-app-border">
                        {ICONS.map(icon => (
                            <button type="button" key={icon} onClick={() => setCategory({ ...category, icon })} className={`aspect-square rounded-lg flex items-center justify-center transition-all ${category.icon === icon ? 'bg-app-primary text-white' : 'hover:bg-app-card'}`}>
                                <span className="material-symbols-outlined text-xl">{icon}</span>
                            </button>
                        ))}
                    </div>
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
                        <label className="block text-[10px] font-bold text-app-muted mb-1.5 uppercase">Clasificación (Opcional)</label>
                        <div className="flex bg-app-elevated p-1 rounded-xl border border-app-border">
                            {[{ id: 'need', label: 'Necesidad' }, { id: 'want', label: 'Deseo' }, { id: 'savings', label: 'Ahorro' }].map(type => (
                                <button key={type.id} type="button" onClick={() => handleBudgetTypeToggle(type.id as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${category.budgetType === type.id ? 'bg-app-card text-app-primary shadow-sm border border-app-border' : 'text-app-muted'}`}>{type.label}</button>
                            ))}
                        </div>
                    </div>
                )}
                <button type="submit" disabled={isSaving} className="w-full py-3 bg-app-primary text-white font-bold text-sm rounded-xl disabled:opacity-50 mt-2">{isSaving ? 'Guardando...' : 'Guardar'}</button>
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
            toast.success('Categoría eliminada');
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
            toast.success('Categoría reasignada y eliminada');
            setReassigningDelete(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al reasignar');
        }
    };

    const renderCategoryList = (title: string, catList: Category[]) => (
        <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-app-elevated/50 border-b border-app-border flex justify-between items-center"><h3 className="font-bold text-xs">{title}</h3><span className="text-[10px] font-bold bg-app-elevated px-2 py-0.5 rounded-full text-app-muted border border-app-border">{catList.length}</span></div>
            <div className="divide-y divide-app-border">
                {catList.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 p-3">
                        <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}><span className="material-symbols-outlined text-lg">{cat.icon}</span></div>
                        <span className="flex-1 font-medium text-sm truncate">{cat.name}</span>
                        <button onClick={() => handleOpenForm(cat)} className="p-1.5 rounded-md hover:bg-app-elevated"><span className="material-symbols-outlined text-base">edit</span></button>
                        <button onClick={() => handleInitialDelete(cat)} className="p-1.5 rounded-md hover:bg-app-elevated"><span className="material-symbols-outlined text-base text-app-danger">delete</span></button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="pb-24 bg-app-bg min-h-screen text-app-text">
            <PageHeader title="Categorías" />
            <div className="p-4 max-w-lg mx-auto space-y-6">
                <div className="flex justify-end">
                    {!showForm && <button onClick={() => handleOpenForm(null)} className="text-xs font-bold text-app-primary bg-app-primary/10 px-3 py-1.5 rounded-lg">Añadir Nueva</button>}
                </div>
                {showForm && <CategoryForm category={formState} setCategory={setFormState} onSubmit={handleAddOrUpdate} isSaving={addCategoryMutation.isPending || updateCategoryMutation.isPending} formTitle={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'} onCancel={handleCancel} />}
                {isLoadingCategories ? <p>Cargando...</p> :
                    <div className="space-y-4">
                        {renderCategoryList('Gastos', categories?.filter(c => c.type === 'expense') || [])}
                        {renderCategoryList('Ingresos', categories?.filter(c => c.type === 'income') || [])}
                    </div>
                }
            </div>

            {reassigningDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card rounded-2xl p-6 max-w-sm w-full shadow-lg border border-app-border">
                        <h3 className="text-lg font-bold mb-2">Reasignar y Eliminar</h3>
                        <p className="text-sm text-app-muted mb-6">"{reassigningDelete.name}" tiene transacciones. Mueve sus transacciones a otra categoría para poder eliminarla.</p>
                        <select value={reassignTargetId} onChange={(e) => setReassignTargetId(e.target.value)} className="w-full p-3 bg-app-elevated rounded-xl border border-app-border text-sm mb-6">
                            <option value="">Selecciona una categoría...</option>
                            {categories?.filter(c => c.id !== reassigningDelete.id && c.type === reassigningDelete.type).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setReassigningDelete(null)} className="px-4 py-2 rounded-lg font-semibold text-sm">Cancelar</button>
                            <button onClick={handleReassignAndDelete} disabled={!reassignTargetId || deleteCategoryMutation.isPending} className="px-4 py-2 rounded-lg font-semibold text-sm bg-app-danger text-white disabled:opacity-50">{deleteCategoryMutation.isPending ? 'Eliminando...' : 'Reasignar y Eliminar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;