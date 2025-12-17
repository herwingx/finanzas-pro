import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecurringTransactions, useCategories, useDeleteRecurringTransaction, useAccounts } from '../hooks/useApi';
import { SwipeableItem } from '../components/SwipeableItem';
import { toastSuccess, toastError } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SkeletonRecurring } from '../components/Skeleton';
import { formatDateUTC, isDateBeforeUTC } from '../utils/dateUtils';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';

// Detail Sheet Component
const RecurringDetailSheet = ({
    item,
    category,
    account,
    onClose,
    onEdit,
    onDelete,
    formatCurrency,
    getFrequencyLabel
}: any) => {
    if (!item) return null;

    const nextDue = new Date(item.nextDueDate);
    const isOverdue = isDateBeforeUTC(nextDue, new Date());

    return (
        <SwipeableBottomSheet isOpen={!!item} onClose={onClose}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="size-14 rounded-2xl flex items-center justify-center"
                        style={{
                            backgroundColor: `${category?.color || '#999'}20`,
                            color: category?.color || '#999'
                        }}
                    >
                        <span className="material-symbols-outlined text-[28px]">
                            {category?.icon || 'refresh'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-app-text">{item.description}</h3>
                        <p className="text-xs text-app-muted capitalize">{category?.name || 'Sin categoría'}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-app-subtle rounded-full transition-colors">
                    <span className="material-symbols-outlined text-xl text-app-muted">close</span>
                </button>
            </div>

            {/* Amount */}
            <div className="text-center mb-6 py-4 bg-app-subtle rounded-2xl">
                <p className="text-xs text-app-muted uppercase font-bold mb-1">Monto</p>
                <p className={`text-3xl font-bold tabular-nums ${item.type === 'income' ? 'text-emerald-500' : 'text-app-text'}`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-app-bg border border-app-border rounded-xl p-3">
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Frecuencia</p>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-app-primary">schedule</span>
                        <p className="text-sm font-semibold text-app-text capitalize">{getFrequencyLabel(item.frequency)}</p>
                    </div>
                </div>
                <div className="bg-app-bg border border-app-border rounded-xl p-3">
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Cuenta</p>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-indigo-500">account_balance</span>
                        <p className="text-sm font-semibold text-app-text truncate">{account?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className={`col-span-2 rounded-xl p-3 border ${isOverdue ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-app-bg border-app-border'}`}>
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">
                        {isOverdue ? 'Vencido desde' : 'Próximo pago'}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-sm ${isOverdue ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {isOverdue ? 'warning' : 'event'}
                        </span>
                        <p className={`text-sm font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-app-text'}`}>
                            {formatDateUTC(nextDue, { style: 'long' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Type Badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.type === 'income'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    {item.type === 'income' ? '💰 Ingreso' : '💸 Gasto'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    🔄 Recurrente
                </span>
            </div>

        </SwipeableBottomSheet>
    );
};

const Recurring: React.FC = () => {
    // --- Routing ---
    const navigate = useNavigate();

    // --- Data Queries ---
    const { data: recurring, isLoading } = useRecurringTransactions();
    const { data: categories } = useCategories();
    const { data: accounts } = useAccounts();
    const deleteMutation = useDeleteRecurringTransaction();

    // --- Local State ---
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    // --- Helpers ---
    const getCategory = (id: string) => categories?.find(c => c.id === id);
    const getAccount = (id: string) => accounts?.find(a => a.id === id);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(val);

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            'daily': 'Diario', 'weekly': 'Semanal', 'biweekly': 'Cada 2 semanas',
            'biweekly_15_30': 'Quincenal', 'monthly': 'Mensual', 'yearly': 'Anual'
        };
        return labels[freq?.toLowerCase()] || freq;
    };

    // Sort and filter recurring transactions
    const sortedRecurring = useMemo(() => {
        if (!recurring) return [];

        // First filter by type
        let filtered = [...recurring];
        if (filterType === 'income') {
            filtered = filtered.filter(tx => tx.type === 'income');
        } else if (filterType === 'expense') {
            filtered = filtered.filter(tx => tx.type === 'expense');
        }

        // Then sort: overdue first, then by next due date (soonest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.nextDueDate);
            const dateB = new Date(b.nextDueDate);
            const now = new Date();

            const isOverdueA = isDateBeforeUTC(dateA, now);
            const isOverdueB = isDateBeforeUTC(dateB, now);

            // Overdue items first
            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;

            // Then by date (soonest first)
            return dateA.getTime() - dateB.getTime();
        });
    }, [recurring, filterType]);

    // Count by type for filter badges
    const incomeCount = recurring?.filter(tx => tx.type === 'income').length || 0;
    const expenseCount = recurring?.filter(tx => tx.type === 'expense').length || 0;

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            toastSuccess('Suscripción eliminada');
            setDeletingId(null);
            setSelectedItem(null);
        } catch (error: any) {
            toastError(error.message || "Error al eliminar");
        }
    };

    const handleEdit = (id: string) => {
        setSelectedItem(null);
        navigate(`/recurring/edit/${id}`);
    };

    const handleItemClick = (tx: any) => {
        setSelectedItem(tx);
    };

    // Show full-page skeleton while loading
    if (isLoading) return <SkeletonRecurring />;

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title="Gastos Fijos" showBackButton={true} />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Section Header with Add Button */}
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Tus Suscripciones</h2>
                    <button
                        onClick={() => navigate('/recurring/new')}
                        className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Nuevo</span>
                    </button>
                </div>

                {/* Intro Card */}
                <div className="bento-card p-5 bg-linear-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900">
                    <div className="flex gap-4">
                        <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined">event_repeat</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-app-text">Control de Suscripciones</h3>
                            <p className="text-xs text-app-muted mt-1 leading-relaxed">
                                Toca cualquier item para ver detalles. Desliza para editar o eliminar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${filterType === 'all'
                            ? 'bg-app-primary text-white shadow-sm'
                            : 'bg-app-subtle text-app-muted hover:text-app-text'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">list</span>
                        Todos
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterType === 'all' ? 'bg-white/20' : 'bg-app-border'
                            }`}>
                            {recurring?.length || 0}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilterType('income')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${filterType === 'income'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        Ingresos
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterType === 'income' ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-800'
                            }`}>
                            {incomeCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilterType('expense')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${filterType === 'expense'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">trending_down</span>
                        Gastos
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterType === 'expense' ? 'bg-white/20' : 'bg-rose-100 dark:bg-rose-800'
                            }`}>
                            {expenseCount}
                        </span>
                    </button>
                </div>

                <div className="space-y-4">
                    {sortedRecurring.length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-center opacity-50 border-2 border-dashed border-app-border rounded-3xl">
                            <span className="material-symbols-outlined text-4xl mb-3 text-app-muted">event_busy</span>
                            <p className="text-sm font-medium">Sin recurrentes</p>
                            <button
                                onClick={() => navigate('/recurring/new')}
                                className="mt-4 btn btn-secondary text-xs px-4 py-2"
                            >
                                Crear Primero
                            </button>
                        </div>
                    ) : (
                        sortedRecurring.map(tx => {
                            const category = getCategory(tx.categoryId);
                            const account = getAccount(tx.accountId);
                            const nextDue = new Date(tx.nextDueDate);
                            const isOverdue = isDateBeforeUTC(nextDue, new Date());

                            return (
                                <SwipeableItem
                                    key={tx.id}
                                    onSwipeLeft={() => setDeletingId(tx.id)}
                                    rightAction={{ icon: 'delete', color: '#ef4444', label: 'Borrar' }}
                                    onSwipeRight={() => handleEdit(tx.id)}
                                    leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                                    className="mb-3 rounded-2xl"
                                >
                                    <div
                                        onClick={() => handleItemClick(tx)}
                                        className={`
                                            bg-app-surface border p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform
                                            ${isOverdue ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30' : 'border-app-border hover:border-app-primary/30'}
                                        `}>
                                        <div
                                            className="size-12 rounded-2xl flex items-center justify-center shrink-0 border border-transparent"
                                            style={{
                                                backgroundColor: `${category?.color || '#999'}20`,
                                                color: category?.color || '#999',
                                                borderColor: isOverdue ? '#f43f5e' : 'transparent'
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[24px]">
                                                {isOverdue ? 'warning' : category?.icon || 'refresh'}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-app-text truncate">{tx.description}</h4>

                                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-app-muted font-medium">
                                                <span className="capitalize">{getFrequencyLabel(tx.frequency)}</span>
                                                <span>•</span>
                                                <span className="truncate max-w-[100px]">{account?.name}</span>
                                            </div>

                                            {isOverdue && (
                                                <p className="text-[10px] text-rose-500 font-bold mt-1.5">VENCIDO: {formatDateUTC(nextDue, { style: 'short' })}</p>
                                            )}
                                            {!isOverdue && (
                                                <p className="text-[10px] text-app-muted/80 mt-1">Próximo: {formatDateUTC(nextDue, { style: 'short' })}</p>
                                            )}
                                        </div>

                                        <div className="text-right flex items-center gap-2">
                                            <p className={`font-bold text-[15px] ${tx.type === 'income' ? 'text-emerald-500' : 'text-app-text'}`}>
                                                ${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                            </p>
                                            <span className="material-symbols-outlined text-app-muted text-sm">chevron_right</span>
                                        </div>
                                    </div>
                                </SwipeableItem>
                            )
                        })
                    )}
                </div>

                {/* Spacer for FAB */}
                <div className="h-16" />
            </div>

            {/* Detail Sheet */}
            {selectedItem && (
                <RecurringDetailSheet
                    item={selectedItem}
                    category={getCategory(selectedItem.categoryId)}
                    account={getAccount(selectedItem.accountId)}
                    onClose={() => setSelectedItem(null)}
                    onEdit={() => handleEdit(selectedItem.id)}
                    onDelete={() => {
                        setSelectedItem(null);
                        setDeletingId(selectedItem.id);
                    }}
                    formatCurrency={formatCurrency}
                    getFrequencyLabel={getFrequencyLabel}
                />
            )}

            {deletingId && (
                <DeleteConfirmationSheet
                    isOpen={!!deletingId}
                    onClose={() => setDeletingId(null)}
                    onConfirm={handleDelete}
                    itemName={recurring?.find(r => r.id === deletingId)?.description || "esta suscripción"}
                    warningMessage="Detener pago recurrente"
                    warningDetails={['Esto no borrará el historial pasado, solo los cobros futuros.']}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    );
};

export default Recurring;