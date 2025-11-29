import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Category } from '../types';
import { Link } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import toast from 'react-hot-toast';

const CategoryForm = ({
  category, onSave, onClose, onDelete,
}: {
  category?: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) => {
  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState<'expense' | 'income'>(category?.type || 'expense');
  const [icon, setIcon] = useState(category?.icon || 'receipt_long');
  const [color, setColor] = useState(category?.color || '#7f1d1d');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: category?.id || crypto.randomUUID(), name, type, icon, color });
  };

  const ICONS = ['home', 'shopping_cart', 'receipt_long', 'restaurant', 'local_mall', 'directions_car', 'flight', 'school', 'health_and_safety', 'work', 'savings', 'credit_card', 'payment', 'paid', 'redeem'];
  const COLORS = ['#7f1d1d', '#9a3412', '#a16207', '#4d7c0f', '#15803d', '#047857', '#0f766e', '#0e7490', '#0369a1', '#1d4ed8', '#4338ca', '#6d28d9', '#7e22ce', '#9333ea', '#be185d', '#9f1239'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
      <div className="bg-app-card w-full max-w-sm rounded-2xl p-6 relative border border-app-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-app-muted"><span className="material-symbols-outlined">close</span></button>
        <h2 className="text-xl font-bold mb-6 text-app-text">{category ? 'Editar' : 'Nueva'} Categoría</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (resto del formulario sin cambios) ... */}
          <div className="flex gap-4 pt-4">
            {category && onDelete && (
              <button type="button" onClick={() => onDelete(category.id)} className="w-full py-3 bg-app-danger/20 text-app-danger font-bold rounded-lg hover:bg-app-danger/30">Eliminar</button>
            )}
            <button type="submit" className="w-full py-3 bg-app-primary text-white font-bold rounded-lg hover:bg-opacity-80">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Categories = () => {
  const categories = useStorage(StorageService.getCategories, 'category');
  const [view, setView] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleSave = (category: Category) => {
    const isUpdating = !!selectedCategory;
    if (isUpdating) {
      StorageService.updateCategory(category);
    } else {
      StorageService.saveCategory(category);
    }
    toast.success(`Categoría ${isUpdating ? 'actualizada' : 'guardada'}`);
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleAddNew = () => { setSelectedCategory(null); setIsModalOpen(true); };
  const handleEdit = (category: Category) => { setSelectedCategory(category); setIsModalOpen(true); };
  const handleDelete = (id: string) => {
    StorageService.deleteCategory(id);
    toast.success('Categoría eliminada');
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const filteredCategories = categories.filter(c => c.type === view);

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-app-bg/90 backdrop-blur p-4 border-b border-app-border">
        <Link to="/more" className="text-app-text"><span className="material-symbols-outlined">arrow_back_ios_new</span></Link>
        <h1 className="font-bold text-lg">Categorías</h1>
        <div className="w-8"></div>
      </header>

      {/* ... (resto del componente sin cambios) ... */}
    </div>
  );
};
