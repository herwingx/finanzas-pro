import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '../hooks/useApi';
import { toastSuccess, toastError } from '../utils/toast';
import { SkeletonAppLoading } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);

  // Local edit state initialized
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'MXN'>('MXN');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const userInitials = useMemo(() => {
    return profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [profile?.name]);

  // Sync state when entering edit mode
  const startEditing = () => {
    if (profile) {
      setName(profile.name);
      setCurrency(profile.currency);
      setAvatarPreview(profile.avatar || null);
      setIsEditing(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit standard
        toastError('La imagen es muy pesada (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({ name, currency, avatar: avatarPreview || '' });
      toastSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      toastError('No se pudo guardar los cambios');
    }
  };

  const handleLogout = () => {
    // Limpia todo para evitar inconsistencias
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Si tienes un context de Auth, aquí deberías llamar al método logout()
    navigate('/login');
  };

  if (isLoading) return <SkeletonAppLoading />;
  if (isError) return <div className="p-8 text-center text-app-muted">Error cargando perfil.</div>;

  const currentAvatar = isEditing ? avatarPreview : profile?.avatar;

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text font-sans">
      <PageHeader
        title="Mi Perfil"
        showBackButton={true}
        onBack={() => isEditing ? setIsEditing(false) : navigate('/more')} // Navegación lógica: cancelar edición o volver
        rightAction={
          <button
            onClick={isEditing ? handleSave : startEditing}
            disabled={updateProfileMutation.isPending}
            className={`text-sm font-bold transition-colors px-2 py-1 rounded-lg ${isEditing ? 'text-app-primary bg-app-primary/10' : 'text-app-muted hover:text-app-text hover:bg-app-subtle'}`}
          >
            {updateProfileMutation.isPending ? '...' : isEditing ? 'Guardar' : 'Editar'}
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-6 py-8 flex flex-col items-center">

        {/* Avatar Hero Section */}
        <div className="relative group mb-6">
          <div className="size-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden ring-4 ring-app-surface relative">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover transition-opacity duration-300" />
            ) : (
              <span>{userInitials}</span>
            )}

            {/* Edit Overlay (Only visible in edit mode) */}
            {isEditing && (
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-black/50 backdrop-blur-[2px]">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">photo_camera</span>
              </label>
            )}
          </div>
        </div>

        {/* Name Section (Editable Title) */}
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-bold text-center bg-transparent border-b-2 border-app-border focus:border-app-primary outline-none px-2 py-1 mb-1 w-full max-w-[240px] transition-colors"
            autoFocus
            placeholder="Tu nombre"
          />
        ) : (
          <h1 className="text-2xl font-bold text-app-text mb-1 tracking-tight">{profile?.name}</h1>
        )}

        <p className="text-sm text-app-muted mb-10 font-medium">{profile?.email}</p>


        {/* Settings Form Blocks */}
        <div className="w-full space-y-6 animate-slide-up">

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">Configuración Regional</h3>

            <div className="bg-app-surface border border-app-border rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-semibold text-sm text-app-text">Moneda Principal</p>
                <p className="text-xs text-app-muted mt-0.5">Usada para los reportes globales</p>
              </div>

              {isEditing ? (
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="appearance-none bg-app-subtle border-transparent py-2 pl-3 pr-9 rounded-lg text-sm font-bold text-app-text focus:ring-2 focus:ring-app-primary outline-none cursor-pointer transition-shadow"
                  >
                    <option value="MXN">MXN ($)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                  <span className="absolute right-2.5 top-2.5 text-app-muted pointer-events-none material-symbols-outlined text-sm">expand_more</span>
                </div>
              ) : (
                <div className="bg-app-subtle px-3 py-1.5 rounded-lg text-sm font-bold text-app-text border border-app-border">
                  {profile?.currency}
                </div>
              )}
            </div>
          </div>

          {/* Account Danger Zone */}
          <div className="space-y-6 pt-4">
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl bg-app-surface border border-app-border text-rose-500 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/10 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Cerrar Sesión
            </button>

            <div className="text-center space-y-1">
              <p className="text-[10px] text-app-muted uppercase tracking-widest font-bold">
                Finanzas Pro
              </p>
              <p className="text-[10px] text-app-muted/60 font-mono">
                v2.4.0
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;