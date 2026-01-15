import React, { useState, useEffect } from 'react';

// Hooks
import useTheme from '../hooks/useTheme';
import { useProfile, useUpdateProfile } from '../hooks/useApi';

// Components
import { PageHeader } from '../components/PageHeader';

// Utils
import { toastSuccess, toastError } from '../utils/toast';

/* ==================================================================================
   SUB-COMPONENT: TOGGLE SWITCH (iOS Style)
   ================================================================================== */
interface SwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`
      relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
      ${checked ? 'bg-app-primary' : 'bg-app-subtle hover:bg-black/10 dark:hover:bg-white/10'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span className="sr-only">Toggle</span>
    <span
      className={`
        pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

/* ==================================================================================
   SUB-COMPONENT: SETTING ROW
   ================================================================================== */
interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  control: React.ReactNode;
  isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, description, control, isLast }) => (
  <div className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-app-border/50' : ''}`}>
    <div className="flex items-center gap-4">
      <div className="size-9 rounded-lg bg-app-subtle flex items-center justify-center shrink-0 text-app-text">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-app-text leading-tight">{label}</p>
        {description && <p className="text-[11px] text-app-muted mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="shrink-0 ml-4">
      {control}
    </div>
  </div>
);

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const Settings: React.FC = () => {
  // Hooks
  const [theme, setTheme] = useTheme();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Local State
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  // Sync Logic
  useEffect(() => {
    if (profile) setNotifications(profile.notificationsEnabled ?? true);
  }, [profile]);

  const handleNotifyToggle = async (val: boolean) => {
    setNotifications(val);
    try {
      await updateProfile.mutateAsync({ notificationsEnabled: val });
      toastSuccess(val ? 'Alertas activadas' : 'Alertas pausadas');
    } catch (e) {
      setNotifications(!val); // revert
      toastError('Error guardando ajuste');
    }
  };

  const handleThemeToggle = (val: boolean) => setTheme(val ? 'dark' : 'light');
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
      <PageHeader title="Ajustes" showBackButton />

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-8 animate-fade-in">

        {/* Visual Settings */}
        <section>
          <h3 className="px-1 mb-2 text-xs font-bold text-app-muted uppercase tracking-wider">Apariencia</h3>
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden">
            <SettingRow
              icon="dark_mode"
              label="Modo Oscuro"
              description="Mejor confort visual nocturno"
              control={<Switch checked={isDark} onChange={handleThemeToggle} />}
              isLast
            />
          </div>
        </section>

        {/* System Settings */}
        <section>
          <h3 className="px-1 mb-2 text-xs font-bold text-app-muted uppercase tracking-wider">Sistema</h3>
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden">
            <SettingRow
              icon="notifications"
              label="Notificaciones Push"
              description="Recordatorios de pago y reportes"
              control={<Switch checked={notifications} onChange={handleNotifyToggle} disabled={updateProfile.isPending || isLoading} />}
            />

            <SettingRow
              icon="fingerprint"
              label="Biometría"
              description="Protección con FaceID / Huella"
              control={<Switch checked={biometrics} onChange={setBiometrics} />}
              isLast
            />
          </div>
        </section>

        {/* Version Info Footer */}
        <div className="text-center pt-8 opacity-60 hover:opacity-100 transition-opacity cursor-default">
          <div className="inline-flex items-center justify-center gap-1.5 bg-app-subtle px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500" />
            Conectado
          </div>
          <p className="text-xs text-app-muted font-mono">Build 2026.1.0-RC2</p>
        </div>

      </main>
    </div>
  );
};

export default Settings;