import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  UserPlus,
  Save,
  Users,
  Upload,
  Image,
  Lock,
  KeyRound,
  Shield,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Edit2,
  X,
  Megaphone,
  Sliders,
  DollarSign,
  Smartphone,
  Send
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';

export const AdminSettingsView: React.FC = () => {
  const { admin, reloadAdminProfile } = useAdmin();
  const { refreshTheme } = useTheme();

  const [settings, setSettings] = useState<any>(null);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // My Admin Profile / Password / 2FA State
  const [myProfile, setMyProfile] = useState({
    username: admin?.username || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    fullName: admin?.fullName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: admin?.twoFactorEnabled || false,
    twoFactorPin: admin?.twoFactorPin || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // New admin creation state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Edit Sub-Admin Modal
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [savingEditAdmin, setSavingEditAdmin] = useState(false);

  const isSuperAdmin = admin?.role === 'super_admin';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchData = async () => {
    try {
      if (isSuperAdmin) {
        const resSet = await apiRequest('/admin/settings', {}, true);
        setSettings(resSet.settings);
        const resAdm = await apiRequest('/admin/admins', {}, true);
        setAdminsList(resAdm.admins || []);
      }
      // Also fetch current profile details
      const myRes = await apiRequest('/admin/me', {}, true);
      if (myRes.admin) {
        setMyProfile(prev => ({
          ...prev,
          username: myRes.admin.username || '',
          email: myRes.admin.email || '',
          phone: myRes.admin.phone || '',
          fullName: myRes.admin.fullName || '',
          twoFactorEnabled: Boolean(myRes.admin.twoFactorEnabled),
          twoFactorPin: myRes.admin.twoFactorPin || '',
        }));
      }
    } catch (err: any) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update own credentials (username, email, phone, password, 2FA)
  const handleUpdateMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myProfile.newPassword && myProfile.newPassword !== myProfile.confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }
    if (myProfile.newPassword && myProfile.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiRequest('/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({
          username: myProfile.username.trim(),
          email: myProfile.email.trim(),
          phone: myProfile.phone.trim(),
          fullName: myProfile.fullName.trim(),
          currentPassword: myProfile.currentPassword,
          newPassword: myProfile.newPassword,
          twoFactorEnabled: myProfile.twoFactorEnabled,
          twoFactorPin: myProfile.twoFactorPin.trim(),
        }),
      }, true);

      showToast('Admin profile, password, and 2FA credentials updated successfully!', 'success');
      setMyProfile(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      await reloadAdminProfile();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !isSuperAdmin) return;
    setSavingSettings(true);
    try {
      await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, true);
      await refreshTheme();
      showToast('Platform settings and branding updated successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setBroadcasting(true);
    try {
      await apiRequest('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Official Platform Announcement',
          message: announcementText.trim(),
          type: 'system',
        }),
      }, true);
      showToast('Broadcast notification sent to all user accounts!', 'success');
      setAnnouncementText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to broadcast announcement', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAdmin(true);
    try {
      await apiRequest('/admin/admins', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          fullName: newFullName.trim(),
          password: newPassword,
          role: newRole,
        }),
      }, true);
      showToast(`Admin user ${newUsername} created with role ${newRole}!`, 'success');
      setNewUsername('');
      setNewEmail('');
      setNewPhone('');
      setNewFullName('');
      setNewPassword('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create admin user', 'error');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSavingEditAdmin(true);
    try {
      await apiRequest(`/admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: editingAdmin.username,
          email: editingAdmin.email,
          phone: editingAdmin.phone,
          fullName: editingAdmin.fullName,
          role: editingAdmin.role,
          isActive: editingAdmin.isActive,
          password: editAdminPassword || undefined,
          twoFactorEnabled: editingAdmin.twoFactorEnabled,
        }),
      }, true);
      showToast(`Administrator ${editingAdmin.username} updated successfully!`, 'success');
      setEditingAdmin(null);
      setEditAdminPassword('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin', 'error');
    } finally {
      setSavingEditAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete admin account "${username}"?`)) {
      return;
    }
    try {
      await apiRequest(`/admin/admins/${id}`, { method: 'DELETE' }, true);
      showToast(`Admin ${username} removed.`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete admin', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span>Loading security & settings parameters...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-red-950/80 border-red-700 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. ADMIN PROFILE, PASSWORD & 2FA SECURITY SECTION (Primary Security Card) */}
      <form
        onSubmit={handleUpdateMyProfile}
        className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
                <Shield className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Highest Security Control
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Admin Profile & Password / 2FA Security
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Change your admin username, email, phone number, login password, and configure Two-Step Verification (2FA)
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-purple-900/60 border border-purple-700 text-purple-300 font-bold text-xs self-start">
            👑 Role: {admin?.role?.toUpperCase()}
          </span>
        </div>

        {/* Username, Email, Phone, Full Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" /> Admin Username
            </label>
            <input
              type="text"
              required
              value={myProfile.username}
              onChange={e => setMyProfile({ ...myProfile, username: e.target.value })}
              placeholder="e.g. superadmin, rootadmin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Used for admin login</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" /> Admin Email Address
            </label>
            <input
              type="email"
              required
              value={myProfile.email}
              onChange={e => setMyProfile({ ...myProfile, email: e.target.value })}
              placeholder="admin@nexus.io"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Can also be used for login</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Admin Mobile / Phone
            </label>
            <input
              type="tel"
              value={myProfile.phone}
              onChange={e => setMyProfile({ ...myProfile, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Can also be used for login</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Admin Display Name
            </label>
            <input
              type="text"
              value={myProfile.fullName}
              onChange={e => setMyProfile({ ...myProfile, fullName: e.target.value })}
              placeholder="Chief Executive Officer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Shown in top navigation</span>
          </div>
        </div>

        {/* Password Reset Sub-Section */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Lock className="w-4 h-4 text-purple-400" />
            Change Admin Password (Optional)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Current Password (if changing)</label>
              <input
                type="password"
                value={myProfile.currentPassword}
                onChange={e => setMyProfile({ ...myProfile, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">New Password (min 6 characters)</label>
              <input
                type="password"
                value={myProfile.newPassword}
                onChange={e => setMyProfile({ ...myProfile, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={myProfile.confirmPassword}
                onChange={e => setMyProfile({ ...myProfile, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Two-Step Verification (2FA) Sub-Section */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Two-Step Verification (2FA / OTP)</h4>
                <p className="text-[10px] text-slate-400">
                  Enforce an additional 6-digit Security PIN or OTP code during admin login
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={myProfile.twoFactorEnabled}
                onChange={e => setMyProfile({ ...myProfile, twoFactorEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {myProfile.twoFactorEnabled && (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Custom 6-Digit 2FA Security PIN / Backup Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={myProfile.twoFactorPin}
                  onChange={e => setMyProfile({ ...myProfile, twoFactorPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 849201 or 123456"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You will need to enter this 6-digit PIN (or simulated OTP 123456) when logging into the admin panel.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/50 text-[11px] text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1 text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> 2FA Protection Active
                </div>
                <p>
                  Unauthorized parties cannot access this admin dashboard even if they guess your password without entering your 2FA code.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save My Profile Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Admin Security & Profile Settings
          </button>
        </div>
      </form>

      {/* 2. Platform Branding & Identity (Super Admin Only) */}
      {isSuperAdmin && settings && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white">Platform Branding & Logo Identity</h3>
            <p className="text-xs text-slate-400">Change website name, logo image, and monogram displayed across the site</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Website Brand Name</label>
              <input
                type="text"
                value={settings.websiteName || ''}
                onChange={e => setSettings({ ...settings, websiteName: e.target.value })}
                placeholder="e.g. Nexus Global"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Logo Text Mark (Fallback Badge)</label>
              <input
                type="text"
                value={settings.logoText || ''}
                onChange={e => setSettings({ ...settings, logoText: e.target.value })}
                placeholder="e.g. NX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase"
              />
            </div>
          </div>

          {/* Logo Image URL / Upload */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold">Website Logo Image</label>
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logoUrl: '' })}
                  className="text-[10px] text-red-400 hover:text-red-300 underline"
                >
                  Remove Logo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {settings.logoUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center">
                  <img
                    src={settings.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLElement).style.opacity = '0.4';
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shrink-0 shadow-sm text-sm">
                  {(settings.logoText || settings.websiteName || 'NX').slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png or paste image link"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                />

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3 h-3" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = event => {
                            if (event.target?.result) {
                              setSettings({
                                ...settings,
                                logoUrl: String(event.target.result),
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Image appears in the top navigation and platform headers
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> {savingSettings ? 'Saving...' : 'Save Branding & Identity'}
            </button>
          </div>
        </form>
      )}

      {/* 3. Global Financial Policies & Announcement Ticker */}
      {isSuperAdmin && settings && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white">System Financial Limits & Policies</h3>
            <p className="text-xs text-slate-400">Withdrawal fees, limits, and home notice ticker</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Minimum Withdrawal (₹)</label>
              <input
                type="number"
                value={settings.minWithdrawal}
                onChange={e => setSettings({ ...settings, minWithdrawal: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Withdrawal (₹)</label>
              <input
                type="number"
                value={settings.maxWithdrawal}
                onChange={e => setSettings({ ...settings, maxWithdrawal: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Withdrawal Fee (%)</label>
              <input
                type="number"
                value={settings.withdrawalFeePercent}
                onChange={e => setSettings({ ...settings, withdrawalFeePercent: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          {/* Home Announcement Ticker */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Global Announcement Ticker (Shown on User Home)
            </label>
            <input
              type="text"
              value={settings.announcementTicker || ''}
              onChange={e => setSettings({ ...settings, announcementTicker: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>

          {/* Official Telegram Channel & Support Settings */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Official Telegram Channel & 24/7 Support Desk
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Telegram Channel URL</label>
                <input
                  type="url"
                  value={settings.telegramSupportUrl || 'https://t.me/investpro_india'}
                  onChange={e => setSettings({ ...settings, telegramSupportUrl: e.target.value })}
                  placeholder="https://t.me/investpro_india"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Telegram Handle / Username</label>
                <input
                  type="text"
                  value={settings.telegramUsername || 'investpro_india'}
                  onChange={e => setSettings({ ...settings, telegramUsername: e.target.value })}
                  placeholder="investpro_india"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Financial Policies
            </button>
          </div>
        </form>
      )}

      {/* 4. Broadcast System Announcement */}
      {isSuperAdmin && (
        <form onSubmit={handleBroadcast} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-400" />
              Broadcast System Announcement
            </h3>
            <p className="text-xs text-slate-400">Instantly dispatch a high-priority notification to all user inboxes</p>
          </div>

          <div>
            <textarea
              rows={2}
              required
              placeholder="Type platform announcement message..."
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={broadcasting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-md transition-all cursor-pointer"
          >
            {broadcasting ? 'Broadcasting...' : 'Broadcast to All Users'}
          </button>
        </form>
      )}

      {/* 5. Sub-Admins Management & Provisioning (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Administrator Team & Role Authorizations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage internal admin team members, phone numbers, roles, and 2FA statuses
              </p>
            </div>
          </div>

          {/* Existing Admins Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Admin Full Name</th>
                  <th className="p-3.5">Username / Email</th>
                  <th className="p-3.5">Mobile Phone</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">2FA</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {adminsList.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      {a.fullName}
                      {a.id === admin?.id && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-normal text-[9px] border border-purple-800">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="text-purple-400 font-bold">{a.username}</div>
                      <div className="text-[10px] text-slate-500">{a.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {a.phone || 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 font-bold uppercase text-[10px] border border-purple-900">
                        {a.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {a.twoFactorEnabled ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                          <ShieldCheck className="w-3 h-3" /> 2FA ON
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Disabled</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAdmin(a);
                            setEditAdminPassword('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {a.id !== admin?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAdmin(a.id, a.username)}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-red-300 border border-red-800/60"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Provision New Admin Form */}
          <form onSubmit={handleCreateAdmin} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              + Provision New Sub-Administrator
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="e.g. rajesh_admin"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="rajesh@nexus.io"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone / Mobile</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Role Permission</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="super_admin">Super Admin (Full Access)</option>
                  <option value="admin">Operations Admin (Users & Products)</option>
                  <option value="finance_admin">Finance Admin (Payouts & Verified Recharges)</option>
                  <option value="content_admin">Content Admin (Ads & Announcements)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={addingAdmin}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {addingAdmin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Provision Administrator
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Sub-Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Administrator</h3>
                <p className="text-xs text-slate-400">{editingAdmin.username}</p>
              </div>
              <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingAdmin.fullName}
                  onChange={e => setEditingAdmin({ ...editingAdmin, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editingAdmin.username}
                  onChange={e => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingAdmin.email}
                  onChange={e => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone / Mobile</label>
                <input
                  type="tel"
                  value={editingAdmin.phone || ''}
                  onChange={e => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={editingAdmin.role}
                  onChange={e => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Operations Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="content_admin">Content Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reset Password (leave empty to keep current)</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={editAdminPassword}
                  onChange={e => setEditAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-semibold">Two-Factor Authentication</span>
                <input
                  type="checkbox"
                  checked={Boolean(editingAdmin.twoFactorEnabled)}
                  onChange={e => setEditingAdmin({ ...editingAdmin, twoFactorEnabled: e.target.checked })}
                  className="w-4 h-4 accent-purple-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditAdmin}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {savingEditAdmin ? 'Saving...' : 'Save Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
