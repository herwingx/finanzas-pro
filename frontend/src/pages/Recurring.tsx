import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import {
    useRecurringTransactions,
    useCategories,
    useDeleteRecurringTransaction,
    useAccounts
} from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SkeletonRecurring } from '../components/Skeleton';

// Utils & Types
import { toastSuccess, toastError } from '../utils/toast';
import { formatDateUTC, isDateBeforeUTC } from '../utils/dateUtils';

/* ==================================================================================
   SUB-COMPONENT: DETAIL SHEET
   ================================================================================== */
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
    const isIncome = item.type === 'income';

    return (
        <SwipeableBottomSheet isOpen={true} onClose={onClose}>
            <div className="pt-2 pb-6 px-4">

                {/* 1. HEADER & AMOUNT */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="size-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-sm border border-black/5"
                        style={{ backgroundColor: `${category?.color || '#999'}20`, color: category?.color || '#999' }}
                    >
                        <span className="material-symbols-outlined text-[32px]">{category?.icon || 'refresh'}</span>
                    </div>

                    <h2 className="text-xl font-bold text-app-text text-center px-4 leading-tight">{item.description}</h2>
                    <p className={`text-3xl font-black font-numbers mt-2 tracking-tight ${isIncome ? 'text-emerald-500' : 'text-app-text'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                    </p>
                    <div className={`mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-app-subtle text-app-muted'}`}>
                        {getFrequencyLabel(item.frequency)}
                    </div>
                </div>

                {/* 2. STATUS GRID */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {/* Status Box */}
                    <div className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border ${isOverdue ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900' : 'bg-app-subtle border-app-border'}`}>
                        <p className={`text-[10px] uppercase font-bold ${isOverdue ? 'text-rose-600' : 'text-app-muted'}`}>
                            {isOverdue ? '⚠️ Vencido Desde' : '📅 Próximo Cobro'}
                        </p>
                        <p className={`font-bold text-sm ${isOverdue ? 'text-rose-700 dark:text-rose-400' : 'text-app-text'}`}>
                            {formatDateUTC(nextDue, { month: 'short', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Account Box */}
                    <div className="bg-app-subtle p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border border-app-border">
                        <p className="text-[10px] uppercase font-bold text-app-muted">Cuenta Origen</p>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-app-text truncate max-w-full">
                            <span className="material-symbols-outlined text-xs opacity-50">account_balance</span>
                            {account?.name || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* 3. ALERT / END DATE */}
                {item.endDate && (
                    <div className="mb-8 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800">
                        <span className="material-symbols-outlined text-amber-500 mt-0.5">event_busy</span>
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Finaliza pronto</p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                                La recurrencia termina el <strong>{formatDateUTC(new Date(item.endDate), { style: 'long' })}</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* 4. ACTIONS */}
                <div className="hidden md:grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { onClose(); onEdit(); }}
                        className="h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined">edit</span>
                        Editar
                    </button>
                    <button
                        onClick={() => { onClose(); onDelete(); }}
                        className="h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/10 dark:border-rose-900 dark:text-rose-400 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined">delete</span>
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
const Recurring: React.FC = () => {
    const { openRecurringSheet } = useGlobalSheets();
    const isMobile = useIsMobile();

    // Data Hooks
    const { data: recurring, isLoading } = useRecurringTransactions();
    const { data: categories } = useCategories();
    const { data: accounts } = useAccounts();
    const deleteMutation = useDeleteRecurringTransaction();

    // Local State
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    // Helpers
    const getCategory = (id: string) => categories?.find(c => c.id === id);
    const getAccount = (id: string) => accounts?.find(a => a.id === id);
    const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    const getFrequencyLabel = (freq: string) => {
        const labels: any = {
            'daily': 'Diario', 'weekly': 'Semanal', 'biweekly': 'Cada 2 sem',
            'monthly': 'Mensual', 'yearly': 'Anual'
        };
        return labels[freq?.toLowerCase()] || freq;
    };

    // Derived List
    const { list: sortedList, incomeCount, expenseCount } = useMemo(() => {
        if (!recurring) return { list: [], incomeCount: 0, expenseCount: 0 };

        const inc = recurring.filter(t => t.type === 'income').length;
        const exp = recurring.filter(t => t.type === 'expense').length;

        let filtered = recurring;
        if (filterType !== 'all') filtered = recurring.filter(t => t.type === filterType);

        // Sort: Overdue -> Soonest -> Later
        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.nextDueDate).getTime();
            const dateB = new Date(b.nextDueDate).getTime();
            const now = Date.now();

            // Prioritize overdue items
            if (dateA < now && dateB > now) return -1;
            if (dateA > now && dateB < now) return 1;

            return dateA - dateB;
        });

        return { list: sorted, incomeCount: inc, expenseCount: exp };
    }, [recurring, filterType]);


    /* Handlers */
    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            toastSuccess('Recurrencia eliminada');
            setDeletingId(null);
        } catch (e) { toastError('Error al eliminar'); }
    };

    if (isLoading) return (
        <div className="min-h-dvh bg-app-bg">
            <PageHeader title="Gastos Fijos" />
            <div className="p-4"><SkeletonRecurring /></div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text font-sans">
            <PageHeader title="Suscripciones y Fijos" showBackButton />

            <div className="max-w-3xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-20">

                {/* 1. TOP ACTIONS ROW */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {/* Custom Tab Filter Pill */}
                        <div className="flex bg-app-subtle p-1 rounded-xl shadow-inner">
                            {[
                                { id: 'all', icon: 'list', count: recurring?.length },
                                { id: 'expense', icon: 'remove', count: expenseCount },
                                { id: 'income', icon: 'add', count: incomeCount }
                            ].map((f: any) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterType(f.id)}
                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${filterType === f.id
                                        ? 'bg-app-surface shadow-sm text-app-text'
                                        : 'text-app-muted hover:text-app-text'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{f.icon}</span>
                                    {f.count > 0 && <span>{f.count}</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => openRecurringSheet()}
                        className="size-10 bg-app-text text-app-bg rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-[22px]">add</span>
                    </button>
                </div>

                {/* 2. LIST */}
                <div className="space-y-3">
                    {sortedList.length > 0 ? sortedList.map(item => {
                        const category = getCategory(item.categoryId);
                        const nextDue = new Date(item.nextDueDate);
                        const isOverdue = isDateBeforeUTC(nextDue, new Date());
                        const isIncome = item.type === 'income';

                        return (
                            <SwipeableItem
                                key={item.id}
                                leftAction={{ icon: 'edit', color: 'text-white', bgColor: 'bg-indigo-500', label: 'Editar' }}
                                rightAction={{ icon: 'delete', color: 'text-white', bgColor: 'bg-rose-500', label: 'Borrar' }}
                                onSwipeRight={() => { setSelectedItem(null); setTimeout(() => openRecurringSheet(item), 50); }}
                                onSwipeLeft={() => setDeletingId(item.id)}
                                className="rounded-3xl"
                                disabled={!isMobile}
                            >
                                <div
                                    onClick={() => setSelectedItem(item)}
                                    className={`
                                        bento-card p-4 relative overflow-hidden bg-app-surface cursor-pointer active:scale-[0.99] transition-all hover:border-app-border-strong
                                        ${isOverdue ? 'border-l-4 border-l-rose-500' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        {/* Icon & Main Info */}
                                        <div className="flex items-start gap-3.5">
                                            <div
                                                className="size-11 shrink-0 rounded-2xl flex items-center justify-center border border-black/5 shadow-sm"
                                                style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">{category?.icon || 'event'}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-app-text truncate max-w-[150px] md:max-w-xs">{item.description}</h3>
                                                <p className="text-[11px] text-app-muted flex items-center gap-1.5 mt-0.5">
                                                    <span className="capitalize">{getFrequencyLabel(item.frequency)}</span>
                                                    <span className="size-1 rounded-full bg-app-border" />
                                                    <span className={`font-bold ${isOverdue ? 'text-rose-500' : ''}`}>
                                                        {formatDateUTC(nextDue, { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <p className={`font-bold font-numbers ${isIncome ? 'text-emerald-500' : 'text-app-text'}`}>
                                                {formatCurrency(item.amount)}
                                            </p>
                                            {isOverdue && (
                                                <span className="inline-block mt-1 text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded">VENCIDO</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SwipeableItem>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <span className="material-symbols-outlined text-4xl mb-2 text-app-muted">calendar_off</span>
                            <p className="text-sm font-medium text-app-muted">Sin recurrencias registradas.</p>
                        </div>
                    )}
                </div>

                {/* 3. DETAILS MODAL */}
                {selectedItem && (
                    <RecurringDetailSheet
                        item={selectedItem}
                        category={getCategory(selectedItem.categoryId)}
                        account={getAccount(selectedItem.accountId)}
                        onClose={() => setSelectedItem(null)}
                        onEdit={() => { setSelectedItem(null); openRecurringSheet(selectedItem); }}
                        onDelete={() => { setSelectedItem(null); setDeletingId(selectedItem.id); }}
                        formatCurrency={formatCurrency}
                        getFrequencyLabel={getFrequencyLabel}
                    />
                )}

                {/* 4. CONFIRM DELETE */}
                {deletingId && (
                    <DeleteConfirmationSheet
                        isOpen={true}
                        onClose={() => setDeletingId(null)}
                        onConfirm={handleDeleteConfirm}
                        itemName="esta recurrencia"
                        warningMessage="Detener cobro recurrente"
                        isDeleting={deleteMutation.isPending}
                    />
                )}

            </div>
        </div>
    );
};

export default Recurring;