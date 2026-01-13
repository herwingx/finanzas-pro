import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import useTheme from '../hooks/useTheme';
import { useProfile, useUpdateProfile } from '../hooks/useApi';
import { toastSuccess, toastError } from '../utils/toast';

// --- Sub-component: Switch (Toggle) ---
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
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-2
      ${checked ? 'bg-app-primary' : 'bg-app-subtle hover:bg-zinc-200 dark:hover:bg-zinc-700'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span className="sr-only">Toggle setting</span>
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

// --- Sub-component: Setting Row ---
interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  control: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, description, control }) => (
  <div className="flex items-center justify-between p-4 hover:bg-app-subtle/40 transition-colors">
    <div className="flex items-center gap-4">
      <div className="size-10 rounded-xl bg-app-subtle flex items-center justify-center shrink-0 text-app-muted">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-app-text">{label}</p>
        {description && <p className="text-xs text-app-muted">{description}</p>}
      </div>
    </div>
    <div className="shrink-0 ml-4">
      {control}
    </div>
  </div>
);
const Settings: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Local state for UI responsiveness
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
    }
  }, [profile]);

  const handleNotificationsToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked);
    try {
      await updateProfile.mutateAsync({ notificationsEnabled: checked });
      toastSuccess(checked ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    } catch (error) {
      setNotificationsEnabled(!checked); // Revert if failed
      toastError('Error al actualizar preferencias');
    }
  };

  // Logic: "dark" or system preference handling
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">

      <PageHeader title="Ajustes" showBackButton={true} />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-8">

        {/* Appearance Group */}
        <section>
          <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Experiencia Visual</h3>
          <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border shadow-sm">

            <SettingRow
              icon="dark_mode"
              label="Modo Oscuro"
              description="Reduce la fatiga visual de noche"
              control={<Switch checked={isDark} onChange={handleThemeToggle} />}
            />

          </div>
        </section>

        {/* Preferences Group */}
        <section>
          <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Preferencias del Sistema</h3>
          <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border shadow-sm">

            <SettingRow
              icon="notifications"
              label="Notificaciones"
              description="Recordatorios de pago y alertas"
              control={(
                <Switch
                  checked={notificationsEnabled}
                  onChange={handleNotificationsToggle}
                  disabled={updateProfile.isPending || isProfileLoading}
                />
              )}
            />

            <SettingRow
              icon="fingerprint"
              label="Biometría"
              description="Desbloquear con FaceID / Huella"
              control={<Switch checked={biometricsEnabled} onChange={setBiometricsEnabled} />}
            />

          </div>
        </section>

        {/* App Info */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app-subtle mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Sistema en línea</span>
          </div>
          <p className="text-xs text-app-muted">Finanzas Pro v2.4.0</p>
        </div>

      </div>
    </div>
  );
};

export default Settings;