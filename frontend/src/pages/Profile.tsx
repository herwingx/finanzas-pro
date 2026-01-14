import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks & Components
import { useProfile, useUpdateProfile } from '../hooks/useApi';
import { SkeletonAppLoading } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';
import { toastSuccess, toastError, toast } from '../utils/toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);

  // -- FORM STATE --
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'MXN'>('MXN');
  const [timezone, setTimezone] = useState('America/Mexico_City');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Financial Config (Rule 50/30/20)
  const [netIncome, setNetIncome] = useState('');
  const [incomeFreq, setIncomeFreq] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [taxRate, setTaxRate] = useState('');

  // Timezones for Latin America + USA + Europe (Filtered List)
  const timezones = [
    { value: 'America/Mexico_City', label: '🇲🇽 México Central' },
    { value: 'America/Cancun', label: '🇲🇽 México Sureste' },
    { value: 'America/Bogota', label: '🇨🇴 Bogotá' },
    { value: 'America/Lima', label: '🇵🇪 Lima' },
    { value: 'America/Buenos_Aires', label: '🇦🇷 Buenos Aires' },
    { value: 'America/Santiago', label: '🇨🇱 Santiago' },
    { value: 'America/Sao_Paulo', label: '🇧🇷 São Paulo' },
    { value: 'America/New_York', label: '🇺🇸 New York (ET)' },
    { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles (PT)' },
    { value: 'Europe/Madrid', label: '🇪🇸 Madrid' },
    { value: 'UTC', label: '🌐 UTC (Universal)' },
  ];

  // Helper
  const userInitials = useMemo(() => profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U', [profile?.name]);

  // Sync state
  const startEditing = () => {
    if (profile) {
      setName(profile.name);
      setCurrency(profile.currency);
      setTimezone(profile.timezone || 'America/Mexico_City');
      setAvatarPreview(profile.avatar || null);

      setNetIncome(profile.monthlyNetIncome ? String(profile.monthlyNetIncome) : '');
      setIncomeFreq(profile.incomeFrequency || 'monthly');
      setTaxRate(profile.taxRate ? String(profile.taxRate * 100) : ''); // Stored 0.3, shown as 30

      setIsEditing(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toastError('Máximo 2MB por imagen');
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toastError('El nombre es obligatorio');

    try {
      await updateProfileMutation.mutateAsync({
        name,
        currency,
        timezone,
        avatar: avatarPreview || '',
        monthlyNetIncome: netIncome ? parseFloat(netIncome) : undefined,
        incomeFrequency: incomeFreq,
        taxRate: taxRate ? parseFloat(taxRate) / 100 : undefined
      });
      toastSuccess('Perfil actualizado');
      setIsEditing(false);
    } catch (error) {
      toastError('Error al guardar cambios');
    }
  };

  const handleLogout = () => {
    // Logic for secure logout
    localStorage.clear();
    toast('Sesión cerrada');
    navigate('/login');
  };

  // Cache Clear Functionality (PWA Helper)
  const handleUpdateCheck = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.unregister();
      const keys = await caches.keys();
      for (const key of keys) await caches.delete(key);
      toastSuccess('Actualizando app...', { duration: 1500 });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      window.location.reload();
    }
  };


  if (isLoading) return <SkeletonAppLoading />;
  if (isError) return <div className="p-8 text-center text-rose-500">Error al cargar perfil.</div>;

  const displayAvatar = isEditing ? avatarPreview : profile?.avatar;
  const timezoneLabel = timezones.find(tz => tz.value === profile?.timezone)?.label || profile?.timezone;

  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
      <PageHeader
        title="Mi Cuenta"
        showBackButton={true}
        onBack={() => isEditing ? setIsEditing(false) : navigate(-1)}
        rightAction={
          <button
            onClick={isEditing ? handleSave : startEditing}
            disabled={updateProfileMutation.isPending}
            className={`text-xs md:text-sm font-bold transition-all px-3 py-1.5 rounded-lg active:scale-95 ${isEditing
              ? 'text-white bg-app-primary shadow-lg shadow-blue-500/20'
              : 'text-app-muted bg-app-subtle hover:text-app-text'
              }`}
          >
            {updateProfileMutation.isPending ? '...' : isEditing ? 'Guardar' : 'Editar'}
          </button>
        }
      />

      <main className="max-w-xl mx-auto px-6 pt-4 pb-20 animate-fade-in space-y-8">

        {/* 1. HERO PROFILE */}
        <div className="flex flex-col items-center">
          <div className="relative group mb-5">
            {/* Avatar Container with Ring */}
            <div className="size-32 rounded-full p-1 bg-linear-to-tr from-app-primary to-indigo-400">
              <div className="w-full h-full rounded-full bg-app-surface border-4 border-app-surface overflow-hidden relative shadow-inner">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                  <div className="w-full h-full bg-app-subtle flex items-center justify-center text-3xl font-bold text-app-muted/50">
                    {userInitials}
                  </div>
                )}

                {/* Edit Overlay */}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">photo_camera</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>
            </div>
            {/* Online Status Dot */}
            {!isEditing && <div className="absolute bottom-2 right-2 size-4 bg-emerald-500 border-2 border-app-bg rounded-full shadow-sm" title="Online" />}
          </div>

          {/* Name & Email Fields */}
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-2xl font-bold text-center bg-transparent border-b-2 border-app-border focus:border-app-primary outline-none px-2 w-full max-w-[300px]"
              placeholder="Nombre Completo"
              autoFocus
            />
          ) : (
            <h2 className="text-2xl font-bold text-app-text">{profile?.name}</h2>
          )}

          <p className="text-sm font-medium text-app-muted mt-1 font-mono">{profile?.email}</p>
        </div>


        {/* 2. CONFIGURACIÓN GENERAL (Card Style) */}
        <div className="space-y-3">
          <h3 className="px-1 text-xs font-bold text-app-muted uppercase tracking-wider">Región y Formatos</h3>
          <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm divide-y divide-app-subtle">

            {/* Moneda */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-app-text">Moneda Base</p>
                <p className="text-[10px] text-app-muted font-medium">Reportes y balances globales</p>
              </div>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="appearance-none bg-app-subtle border-none font-bold text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-app-primary"
                  >
                    <option value="MXN">MXN ($)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                  <span className="material-symbols-outlined text-sm absolute right-2 top-2 pointer-events-none opacity-50">expand_more</span>
                </div>
              ) : (
                <span className="font-mono font-bold text-app-text bg-app-subtle px-2 py-1 rounded text-xs border border-app-border">
                  {profile?.currency}
                </span>
              )}
            </div>

            {/* Timezone */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-app-text">Zona Horaria</p>
                <p className="text-[10px] text-app-muted font-medium">Para recurrencias exactas</p>
              </div>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="appearance-none bg-app-subtle border-none font-bold text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-app-primary max-w-[160px]"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-sm absolute right-2 top-2 pointer-events-none opacity-50">expand_more</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-app-muted truncate max-w-[150px]">
                  {timezoneLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. PERFIL FINANCIERO (P1 Rule Logic) */}
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Perfil Financiero (50/30/20)</h3>
            <span className="material-symbols-outlined text-app-muted text-sm opacity-50" title="Configura tus ingresos base para el análisis automático">info</span>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm p-4 space-y-4">

            {/* Income Row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-app-text">Ingreso Neto Base</p>
                <p className="text-[10px] text-app-muted font-medium">Monto libre mensual</p>
              </div>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-xs font-bold opacity-50">$</span>
                  <input
                    type="number"
                    value={netIncome}
                    onChange={e => setNetIncome(e.target.value)}
                    className="w-24 bg-app-subtle rounded-lg py-1.5 pl-5 pr-2 text-right font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0"
                  />
                </div>
              ) : (
                <span className="text-lg font-bold font-numbers text-emerald-600 dark:text-emerald-400">
                  ${profile?.monthlyNetIncome?.toLocaleString() || '0'}
                </span>
              )}
            </div>

            {/* Details Row (Grid) */}
            <div className="grid grid-cols-2 gap-4 border-t border-app-border pt-3">
              <div>
                <p className="font-medium text-xs text-app-muted mb-1">Frecuencia Pago</p>
                {isEditing ? (
                  <select
                    value={incomeFreq}
                    onChange={(e) => setIncomeFreq(e.target.value as any)}
                    className="w-full bg-app-subtle py-1 px-2 rounded-lg text-xs font-bold"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                ) : (
                  <p className="font-bold text-sm text-app-text capitalize">
                    {profile?.incomeFrequency === 'biweekly' ? 'Quincenal' : profile?.incomeFrequency === 'weekly' ? 'Semanal' : 'Mensual'}
                  </p>
                )}
              </div>

              <div>
                <p className="font-medium text-xs text-app-muted mb-1">Est. Impuestos</p>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={taxRate}
                      onChange={e => setTaxRate(e.target.value)}
                      placeholder="30"
                      className="w-full bg-app-subtle py-1 px-2 rounded-lg text-xs font-bold text-right outline-none"
                    />
                    <span className="text-xs font-bold">%</span>
                  </div>
                ) : (
                  <p className="font-bold text-sm text-app-text font-numbers">
                    {profile?.taxRate ? (profile.taxRate * 100).toFixed(0) : '0'}%
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 4. DANGER / SYSTEM ZONE */}
        <div className="pt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold text-sm rounded-xl border border-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar Sesión Actual
          </button>

          <button
            onClick={handleUpdateCheck}
            className="text-[10px] text-app-muted font-bold hover:text-app-primary underline decoration-2 decoration-app-primary/20 hover:decoration-app-primary transition-all cursor-pointer uppercase tracking-wider"
          >
            Buscar Actualizaciones
          </button>

          <div className="text-[10px] text-app-muted/40 font-mono text-center leading-none">
            Build 2026.01.15.r2<br />
            FinanzasPro PWA
          </div>
        </div>

      </main>
    </div>
  );
};

export default Profile;