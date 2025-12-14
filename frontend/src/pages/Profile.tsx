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
  const [editData, setEditData] = useState({
    name: '',
    currency: 'USD' as 'USD' | 'EUR' | 'GBP' | 'MXN',
    avatar: '',
  });

  const userInitials = useMemo(() => {
    return profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [profile?.name]);

  const handleEdit = () => {
    if (profile) {
      setEditData({
        name: profile.name,
        currency: profile.currency,
        avatar: profile.avatar || '',
      });
      setIsEditing(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toastError('La imagen debe ser menor a 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(editData);
      toastSuccess('Perfil actualizado');
      setIsEditing(false);
    } catch (error) {
      toastError('Error al actualizar perfil');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (isLoading) return <SkeletonAppLoading />;

  if (isError) return <div className="p-8 text-center text-app-danger">Error al cargar el perfil.</div>;

  return (
    <div className="bg-app-bg text-app-text font-sans relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-app-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-app-secondary/10 rounded-full blur-[100px]" />
      </div>

      <PageHeader
        title="Perfil"
        rightAction={
          <button
            onClick={isEditing ? handleSave : handleEdit}
            className="size-10 rounded-xl flex items-center justify-center hover:bg-app-elevated transition-colors"
            disabled={updateProfileMutation.isPending}
          >
            <span className="material-symbols-outlined text-xl text-app-primary">
              {isEditing ? 'check' : 'edit'}
            </span>
          </button>
        }
      />

      <div className="p-4 mt-2 space-y-8 max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="size-24 rounded-full bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-app-primary/30 ring-4 ring-app-bg group-hover:ring-app-primary/30 transition-all duration-500 relative z-10">
              {(isEditing ? editData.avatar : profile?.avatar) ?
                <img src={isEditing ? editData.avatar : profile?.avatar} alt="Avatar" className="w-full h-full object-cover" /> :
                <span>{userInitials}</span>
              }
            </div>
            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="mt-4 text-2xl font-bold tracking-tight text-center bg-app-elevated border border-app-border rounded-xl px-4 py-2"
            />
          ) : (
            <h2 className="text-2xl font-bold tracking-tight mt-4">{profile?.name}</h2>
          )}
        </div>

        {/* Account Settings */}
        <section>
          <h2 className="text-sm font-bold text-app-muted uppercase tracking-wider mb-3">Cuenta</h2>
          <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-semibold text-sm">Moneda</p>
                <p className="text-app-muted text-xs">Moneda predeterminada para reportes.</p>
              </div>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={editData.currency}
                    onChange={e => setEditData({ ...editData, currency: e.target.value as any })}
                    className="appearance-none bg-app-elevated border border-app-border rounded-lg pl-3 pr-8 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-app-primary"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="MXN">MXN</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-app-muted flex items-center">
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                  </div>
                </div>
              ) : (
                <span className="font-bold text-app-primary bg-app-primary/10 px-3 py-1 rounded-lg text-sm">{profile?.currency}</span>
              )}
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section>
          <h2 className="text-sm font-bold text-app-muted uppercase tracking-wider mb-3">Sesión</h2>
          <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-sm">
            <p className="text-app-muted text-xs mb-4">
              Cerrar sesión en este dispositivo.
            </p>
            <button
              onClick={handleLogout}
              className="btn-modern btn-danger btn-ghost w-full py-3 bg-app-danger/10 text-app-danger hover:bg-app-danger hover:text-white transition-all shadow-none hover:shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;