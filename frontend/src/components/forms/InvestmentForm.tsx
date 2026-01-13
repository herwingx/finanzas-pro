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
  REAL_ESTATE: 'Bienes Raíces',
  OTHER: 'Otros'
};

export const InvestmentForm: React.FC<{
  existingInvestment: Investment | null;
  onClose: () => void;
  onDeleteRequest?: () => void;
}> = ({ existingInvestment, onClose, onDeleteRequest }) => {
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
      const payload = {
        name,
        type,
        ticker,
        quantity: parseFloat(quantity),
        avgBuyPrice: parseFloat(avgBuyPrice),
        currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(avgBuyPrice),
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onClose}
          className="text-app-muted hover:text-app-text text-sm font-medium"
        >
          Cancelar
        </button>
        <h3 className="font-bold text-lg text-app-text">{existingInvestment ? 'Editar Activo' : 'Nuevo Activo'}</h3>
        <button onClick={handleSave} className="text-app-primary font-bold text-sm">Guardar</button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-app-muted uppercase block mb-1.5">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(InvestmentTypeLabel) as InvestmentType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${type === t ? 'bg-app-text text-app-bg border-app-text' : 'bg-transparent text-app-muted border-app-border'}`}
              >
                {InvestmentTypeLabel[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-bold text-app-muted uppercase block mb-1.5">Nombre del Activo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Apple Inc." className="w-full bg-app-subtle border border-app-border rounded-xl px-4 py-3 font-bold text-app-text outline-none focus:border-app-primary" />
          </div>

          <div>
            <label className="text-xs font-bold text-app-muted uppercase block mb-1.5">Ticker (Opcional)</label>
            <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} placeholder="AAPL" className="w-full bg-app-subtle border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text uppercase outline-none focus:border-app-primary" />
          </div>

          <div>
            <label className="text-xs font-bold text-app-muted uppercase block mb-1.5">Cantidad</label>
            <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="10.5" className="w-full bg-app-subtle border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text outline-none focus:border-app-primary no-spin-button" />
          </div>

          <div>
            <label className="text-xs font-bold text-app-muted uppercase block mb-1.5">Precio Compra Prom.</label>
            <input type="number" step="any" value={avgBuyPrice} onChange={e => setAvgBuyPrice(e.target.value)} placeholder="$0.00" className="w-full bg-app-subtle border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text outline-none focus:border-app-primary no-spin-button" />
          </div>

          <div>
            <label className="text-xs font-bold text-app-muted uppercase block mb-1.5">Precio Actual</label>
            <input type="number" step="any" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="$0.00" className="w-full bg-app-subtle border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text outline-none focus:border-app-primary no-spin-button" />
          </div>
        </div>

        {!existingInvestment && (
          <div className="pt-2">
            <label className="text-xs font-bold text-app-muted uppercase block mb-1.5 flex items-center justify-between">
              <span>Origen de Fondos (Opcional)</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Creará un gasto automático</span>
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full bg-app-subtle border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text outline-none focus:border-app-primary appearance-none"
            >
              <option value="">-- No descontar saldo (Solo registrar) --</option>
              {accounts?.filter(a => ['DEBIT', 'CASH'].includes(a.type)).map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} (${account.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {existingInvestment && onDeleteRequest && (
          <div className="pt-6">
            <button onClick={onDeleteRequest} className="w-full py-4 rounded-xl border border-rose-200 text-rose-500 font-bold text-sm bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:border-rose-900 dark:hover:bg-rose-900/20">
              Eliminar Activo
            </button>
          </div>
        )}
      </div>
    </>
  );
};
