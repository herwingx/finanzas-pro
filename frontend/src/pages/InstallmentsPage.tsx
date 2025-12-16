import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useInstallmentPurchases, useProfile, useDeleteInstallmentPurchase } from '../hooks/useApi';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonAccountList } from '../components/Skeleton';

const InstallmentsPage: React.FC = () => {
    const { data: purchases, isLoading, isError } = useInstallmentPurchases();
    const { data: profile } = useProfile();
    const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
    const navigate = useNavigate();
    const deleteMutation = useDeleteInstallmentPurchase();

    // Helper: Formato de Moneda
    const formatCurrency = useMemo(() => (value: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: profile?.currency || 'USD', minimumFractionDigits: 0 }).format(value);
    }, [profile?.currency]);

    // Lógica de Tabs
    const activePurchases = useMemo(() => purchases?.filter(p => p.paidAmount < p.totalAmount) || [], [purchases]);
    const settledPurchases = useMemo(() => purchases?.filter(p => p.paidAmount >= p.totalAmount) || [], [purchases]);
    const displayedPurchases = useMemo(() => activeTab === 'active' ? activePurchases : settledPurchases, [activeTab, activePurchases, settledPurchases]);

    // Handle Delete (Confirmación Moderna)
    const handleDelete = (purchase: any) => {
        const isSettled = (purchase.totalAmount - purchase.paidAmount) <= 0.05;

        toast.custom((t) => (
            <div className="bg-app-surface border border-app-border rounded-xl shadow-xl max-w-sm w-full p-4 font-sans animate-fade-in">
                <div className="flex gap-4">
                    <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">delete_forever</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-app-text">¿Eliminar Plan MSI?</h4>
                        <p className="text-xs text-app-muted mt-1 leading-relaxed">
                            Esto eliminará "{purchase.description}" y sus {purchase.paidInstallments} pagos registrados de tu contabilidad.
                        </p>

                        {isSettled && (
                            <div className="mt-2 text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 px-2 py-1 rounded-md font-bold">
                                ⚠️ Este plan ya estaba liquidado.
                            </div>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-app-muted hover:bg-app-subtle transition-colors">Cancelar</button>
                            <button onClick={async () => {
                                toast.dismiss(t);
                                try {
                                    await deleteMutation.mutateAsync(purchase.id);
                                    toastSuccess('Plan eliminado');
                                } catch (error) { toastError('Error eliminando'); }
                            }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition-colors">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: Infinity });
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
                <PageHeader title="Mis Planes MSI" showBackButton={true} />
                <div className="max-w-3xl mx-auto px-4 pt-4">
                    <SkeletonAccountList />
                </div>
            </div>
        );
    }

    if (isError) return <div className="p-8 text-center text-rose-500">Error cargando datos.</div>;

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title="Mis Planes MSI" showBackButton={true} />

            <div className="max-w-3xl mx-auto px-4 pt-4">

                {/* Section Header with Add Button */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Planes Activos</h2>
                    <button
                        onClick={() => navigate('/installments/new')}
                        className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Nuevo Plan</span>
                    </button>
                </div>

                {/* Modern Tabs (Segmented Control) */}
                <div className="bg-app-subtle p-1 rounded-xl flex mb-6 mx-auto max-w-xs">
                    {(['active', 'settled'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-app-surface text-app-text shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-app-muted hover:text-app-text'}`}
                        >
                            {tab === 'active' ? 'Activos' : 'Liquidados'}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {displayedPurchases.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-app-muted opacity-60">
                            <span className="material-symbols-outlined text-4xl mb-3">credit_card_off</span>
                            <p className="text-sm font-medium">No hay planes {activeTab === 'active' ? 'activos' : 'liquidados'}</p>
                        </div>
                    ) : (
                        displayedPurchases.map(purchase => {
                            const remaining = purchase.totalAmount - purchase.paidAmount;
                            const percent = (purchase.paidInstallments / purchase.installments) * 100;

                            return (
                                <SwipeableItem
                                    key={purchase.id}
                                    onSwipeRight={() => navigate(`/installments/edit/${purchase.id}?mode=edit`)}
                                    leftAction={{ icon: 'edit', color: 'var(--app-primary)', label: 'Editar' }}
                                    onSwipeLeft={() => handleDelete(purchase)}
                                    rightAction={{ icon: 'delete', color: '#ef4444', label: 'Eliminar' }}
                                    className="mb-3" // Margen para la tarjeta swipeable
                                >
                                    <div
                                        onClick={() => navigate(`/installments/edit/${purchase.id}`)}
                                        className="group bg-app-surface border border-app-border rounded-2xl p-4 md:p-5 hover:border-app-border/80 transition-all active:scale-[0.99] cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 size-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                                    <span className="material-symbols-outlined text-[18px]">credit_score</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-app-text group-hover:text-app-primary transition-colors">{purchase.description}</h3>
                                                    <p className="text-xs text-app-muted">{purchase.account?.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-app-text tabular-nums">{formatCurrency(purchase.monthlyPayment)}</p>
                                                <p className="text-[10px] text-app-muted font-medium">/ mes</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar & Stats */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] text-app-muted font-medium uppercase tracking-wide">
                                                <span>{purchase.paidInstallments} de {purchase.installments} cuotas</span>
                                                <span>Restante: {formatCurrency(remaining)}</span>
                                            </div>

                                            <div className="h-1.5 w-full bg-app-subtle rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                                    style={{
                                                        width: `${percent}%`,
                                                        backgroundColor: activeTab === 'active' ? 'var(--app-primary)' : 'var(--text-muted)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SwipeableItem>
                            );
                        })
                    )}
                </div>

                {/* Spacer for safe bottom */}
                <div className="h-16" />
            </div>
        </div>
    );
};

export default InstallmentsPage;