import React, { useState, useEffect } from 'react';
import { Palette, Check, RotateCcw, Eye, Save, Sparkles, Sun, Moon, Upload, Image } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeConfig } from '../../types';

export const AdminThemeManagerView: React.FC = () => {
  const { theme, updateThemeOnServer, resetThemeOnServer, setPreviewTheme } = useTheme();

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>({ ...theme });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTheme({ ...theme });
  }, [theme]);

  const presetThemes: Array<{ id: string; name: string; primary: string; secondary: string; bg: string }> = [
    { id: 'purple', name: 'Royal Purple', primary: '#7C3AED', secondary: '#4F46E5', bg: '#F8FAFC' },
    { id: 'blue', name: 'Electric Blue', primary: '#2563EB', secondary: '#0284C7', bg: '#F0F9FF' },
    { id: 'green', name: 'Emerald Clean', primary: '#059669', secondary: '#0D9488', bg: '#F0FDF4' },
    { id: 'red', name: 'Crimson Hub', primary: '#DC2626', secondary: '#E11D48', bg: '#FFF1F2' },
    { id: 'dark', name: 'Obsidian Dark', primary: '#A855F7', secondary: '#6366F1', bg: '#090D16' },
    { id: 'light', name: 'Minimalist Slate', primary: '#475569', secondary: '#334155', bg: '#FAFAFA' },
  ];

  const handleApplyPreset = (presetId: string) => {
    switch (presetId) {
      case 'purple':
        setCurrentTheme({
          ...currentTheme,
          preset: 'purple',
          primaryColor: '#7C3AED',
          secondaryColor: '#4F46E5',
          backgroundColor: '#F8FAFC',
          textColor: '#0F172A',
          buttonColor: '#7C3AED',
          cardColor: '#FFFFFF',
          headerColor: '#FFFFFF',
          sidebarColor: '#1E1B4B',
          bottomNavColor: '#FFFFFF',
          borderRadius: '16px',
          mode: 'light',
        });
        break;
      case 'blue':
        setCurrentTheme({
          ...currentTheme,
          preset: 'blue',
          primaryColor: '#2563EB',
          secondaryColor: '#0284C7',
          backgroundColor: '#F0F9FF',
          textColor: '#0F172A',
          buttonColor: '#2563EB',
          cardColor: '#FFFFFF',
          headerColor: '#FFFFFF',
          sidebarColor: '#0F172A',
          bottomNavColor: '#FFFFFF',
          borderRadius: '12px',
          mode: 'light',
        });
        break;
      case 'green':
        setCurrentTheme({
          ...currentTheme,
          preset: 'green',
          primaryColor: '#059669',
          secondaryColor: '#0D9488',
          backgroundColor: '#F0FDF4',
          textColor: '#064E3B',
          buttonColor: '#059669',
          cardColor: '#FFFFFF',
          headerColor: '#FFFFFF',
          sidebarColor: '#022C22',
          bottomNavColor: '#FFFFFF',
          borderRadius: '16px',
          mode: 'light',
        });
        break;
      case 'red':
        setCurrentTheme({
          ...currentTheme,
          preset: 'red',
          primaryColor: '#DC2626',
          secondaryColor: '#E11D48',
          backgroundColor: '#FFF1F2',
          textColor: '#1C1917',
          buttonColor: '#DC2626',
          cardColor: '#FFFFFF',
          headerColor: '#FFFFFF',
          sidebarColor: '#18181B',
          bottomNavColor: '#FFFFFF',
          borderRadius: '14px',
          mode: 'light',
        });
        break;
      case 'dark':
        setCurrentTheme({
          ...currentTheme,
          preset: 'dark',
          primaryColor: '#A855F7',
          secondaryColor: '#6366F1',
          backgroundColor: '#090D16',
          textColor: '#F8FAFC',
          buttonColor: '#9333EA',
          cardColor: '#131B2E',
          headerColor: '#0E1526',
          sidebarColor: '#070A12',
          bottomNavColor: '#0E1526',
          borderRadius: '16px',
          mode: 'dark',
        });
        break;
      case 'light':
        setCurrentTheme({
          ...currentTheme,
          preset: 'light',
          primaryColor: '#475569',
          secondaryColor: '#334155',
          backgroundColor: '#FAFAFA',
          textColor: '#18181B',
          buttonColor: '#18181B',
          cardColor: '#FFFFFF',
          headerColor: '#FFFFFF',
          sidebarColor: '#27272A',
          bottomNavColor: '#FFFFFF',
          borderRadius: '8px',
          mode: 'light',
        });
        break;
    }
  };

  const handleLivePreview = () => {
    setPreviewTheme(currentTheme);
    setSuccessMsg('Live preview active! The current theme is applied in memory.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateThemeOnServer(currentTheme);
      setSuccessMsg('Theme settings permanently saved and applied to entire application!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset theme back to default Royal Purple?')) return;
    setSaving(true);
    try {
      await resetThemeOnServer();
      setSuccessMsg('Theme reset to default successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Theme & Appearance Manager</h2>
          <p className="text-xs text-slate-400">
            Control branding, site colors, button geometry, and visual mode in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLivePreview}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Preview Theme
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-red-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md transition-all"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* 1. Ready-Made Presets */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          1. Select Ready-Made Theme Preset
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {presetThemes.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentTheme.preset === p.id
                  ? 'border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/20 shadow-md'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded-full shadow-xs" style={{ backgroundColor: p.primary }} />
                <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: p.secondary }} />
              </div>
              <div className="text-xs font-bold text-white truncate">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Custom Color Pickers & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            2. Custom Palette & Appearance Controls
          </h3>

          {/* Website Name & Logo Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Website Brand Name</label>
              <input
                type="text"
                value={currentTheme.websiteName}
                onChange={e => setCurrentTheme({ ...currentTheme, websiteName: e.target.value })}
                placeholder="e.g. My Custom Brand"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Logo Text Mark (Fallback Monogram)</label>
              <input
                type="text"
                value={currentTheme.logoText}
                onChange={e => setCurrentTheme({ ...currentTheme, logoText: e.target.value })}
                placeholder="e.g. NX or LOGO"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase"
              />
            </div>
          </div>

          {/* Logo Image URL / File Upload */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold">Custom Logo Image (URL or Upload)</label>
              {currentTheme.logoUrl && (
                <button
                  type="button"
                  onClick={() => setCurrentTheme({ ...currentTheme, logoUrl: '' })}
                  className="text-[10px] text-red-400 hover:text-red-300 underline"
                >
                  Remove Logo Image
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {currentTheme.logoUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center">
                  <img
                    src={currentTheme.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = '0.4';
                    }}
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                >
                  {(currentTheme.logoText || currentTheme.websiteName || 'NX').slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={currentTheme.logoUrl || ''}
                  onChange={e => setCurrentTheme({ ...currentTheme, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png or paste image link"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                />

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3 h-3" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setCurrentTheme({
                                ...currentTheme,
                                logoUrl: String(event.target.result),
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP supported</span>
                </div>
              </div>
            </div>
          </div>

          {/* Color Pickers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Primary Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={currentTheme.primaryColor}
                  onChange={e => setCurrentTheme({ ...currentTheme, primaryColor: e.target.value, preset: 'custom' })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px]">{currentTheme.primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Secondary Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={currentTheme.secondaryColor}
                  onChange={e => setCurrentTheme({ ...currentTheme, secondaryColor: e.target.value, preset: 'custom' })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px]">{currentTheme.secondaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Button Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={currentTheme.buttonColor}
                  onChange={e => setCurrentTheme({ ...currentTheme, buttonColor: e.target.value, preset: 'custom' })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px]">{currentTheme.buttonColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Background Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={currentTheme.backgroundColor}
                  onChange={e => setCurrentTheme({ ...currentTheme, backgroundColor: e.target.value, preset: 'custom' })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px]">{currentTheme.backgroundColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Card Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={currentTheme.cardColor}
                  onChange={e => setCurrentTheme({ ...currentTheme, cardColor: e.target.value, preset: 'custom' })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px]">{currentTheme.cardColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Text Main Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={currentTheme.textColor}
                  onChange={e => setCurrentTheme({ ...currentTheme, textColor: e.target.value, preset: 'custom' })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px]">{currentTheme.textColor}</span>
              </div>
            </div>
          </div>

          {/* Border Radius & Visual Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Border Radius</label>
              <div className="flex items-center gap-2">
                {['8px', '12px', '16px', '20px', '24px'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCurrentTheme({ ...currentTheme, borderRadius: r })}
                    className={`px-3 py-1.5 rounded-lg border font-mono ${
                      currentTheme.borderRadius === r
                        ? 'border-purple-500 bg-purple-950 text-white font-bold'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Visual Mode</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentTheme({ ...currentTheme, mode: 'light' })}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 ${
                    currentTheme.mode === 'light'
                      ? 'border-purple-500 bg-purple-950 text-white font-bold'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTheme({ ...currentTheme, mode: 'dark' })}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 ${
                    currentTheme.mode === 'dark'
                      ? 'border-purple-500 bg-purple-950 text-white font-bold'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Live Mockup Preview
            </h3>

            {/* Simulated mini client component */}
            <div
              className="p-5 shadow-lg border space-y-4 transition-all"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                borderRadius: currentTheme.borderRadius,
                borderColor: currentTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
                color: currentTheme.textColor,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: `${currentTheme.primaryColor}20` }}>
                <div className="flex items-center gap-2">
                  {currentTheme.logoUrl ? (
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      <img
                        src={currentTheme.logoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ backgroundColor: currentTheme.primaryColor }}
                    >
                      {(currentTheme.logoText || currentTheme.websiteName || 'NX').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-bold text-xs truncate max-w-[120px]">
                    {currentTheme.websiteName}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${currentTheme.primaryColor}15`, color: currentTheme.primaryColor }}>
                  ₹2,450.00
                </span>
              </div>

              {/* Sample card */}
              <div
                className="p-3.5 border shadow-xs space-y-2"
                style={{
                  backgroundColor: currentTheme.cardColor,
                  borderRadius: currentTheme.borderRadius,
                  borderColor: currentTheme.mode === 'dark' ? '#1E293B' : '#E2E8F0',
                }}
              >
                <div className="text-[11px] font-bold">Aura Generation Node</div>
                <div className="text-[10px] text-slate-400">Daily Return: +₹35.00 / day</div>
                <button
                  type="button"
                  className="w-full py-1.5 text-[11px] font-bold text-white shadow-xs"
                  style={{
                    backgroundColor: currentTheme.buttonColor,
                    borderRadius: `calc(${currentTheme.borderRadius} - 4px)`,
                  }}
                >
                  Deploy Node (₹500.00)
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800">
            Changes propagate to all connected public client sessions instantly when saved.
          </div>
        </div>
      </div>
    </div>
  );
};
