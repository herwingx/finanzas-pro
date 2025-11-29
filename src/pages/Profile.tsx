import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { useStorage } from '../hooks/useStorage';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

export const Profile = () => {
  const navigate = useNavigate();
  const profile = useStorage(StorageService.getProfile, 'profile');
  
  const [name, setName] = useState(profile.name);
  const [currency, setCurrency] = useState(profile.currency);
  const [avatar, setAvatar] = useState<string | undefined>(profile.avatar);
  const [isDirty, setIsDirty] = useState(false);

  // Set initial state from storage
  useEffect(() => {
    setName(profile.name);
    setCurrency(profile.currency);
    setAvatar(profile.avatar);
  }, [profile]);

  // Check for changes to enable/disable save button
  useEffect(() => {
    const hasChanged = profile.name !== name || profile.currency !== currency || profile.avatar !== avatar;
    setIsDirty(hasChanged);
  }, [name, currency, avatar, profile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB size limit
        toast.error('La imagen es muy grande (máx 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!isDirty) return;
    const updatedProfile: UserProfile = { ...profile, name, currency, avatar };
    StorageService.saveProfile(updatedProfile);
    toast.success('Perfil guardado con éxito!');
    navigate('/'); // Navigate to dashboard to see changes
  };

  const currencySymbols = {
    'USD': '$', 'EUR': '€', 'MXN': '$', 'GBP': '£',
  };

  const userInitials = useMemo(() => 
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'
  , [name]);

  return (
    <div className="animate-fade-in bg-app-bg min-h-screen text-app-text flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-app-bg/90 backdrop-blur p-4 border-b border-app-border">
        <button onClick={() => navigate(-1)} className="text-app-text w-1/3 text-left">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="font-bold text-lg text-center w-1/3">Editar Perfil</h1>
        <div className="w-1/3 text-right">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`font-bold text-lg transition-opacity ${isDirty ? 'text-app-primary opacity-100' : 'text-app-muted opacity-50 cursor-not-allowed'}`}
          >
            Guardar
          </button>
        </div>
      </header>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Avatar section */}
        <div className="flex flex-col items-center space-y-4 pt-4">
          <div className="size-32 rounded-full bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-app-primary/20 relative">
            {avatar ? (
              <img src={avatar} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>
          <label className="cursor-pointer bg-app-card border border-app-border rounded-lg px-4 py-2 text-sm font-semibold hover:bg-app-elevated transition-colors">
            Cambiar Foto
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Name Input */}
        <div className="bg-app-card rounded-xl border border-app-border p-4 mt-6">
          <label className="block text-sm font-medium text-app-muted mb-2">Nombre de Usuario</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-app-bg border-app-border border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-app-primary"
          />
        </div>

        {/* Currency Selector */}
        <div className="bg-app-card rounded-xl border border-app-border p-4">
          <label className="block text-sm font-medium text-app-muted mb-2">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as UserProfile['currency'])}
            className="w-full bg-app-bg border-app-border border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-app-primary"
          >
            {Object.keys(currencySymbols).map(c => (
              <option key={c} value={c}>{`${c} (${currencySymbols[c as keyof typeof currencySymbols]})`}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};