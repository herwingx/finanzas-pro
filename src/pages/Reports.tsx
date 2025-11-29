import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StorageService } from '../services/storageService';
import { useStorage } from '../hooks/useStorage';

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-card/80 backdrop-blur-sm p-3 rounded-lg border border-app-border shadow-lg text-sm">
        <p className="font-bold text-app-text mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
            <span>{p.name}:</span>
            <span className="font-bold">{formatter(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Reports = () => {
  const summaries = useStorage(StorageService.getMonthlySummaries, 'summary');
  const profile = useStorage(StorageService.getProfile, 'profile');

  const formatCurrency = useMemo(() => (value: number) => {
    const locales = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
    return new Intl.NumberFormat(locales[profile.currency] || 'es-MX', { style: 'currency', currency: profile.currency }).format(value);
  }, [profile.currency]);

  const chartData = useMemo(() => {
    return summaries.slice(0, 6).reverse().map(s => ({
      name: new Date(`${s.month}-02`).toLocaleString('es-MX', { month: 'short' }),
      Ingresos: s.totalIncome,
      Gastos: s.totalExpense,
    }));
  }, [summaries]);

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-app-bg/90 backdrop-blur p-4 border-b border-app-border">
        <Link to="/" className="w-1/3 text-left">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <h1 className="font-bold text-lg text-center w-1/3">Reportes</h1>
        <div className="w-1/3"></div>
      </header>
      
      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-app-muted mt-20 px-4 text-center">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">monitoring</span>
          <h2 className="font-bold text-lg text-app-text">No hay datos históricos aún</h2>
          <p className="text-sm">Cuando finalice el primer mes, tu resumen aparecerá aquí automáticamente.</p>
        </div>
      ) : (
        <div className="p-4 space-y-8">
          {/* Chart */}
          <div className="bg-app-card border border-app-border rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Últimos 6 Meses</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis tickFormatter={(tick) => `${tick / 1000}k`} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Historial Mensual</h2>
            {summaries.map(summary => (
              <div key={summary.month} className="bg-app-card border border-app-border rounded-2xl p-4">
                <p className="font-bold text-lg mb-2 capitalize">{new Date(`${summary.month}-02`).toLocaleString('es-MX', { month: 'long', year: 'numeric' })}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-app-success/80 uppercase">Ingresos</p>
                    <p className="font-bold text-app-success">{formatCurrency(summary.totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-app-danger/80 uppercase">Gastos</p>
                    <p className="font-bold text-app-danger">{formatCurrency(summary.totalExpense)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-app-muted uppercase">Neto</p>
                    <p className={`font-bold ${summary.net >= 0 ? 'text-app-text' : 'text-app-danger'}`}>{formatCurrency(summary.net)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};