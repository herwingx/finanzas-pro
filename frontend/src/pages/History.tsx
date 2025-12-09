import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../types';
import { useTransactions, useCategories, useDeleteTransaction, useAccounts } from '../hooks/useApi';
import { toast } from 'sonner';
import { PageHeader } from '../components/PageHeader';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const deleteTransactionMutation = useDeleteTransaction();

  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

  const sortedTxs = useMemo(() => {
    return transactions ? [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  }, [transactions]);

  const getCategoryInfo = (id: string | null) => categories?.find(c => c.id === id) || { icon: 'sell', color: '#999', name: 'General' };
  const getAccountName = (id: string | null) => accounts?.find(a => a.id === id)?.name || 'Cuenta desconocida';

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTransactionMutation.mutateAsync(itemToDelete.id);
      toast.success('Transacción eliminada');
      setItemToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar.');
    }
  };

  const grouped = sortedTxs.reduce((groups, tx) => {
    const date = new Date(tx.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const isLoading = isLoadingTransactions || isLoadingCategories || isLoadingAccounts;

  return (
    <div className="pb-28 bg-app-bg min-h-screen text-app-text">
      <PageHeader title="Historial" />

      {isLoading ? <div className="p-8 text-center">Cargando...</div> :
        <div className="px-4 py-2 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="pt-20 text-center text-app-muted">No hay transacciones.</div>
          ) : (
            Object.keys(grouped).map(date => (
              <div key={date}>
                <h3 className="text-sm font-bold my-3 sticky top-16 bg-app-bg py-2 z-10">{date}</h3>
                <div className="space-y-3">
                  {grouped[date].map(tx => {
                    if (tx.type === 'transfer') {
                      return (
                        <div key={tx.id} className="flex items-center gap-4 bg-app-card p-3 rounded-xl">
                          <div onClick={() => navigate(`/new?editId=${tx.id}`)} className="flex items-center gap-4 flex-1 cursor-pointer">
                            <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#88888820' }}>
                              <span className="material-symbols-outlined text-app-muted">swap_horiz</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">Transferencia</p>
                              <p className="text-xs text-app-muted truncate">
                                {getAccountName(tx.accountId)} → {getAccountName(tx.destinationAccountId)}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-app-muted">{tx.amount.toFixed(2)}</p>
                          <button onClick={() => setItemToDelete(tx)} className="p-2 text-app-muted hover:text-app-danger"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                      );
                    }

                    const category = getCategoryInfo(tx.categoryId);
                    const isInitialMsi = tx.installmentPurchaseId && tx.type === 'expense';

                    return (
                      <div key={tx.id} className="flex items-center gap-4 bg-app-card p-3 rounded-xl">
                        <div onClick={() => {
                          if (isInitialMsi) {
                            toast('Administra esta compra desde la sección "Meses Sin Intereses"', { icon: 'ℹ️' });
                            return;
                          }
                          navigate(`/new?editId=${tx.id}`);
                        }} className="flex items-center gap-4 flex-1 cursor-pointer">
                          <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}20` }}>
                            <span className="material-symbols-outlined" style={{ color: category.color }}>{category.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{tx.description}</p>
                            <div className="flex items-center gap-2">
                              {tx.recurringTransactionId && <span className="material-symbols-outlined text-xs text-app-muted" title="Recurrente">repeat</span>}
                              {tx.installmentPurchaseId && <span className="text-[10px] font-bold text-app-primary bg-app-primary/10 px-1.5 py-0.5 rounded-md">MSI</span>}
                              <p className="text-xs text-app-muted">{category.name}</p>
                            </div>                          </div>
                        </div>
                        <p className={`font-bold ${tx.type === 'income' ? 'text-app-success' : ''}`}>{tx.type === 'expense' ? '-' : '+'}{tx.amount.toFixed(2)}</p>
                        <button onClick={() => {
                          if (isInitialMsi) {
                            toast('Administra esta compra desde la sección "Meses Sin Intereses"', { icon: 'ℹ️' });
                            return;
                          }
                          setItemToDelete(tx);
                        }} className="p-2 text-app-muted hover:text-app-danger"><span className="material-symbols-outlined">delete</span></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      }

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-app-card rounded-lg p-6 m-4">
            <h2 className="text-lg font-bold mb-4">Confirmar Eliminación</h2>
            <p>¿Seguro que quieres eliminar "{itemToDelete.description}"?</p>

            {itemToDelete.installmentPurchaseId && (itemToDelete.type === 'income' || itemToDelete.type === 'transfer') && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl text-sm">
                <p className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Advertencia de Integridad
                </p>
                <p className="mt-1">
                  Este es un pago de un plan a Meses Sin Intereses. Al eliminarlo:
                </p>
                <ul className="list-disc list-inside mt-1 ml-1 opacity-90">
                  <li>El dinero regresará a tu cuenta de origen.</li>
                  <li>La deuda en tu tarjeta de crédito aumentará.</li>
                  <li>El plan MSI retrocederá en progreso.</li>
                </ul>
                <p className="mt-2 font-bold">
                  Solo elimina esto si fue un error de captura reciente. Si ya ocurrió en tu banco, borrarlo desajustará tus saldos reales.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded bg-app-danger text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
