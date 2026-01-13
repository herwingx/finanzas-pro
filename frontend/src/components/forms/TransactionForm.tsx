import React, { useState, useEffect, useMemo } from "react";
import {
  useCategories,
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useAccounts,
  useInstallmentPurchases,
  usePayInstallment,
} from "../../hooks/useApi";
import { toastSuccess, toastError, toast } from "../../utils/toast";
import { PageHeader } from "../PageHeader";
import { DatePicker } from "../DatePicker";
import { CategorySelector } from "../CategorySelector";
import { ToggleButtonGroup } from "../Button";
import { TransactionType, Transaction, Account, TransactionFormInitialData } from "../../types";

interface TransactionFormProps {
  existingTransaction?: Transaction | null;
  initialData?: TransactionFormInitialData | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  existingTransaction,
  initialData,
  onClose,
  isSheetMode = false,
}) => {
  const isEditing = !!existingTransaction;
  const initialType = (initialData?.type as TransactionType) || "expense";

  // --- Queries ---
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const { data: installments } = useInstallmentPurchases();

  // --- Mutations ---
  const addMutation = useAddTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const payMsiMutation = usePayInstallment();

  // --- Form State ---
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [accountId, setAccountId] = useState(initialData?.accountId || "");
  const [destAccountId, setDestAccountId] = useState(initialData?.destinationAccountId || "");
  const [date, setDate] = useState(new Date());

  // Logic: Pre-selected MSI (e.g. from Widget)
  const [msiLinkId, setMsiLinkId] = useState<string>(initialData?.installmentPurchaseId || "");
  const [isMsiPay, setIsMsiPay] = useState(!!initialData?.installmentPurchaseId);

  // Filter Accounts
  const allAccounts = useMemo(() => accounts || [], [accounts]);
  const debits = useMemo(
    () => allAccounts.filter((a) => ["DEBIT", "CASH"].includes(a.type)),
    [allAccounts]
  );

  // Destination Info
  const destAccount = useMemo(
    () => allAccounts.find((a) => a.id === destAccountId),
    [allAccounts, destAccountId]
  );
  const destInstallments = useMemo(() => {
    if (!destAccountId || !installments) return [];
    return installments.filter(
      (p) => p.accountId === destAccountId && p.paidAmount < p.totalAmount
    );
  }, [destAccountId, installments]);

  // --- Effects ---

  // Hydrate form on Edit
  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(existingTransaction.amount.toString());
      setDescription(existingTransaction.description);
      setCategoryId(existingTransaction.categoryId || "");
      setAccountId(existingTransaction.accountId || "");
      setDestAccountId(existingTransaction.destinationAccountId || "");
      setDate(new Date(existingTransaction.date));
      if (existingTransaction.installmentPurchaseId) {
        setIsMsiPay(true);
        setMsiLinkId(existingTransaction.installmentPurchaseId);
      }
    }
  }, [existingTransaction]);

  // Defaults for Accounts
  useEffect(() => {
    if (!accountId && allAccounts.length) {
      if (type === "expense") setAccountId(allAccounts[0].id);
      else if (type === "income")
        setAccountId(debits[0]?.id || allAccounts[0].id);
      else if (type === "transfer")
        setAccountId(debits[0]?.id || allAccounts[0].id);
    }
  }, [type, accountId, allAccounts, debits]);

  // Defaults for Category
  useEffect(() => {
    const cats = categories?.filter((c) => c.type === type) || [];
    if (!categoryId && cats.length) {
      if (type !== "transfer") setCategoryId(cats[0].id);
    }
  }, [type, categories, categoryId]);

  // Update Type if initialData changes (only if not editing)
  useEffect(() => {
    if (!isEditing && initialData?.type) {
      setType(initialData.type);
    }
  }, [initialData, isEditing]);


  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) return toast.error("Monto inválido");

    const payloadBase = {
      amount: numAmount,
      description:
        description || (type === "transfer" ? "Transferencia" : "Transacción"),
      date: date.toISOString(),
      accountId,
    };

    try {
      if (isEditing && existingTransaction) {
        await updateMutation.mutateAsync({
          id: existingTransaction.id,
          transaction: {
            ...payloadBase,
            type,
            categoryId: type !== "transfer" ? categoryId : undefined,
            destinationAccountId: destAccountId || undefined,
          },
        });
        toastSuccess("Actualizado");
      } else if (type === "transfer") {
        if (!destAccountId || destAccountId === accountId)
          return toast.error("Destino inválido");

        // Logic for Credit Card Payment Link
        if (destAccount?.type === "CREDIT" && isMsiPay && msiLinkId) {
          if (msiLinkId === "__ALL__") {
            // Custom logic...
          } else {
            await payMsiMutation.mutateAsync({
              id: msiLinkId,
              payment: { ...payloadBase, accountId: accountId },
            });
            toastSuccess("Pago a MSI registrado");
            onClose();
            return;
          }
        }

        await addMutation.mutateAsync({
          ...payloadBase,
          type: "transfer",
          destinationAccountId: destAccountId,
        });
        toastSuccess("Transferencia realizada");
      } else {
        if (!categoryId) return toast.error("Categoría requerida");
        await addMutation.mutateAsync({ ...payloadBase, type, categoryId });
        toastSuccess("Guardado");
      }
      onClose();
    } catch (e: any) {
      toastError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!existingTransaction?.id) return;
    try {
      await deleteMutation.mutateAsync(existingTransaction.id);
      toastSuccess("Eliminado");
      onClose();
    } catch (e) {
      toastError("Error eliminando");
    }
  };

  const pageTitle = isEditing
    ? "Editar Transacción"
    : type === "expense"
      ? "Nuevo Gasto"
      : type === "income"
        ? "Nuevo Ingreso"
        : "Transferencia";

  // Si el tipo viene preseleccionado o estamos editando, no mostramos el toggle
  const showTypeToggle = !isEditing && !initialData?.type;

  return (
    <>
      {isSheetMode ? (
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={onClose}
            className="text-app-muted hover:text-app-text font-medium text-sm"
          >
            Cancelar
          </button>
          <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-rose-500 hover:text-rose-600 font-medium text-sm"
            >
              Eliminar
            </button>
          )}
          {!isEditing && <div className="w-8"></div>}
        </div>
      ) : (
        <PageHeader
          title={pageTitle}
          showBackButton
          onBack={onClose}
          rightAction={
            isEditing && (
              <button
                onClick={handleDelete}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-full"
              >
                <span className="material-symbols-outlined text-[20px]">
                  delete
                </span>
              </button>
            )
          }
        />
      )}

      <div className={isSheetMode ? "" : "px-5 pt-6 pb-20 w-full max-w-lg mx-auto"}>
        {/* Toggle Type - Solo mostrar si NO hay tipo preseleccionado */}
        {showTypeToggle && (
          <div className="mb-8 px-2">
            <ToggleButtonGroup
              value={type}
              onChange={(v) => setType(v as TransactionType)}
              options={[
                { value: "expense", label: "Gasto" },
                { value: "income", label: "Ingreso" },
                { value: "transfer", label: "Transferencia" },
              ]}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Hero */}
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center relative">
              <span className="text-3xl text-app-muted font-bold absolute -left-6 top-1.5">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                onWheel={(e) => e.currentTarget.blur()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-5xl font-black text-app-text text-center w-48 outline-none placeholder-app-muted/20 no-spin-button"
                autoFocus={!isEditing && isSheetMode}
              />
            </div>
          </div>

          {/* Dynamic Fields based on Type */}

          {/* Source Account */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">
                Cuenta {type === "transfer" ? "Origen" : ""}
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-full bg-app-surface border border-app-border rounded-xl px-4 py-3.5 text-sm font-semibold outline-none appearance-none"
                >
                  {(type === "income" ? debits : allAccounts).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-3.5 text-app-muted pointer-events-none material-symbols-outlined text-sm">
                  expand_more
                </span>
              </div>
            </div>

            {type === "transfer" && (
              <div>
                <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">
                  Cuenta Destino
                </label>
                <div className="relative">
                  <select
                    value={destAccountId}
                    onChange={(e) => setDestAccountId(e.target.value)}
                    className="w-full h-full bg-app-surface border border-app-border rounded-xl px-4 py-3.5 text-sm font-semibold outline-none appearance-none"
                  >
                    <option value="">Selecciona destino...</option>
                    {allAccounts
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (
                          {a.type === "CREDIT"
                            ? `Deuda: $${a.balance}`
                            : `$${a.balance}`}
                          )
                        </option>
                      ))}
                  </select>
                  <span className="absolute right-4 top-3.5 text-app-muted pointer-events-none material-symbols-outlined text-sm">
                    expand_more
                  </span>
                </div>

                {/* Credit Card Logic Hook */}
                {destAccount?.type === "CREDIT" && destInstallments.length > 0 && (
                  <div className="mt-4 p-4 bg-app-subtle border border-app-border rounded-2xl animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-app-text flex items-center gap-2">
                        <span className="material-symbols-outlined text-app-primary">
                          link
                        </span>
                        Vincular a Plan MSI
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMsiPay}
                          onChange={(e) => setIsMsiPay(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-app-subtle peer-focus:ring-2 peer-focus:ring-app-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-app-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-app-primary"></div>
                      </label>
                    </div>

                    {isMsiPay && (
                      <select
                        value={msiLinkId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setMsiLinkId(pid);
                          // Auto-set amount
                          const p = destInstallments.find((i) => i.id === pid);
                          if (p) {
                            const rem = p.totalAmount - p.paidAmount;
                            setAmount(Math.min(p.monthlyPayment, rem).toString());
                          }
                        }}
                        className="w-full bg-white dark:bg-zinc-800 border border-app-border rounded-lg text-xs py-2 px-3 outline-none"
                      >
                        <option value="">Selecciona Plan...</option>
                        {destInstallments.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.description} (Mes: ${p.monthlyPayment})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Common Fields */}
          <div>
            <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Tacos, Netflix..."
              className="w-full px-4 py-3 bg-app-surface border border-app-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-app-primary/50"
            />
          </div>

          {type !== "transfer" && (
            <div>
              <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-2 block">
                Categoría
              </label>
              <CategorySelector
                categories={categories?.filter((c) => c.type === type) || []}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <DatePicker
              date={date}
              onDateChange={(d) => d && setDate(d)}
              className="bg-app-surface border-app-border"
            />
          </div>

          {/* Action */}
          <div className="pt-6 pb-24 sm:pb-8">
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="w-full py-4 rounded-2xl bg-app-primary text-white text-lg font-bold shadow-xl shadow-app-primary/30 active:scale-95 transition-all"
            >
              {isEditing ? "Guardar Cambios" : "Confirmar Transacción"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
