import React from 'react';
import { PageHeader } from '../components/PageHeader';
import useTheme from '../hooks/useTheme';

const Settings: React.FC = () => {
  const [theme, setTheme] = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleThemeChange = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <div className="bg-app-bg text-app-text font-sans relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px]"></div>
      </div>

      <PageHeader title="Ajustes" />

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Settings Section */}
        <section className="animate-slide-up">
          <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden shadow-sm">
            <div className="divide-y divide-app-border">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 hover:bg-app-elevated/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-app-muted">dark_mode</span>
                  <span className="font-medium text-sm text-app-text">Modo Oscuro</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={handleThemeChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
                </label>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between p-4 hover:bg-app-elevated/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-app-muted">notifications</span>
                  <span className="font-medium text-sm text-app-text">Notificaciones</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" />
                  <div className="w-11 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
