import React, { useState, useEffect } from 'react';
import { Investment, InvestmentType } from '../../types';
import { useAddInvestment, useUpdateInvestment, useAccounts } from '../../hooks/useApi';
import { toastSuccess, toastError } from '../../utils/toast';

const InvestmentTypeLabel: Record<InvestmentType, string> = {
  STOCK: 'Acciones',
  CRYPTO: 'Cripto',
  BOND: 'Bonos',
  FUND: 'Fondos',
  ETF: 'ETFs',
  REAL_ESTATE: 'Inmuebles',
  OTHER: 'Otros'
};

export const InvestmentForm: React.FC<{
  existingInvestment: Investment | null;
  onClose: () => void;
  onDeleteRequest?: () => void;
  isSheetMode?: boolean;
}> = ({ existingInvestment, onClose, onDeleteRequest, isSheetMode = false }) => {
  const addInvestmentMutation = useAddInvestment();
  const updateInvestmentMutation = useUpdateInvestment();
  const { data: accounts } = useAccounts();

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('STOCK');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');

  // Init
  useEffect(() => {
    if (existingInvestment) {
      setName(existingInvestment.name);
      setType(existingInvestment.type);
      setTicker(existingInvestment.ticker || '');
      setQuantity(String(existingInvestment.quantity));
      setAvgBuyPrice(String(existingInvestment.avgBuyPrice));
      setCurrentPrice(String(existingInvestment.currentPrice || existingInvestment.avgBuyPrice));
    } else {
      setName('');
      setType('STOCK');
      setTicker('');
      setQuantity('');
      setAvgBuyPrice('');
      setCurrentPrice('');
      setSourceAccountId('');
    }
  }, [existingInvestment]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!name) return toastError('Nombre requerido');
      const payload = {
        name,
        type,
        ticker,
        quantity: parseFloat(quantity) || 0,
        avgBuyPrice: parseFloat(avgBuyPrice) || 0,
        currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(avgBuyPrice) || 0,
        currency: 'MXN',
        purchaseDate: existingInvestment ? existingInvestment.purchaseDate : new Date().toISOString(),
      };


      if (existingInvestment) {
        await updateInvestmentMutation.mutateAsync({ id: existingInvestment.id, investment: payload });
        toastSuccess('Inversión actualizada');
      } else {
        await addInvestmentMutation.mutateAsync({
          ...payload,
          sourceAccountId: sourceAccountId || undefined
        } as any);
        toastSuccess('Inversión agregada');
      }
      onClose();
    } catch (error) {
      toastError('Error al guardar inversión');
    }
  };

  const pageTitle = existingInvestment ? 'Editar Activo' : 'Nuevo Activo';
  const isSaving = addInvestmentMutation.isPending || updateInvestmentMutation.isPending;

  return (
    <>
      {/* Universal Sheet-Style Header (Requested by User) */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <button type="button" onClick={onClose} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
        <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
        <div className="w-12" />
      </div>

      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>
        <form onSubmit={handleSave} className="space-y-3 flex-1 flex flex-col">

          {/* 1. Type Selector (Horizontal Scroll) */}
          <div className="shrink-0 -mx-4 px-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-2">
              {(Object.keys(InvestmentTypeLabel) as InvestmentType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${type === t
                    ? 'bg-app-primary text-white border-app-primary shadow-lg shadow-app-primary/20'
                    : 'bg-app-surface text-app-muted border-app-border hover:border-app-muted'}`}
                >
                  {InvestmentTypeLabel[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-y-auto">

            {/* Name & Ticker */}
            <div className="space-y-3 shrink-0">
              <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del Activo (ej. Apple)" className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60" />
              </div>
              <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
                <input type="text" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker / Símbolo (Opcional)" className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60 uppercase" />
              </div>
            </div>

            {/* Qty & Price Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Cantidad</label>
                <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all h-11 flex items-center">
                  <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-sm font-bold text-app-text outline-none placeholder:text-app-muted/60" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Precio Compra</label>
                <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all h-11 flex items-center">
                  <span className="text-app-muted text-xs mr-1">$</span>
                  <input type="number" step="any" value={avgBuyPrice} onChange={e => setAvgBuyPrice(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-sm font-bold text-app-text outline-none placeholder:text-app-muted/60" />
                </div>
              </div>
            </div>

            {/* Current Price */}
            <div className="shrink-0">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Precio Actual (Opcional)</label>
              <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all h-11 flex items-center">
                <span className="text-app-muted text-xs mr-1">$</span>
                <input type="number" step="any" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="Igual a precio compra" className="w-full bg-transparent text-sm font-bold text-app-text outline-none placeholder:text-app-muted/60" />
              </div>
            </div>

            {/* Funding Source (Only Create) */}
            {!existingInvestment && (
              <div className="pt-2 shrink-0">
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="text-[10px] font-bold text-app-text uppercase tracking-wide opacity-70">Origen de Fondos</label>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Registrar Gasto</span>
                </div>
                <div className="relative">
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                  >
                    <option value="">-- No descontar saldo --</option>
                    {accounts?.filter(a => ['DEBIT', 'CASH'].includes(a.type)).map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-app-muted pointer-events-none text-[20px]">account_balance_wallet</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Footer Action */}
          <div className="pt-4 pb-10 mt-auto shrink-0 touch-none">
            <button
              disabled={isSaving}
              className="w-full py-3.5 bg-app-primary text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl shadow-app-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {existingInvestment ? 'Guardar Cambios' : 'Registrar Activo'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};