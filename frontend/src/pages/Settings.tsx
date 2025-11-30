import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import useTheme from '../hooks/useTheme';

const ThemeSwitcher = () => {
  const [theme, setTheme] = useTheme();

  const options = [
    { value: 'light', label: 'Claro', icon: 'light_mode' },
    { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
    { value: 'system', label: 'Sistema', icon: 'settings_suggest' },
  ];

  return (
    <div className="flex bg-app-card p-1 rounded-lg border border-app-border">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value as any)}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${
            theme === option.value ? 'bg-app-primary text-white' : 'text-app-muted hover:text-app-text'
          }`}
        >
          <span className="material-symbols-outlined text-base">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
};

export const Settings = () => {
  const navigate = useNavigate();

  const handleResetData = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todos tus datos? Esta acción no se puede deshacer.')) {
      const success = StorageService.clearAllData();
      if (success) {
        alert('Todos los datos han sido restablecidos.');
        navigate('/'); // Go back to dashboard to see the changes
      } else {
        alert('Hubo un error al restablecer los datos.');
      }
    }
  };

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-app-bg/90 backdrop-blur p-4 border-b border-app-border">
        <button onClick={() => navigate(-1)} className="text-app-text">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="font-bold text-lg text-center flex-1">Ajustes</h1>
        <div className="w-8"></div> {/* Spacer */}
      </header>

      <div className="p-4 mt-4 space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Apariencia</h2>
          <div className="bg-app-card rounded-xl border border-app-border p-4">
            <p className="text-app-muted mb-4">
              Elige cómo quieres que se vea la aplicación.
            </p>
            <ThemeSwitcher />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Gestión de Datos</h2>
          <div className="bg-app-card rounded-xl border border-app-border p-4">
            <p className="text-app-muted mb-4">
              Restablecer la aplicación borrará todas tus transacciones, categorías y presupuestos. 
              La aplicación volverá a su estado inicial.
            </p>
            <button
              onClick={handleResetData}
              className="w-full py-3 bg-app-danger text-white font-bold rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Restablecer Todos los Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
