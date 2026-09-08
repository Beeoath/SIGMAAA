import React, { useRef } from 'react';
import { UserProfile } from '../types';
import { 
  BookOpen, 
  BarChart3, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  LogOut, 
  Search, 
  X, 
  Sparkles,
  Edit3
} from 'lucide-react';
import { EqualizerIcon } from './EqualizerIcon';
import { SigmaEchoLogo } from './SigmaEchoLogo';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  currentTab: 'modules' | 'dashboard' | 'discussions';
  onSelectTab: (tab: 'modules' | 'dashboard' | 'discussions') => void;
  user: UserProfile;
  onOpenAvatarModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLogout?: () => void;
  isViewingSlide?: boolean;
  activeModuleName?: string;
  onOpenMathGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAvatarModal,
  searchQuery,
  onSearchChange,
  onLogout,
  isViewingSlide = false,
  activeModuleName,
  onOpenMathGuide,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: 'modules' | 'dashboard' | 'discussions'; label: string; icon: React.ReactNode }[] = [
    {
      id: 'modules',
      label: 'Daftar Modul',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: 'dashboard',
      label: user.role === 'teacher' ? 'Dasbor Agregat' : 'Dasbor Belajar',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: 'discussions',
      label: 'Forum Diskusi',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/40 transition-all">
      {/* Subtle bottom ambient gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#10B981]/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[68px]">
          {/* LEFT: Brand Wordmark & Institutional Metadata */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            {/* SIGMA Brand Button */}
            <button 
              id="brand-home-button"
              onClick={() => onSelectTab('modules')}
              className="flex items-center space-x-2 text-left group cursor-pointer focus:outline-none transition-transform hover:scale-[1.01]"
              title="SIGMA - Beranda Modul TKA Matematika"
            >
              <SigmaEchoLogo size="sm" />
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
            </button>

            {/* Institutional School Tag */}
            <div className="hidden md:flex flex-col border-l border-white/[0.1] pl-3 py-0.5 select-none">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold tracking-widest text-[#E5E5E5] uppercase">
                  MAS DARUNNAJAH 9
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  XI-MIA
                </span>
              </div>
              <span className="text-[9px] font-medium text-[#737373] tracking-wide mt-0.5">
                Platform TKA Audio-Visual Interaktif
              </span>
            </div>

            {/* Active Listening / Audio Slide Mode Equalizer Pill */}
            {isViewingSlide && (
              <div 
                id="header-active-listening-equalizer"
                className="flex items-center space-x-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/35 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in transition-all"
                title={activeModuleName ? `Sedang mempelajari: ${activeModuleName}` : "Mode Belajar Aktif (Active Listening)"}
              >
                <EqualizerIcon color="#10B981" size="md" label="Active Listening State" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10B981] hidden sm:inline truncate max-w-[110px] md:max-w-[150px] lg:max-w-[180px]">
                  {activeModuleName || 'Active Listening'}
                </span>
              </div>
            )}
          </div>

          {/* CENTER: Floating Segmented Navigation Island (Desktop) */}
          <nav 
            id="desktop-main-navigation"
            className="hidden lg:flex items-center p-1 rounded-full bg-[#131313]/90 border border-white/[0.08] shadow-inner shadow-black/60 backdrop-blur-md"
          >
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-b from-[#252525] to-[#1A1A1A] text-white border border-white/[0.14] shadow-[0_2px_10px_rgba(0,0,0,0.5)]'
                      : 'text-[#8A8A8E] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={isActive ? 'text-[#10B981]' : 'text-[#737373]'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Quick Search, Notation Guide, Role Switcher, Profile & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Quick Search Input */}
            <div className="relative hidden sm:block w-32 md:w-44 lg:w-48 group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] group-focus-within:text-[#10B981] transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                id="search-module-input"
                type="text"
                placeholder="Cari modul / rumus..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#141414] hover:bg-[#181818] focus:bg-[#161616] text-xs text-white placeholder-[#5A5A5A] rounded-full py-1.5 pl-8 pr-7 border border-white/[0.08] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/40 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="hidden lg:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-[#555555] bg-[#1C1C1C] rounded border border-white/[0.06] select-none pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            {/* Math Notation Guide trigger */}
            {onOpenMathGuide && (
              <button
                id="navbar-math-notation-trigger"
                onClick={onOpenMathGuide}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#141414] hover:bg-[#1E1E1E] border border-white/[0.08] hover:border-[#10B981]/50 text-[#CCCCCC] hover:text-white transition-all cursor-pointer shadow-sm"
                title="Kamus Notasi Matematika & Rumus TKA"
              >
                <span className="font-mono text-[#10B981] font-bold text-xs">∑</span>
                <span className="hidden xl:inline text-[11px]">Kamus Rumus</span>
              </button>
            )}

            {/* Verified Role Pill (Terkunci via Supabase Auth Metadata) */}
            <div
              id="role-indicator-pill"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border shadow-sm select-none ${
                user.role === 'teacher'
                  ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                  : 'bg-[#141414] border-white/[0.08] text-[#A3A3A3]'
              }`}
              title={`Peran terverifikasi: ${user.role === 'teacher' ? 'Guru / Pembimbing' : 'Siswa'}. Terkunci via Supabase raw_user_meta_data.`}
            >
              {user.role === 'teacher' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="hidden sm:inline font-bold text-[11px]">Guru</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-[#888888]" />
                  <span className="hidden sm:inline text-[11px]">Siswa</span>
                </>
              )}
            </div>

            {/* User Profile Capsule Trigger (Avatar + Name + Edit Indicator) */}
            <button
              id="user-avatar-trigger"
              onClick={onOpenAvatarModal}
              className="flex items-center space-x-2 p-1 pl-1.5 pr-3 rounded-full bg-[#141414] hover:bg-[#1C1C1C] border border-white/[0.08] hover:border-[#10B981]/60 transition-all group cursor-pointer shadow-sm"
              title={`Profil: ${user.name} (Klik untuk edit profil & foto)`}
            >
              <div className="relative">
                <UserAvatar
                  user={user}
                  size="sm"
                  className="w-7 h-7"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#181818] border border-[#10B981]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 className="w-1.5 h-1.5 text-[#10B981]" />
                </span>
              </div>

              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white truncate max-w-[85px] sm:max-w-[110px] group-hover:text-[#10B981] transition-colors leading-tight">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-[#737373] truncate max-w-[85px] sm:max-w-[110px] leading-tight">
                  {user.avatarConfig.focusTag || 'TKA XI'}
                </span>
              </div>
            </button>

            {/* Spotify-style Logout Button */}
            {onLogout && (
              <button
                id="spotify-logout-button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-semibold bg-[#141414] hover:bg-red-950/30 border border-white/[0.08] hover:border-red-600/40 text-[#888888] hover:text-red-400 transition-all cursor-pointer"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5 text-[#1ed760] hover:text-red-400 transition-colors" />
                <span className="hidden xl:inline text-[11px]">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM BAR (Clean, tactile, high contrast) */}
      <div className="lg:hidden border-t border-white/[0.08] py-1.5 px-3 bg-[#0D0D0D]/95 backdrop-blur-xl flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-[#10B981] font-bold'
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              <div className="relative mb-0.5">
                {tab.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-[#10B981]" />
                )}
              </div>
              <span className="mt-0.5">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
