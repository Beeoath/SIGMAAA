import React, { useState, useRef } from 'react';
import { LearningModule, ModuleProgress, UserProfile } from '../types';
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Bell, 
  Bookmark, 
  Compass, 
  BarChart3, 
  MessageSquare, 
  User, 
  Sparkles, 
  MoreHorizontal, 
  RefreshCw, 
  Share2, 
  Plus, 
  Lock, 
  CheckCircle, 
  Flame, 
  SlidersHorizontal,
  GraduationCap,
  X,
  FileText,
  ShieldCheck,
  LogOut,
  Edit3
} from 'lucide-react';
import { ModuleCoverArt } from './ModuleCoverArt';
import { UserAvatar } from './UserAvatar';
import { SigmaEchoLogo } from './SigmaEchoLogo';
import { EqualizerIcon } from './EqualizerIcon';

interface VisionStreamingLayoutProps {
  modules: LearningModule[];
  progress: Record<string, ModuleProgress>;
  user: UserProfile;
  currentTab: 'modules' | 'dashboard' | 'discussions';
  onSelectTab: (tab: 'modules' | 'dashboard' | 'discussions') => void;
  activeModule: LearningModule | null;
  onSelectModule: (module: LearningModule) => void;
  onStartQuiz: (module: LearningModule) => void;
  isQuizActive: boolean;
  onOpenAvatarModal: () => void;
  onLogout?: () => void;
  onOpenMathGuide?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  domainFilter: string;
  onSelectDomainFilter: (domain: string) => void;
  children?: React.ReactNode;
}

export const VisionStreamingLayout: React.FC<VisionStreamingLayoutProps> = ({
  modules,
  progress,
  user,
  currentTab,
  onSelectTab,
  activeModule,
  onSelectModule,
  onStartQuiz,
  isQuizActive,
  onOpenAvatarModal,
  onLogout,
  onOpenMathGuide,
  searchQuery,
  onSearchChange,
  domainFilter,
  onSelectDomainFilter,
  children,
}) => {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter modules based on search and domain
  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain =
      domainFilter === 'all' || m.domain.toLowerCase().includes(domainFilter.toLowerCase());
    return matchesSearch && matchesDomain;
  });

  const featuredModule = modules[featuredIndex] || modules[0];
  const featuredProgress = featuredModule ? progress[featuredModule.id] : undefined;

  const nextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % modules.length);
  };

  const prevFeatured = () => {
    setFeaturedIndex((prev) => (prev - 1 + modules.length) % modules.length);
  };

  const domains = [
    { id: 'all', label: 'Semua Modul' },
    { id: 'Aljabar', label: 'Aljabar & Fungsi' },
    { id: 'Geometri', label: 'Geometri' },
    { id: 'Matriks', label: 'Matriks & Vektor' },
    { id: 'Kalkulus', label: 'Notasi Sigma & Deret' },
    { id: 'Logika', label: 'Penalaran TKA' },
  ];

  // Secondary trailer/featured cards for left column
  const trailerModules = modules.slice(0, 2);
  const continueWatchingModules = modules.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E5E5E5] relative overflow-x-hidden flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 lg:p-8 font-sans selection:bg-[#10B981] selection:text-[#0D0D0D]">
      {/* Dynamic Ambient blurred backdrop (interior spatial simulation matching the image) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full bg-[#10B981]/8 blur-[140px]" />
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#EA580C]/10 blur-[170px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[700px] h-[700px] rounded-full bg-[#06B6D4]/6 blur-[160px]" />
        <div className="absolute top-[40%] right-[30%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/5 blur-[150px]" />
        {/* Subtle interior lighting texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* 1. TOP VISIONOS / MACOS FLOATING BROWSER CHROME (matching reference image) */}
      <div className="relative z-20 w-full max-w-[1360px] flex items-center justify-between px-4 py-2 mb-3 sm:mb-4 rounded-full bg-[#1A1A1E]/60 backdrop-blur-2xl border border-white/[0.08] shadow-lg shadow-black/40 text-xs text-[#8E8E93]">
        {/* Left window control navigation buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              if (activeModule) {
                // Return to modules
                onSelectTab('modules');
              }
            }}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Kembali"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            className="w-7 h-7 rounded-full bg-white/[0.04] text-white/40 flex items-center justify-center cursor-default"
            title="Maju"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Centered browser address pill */}
        <div className="flex items-center space-x-2 px-4 py-1 rounded-full bg-black/40 border border-white/[0.06] text-[11px] font-mono text-[#D4D4D8] select-none shadow-inner max-w-xs sm:max-w-md truncate">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-[#8E8E93]">https://</span>
          <span className="text-white font-semibold">sigma.darunnajah9.sch.id</span>
          <span className="text-[#10B981] font-sans text-[10px] uppercase font-bold ml-1">/tka-matematika</span>
        </div>

        {/* Right browser actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button 
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                setShowNotificationToast(true);
                setTimeout(() => setShowNotificationToast(false), 2500);
              }
            }}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Bagikan Tautan"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onOpenMathGuide}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Buka Kamus Rumus Notasi Sigma"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame with Detached Floating Left Dock */}
      <div className="relative z-10 w-full max-w-[1360px] flex items-start gap-3 sm:gap-4 lg:gap-5">
        {/* 2. LEFT DETACHED FLOATING DOCK (as shown on left side of image) */}
        <aside className="sticky top-6 hidden md:flex flex-col items-center py-5 px-2.5 rounded-full bg-[#18181C]/75 backdrop-blur-3xl border border-white/[0.12] shadow-2xl shadow-black/80 space-y-4 select-none shrink-0">
          {/* Logo Badge in dock */}
          <button
            onClick={() => onSelectTab('modules')}
            className="w-10 h-10 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] hover:scale-105 transition-transform cursor-pointer group mb-1"
            title="SIGMA - MAS DARUNNAJAH 9"
          >
            <span className="font-serif font-black text-base group-hover:scale-110 transition-transform">Σ</span>
          </button>

          {/* Dock item: Modules (Home) */}
          <button
            onClick={() => onSelectTab('modules')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              currentTab === 'modules' && !activeModule
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Daftar Modul Pembelajaran"
          >
            <Compass className="w-5 h-5" />
            {currentTab === 'modules' && !activeModule && (
              <span className="absolute -left-1 w-1 h-3 rounded-r-full bg-[#10B981]" />
            )}
          </button>

          {/* Dock item: Dashboard */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              currentTab === 'dashboard'
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Dasbor Capaian Belajar"
          >
            <BarChart3 className="w-5 h-5" />
            {currentTab === 'dashboard' && (
              <span className="absolute -left-1 w-1 h-3 rounded-r-full bg-[#10B981]" />
            )}
          </button>

          {/* Dock item: Discussions */}
          <button
            onClick={() => onSelectTab('discussions')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              currentTab === 'discussions'
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Forum Diskusi & Tanya Jawab"
          >
            <MessageSquare className="w-5 h-5" />
            {currentTab === 'discussions' && (
              <span className="absolute -left-1 w-1 h-3 rounded-r-full bg-[#10B981]" />
            )}
          </button>

          <div className="w-6 h-[1px] bg-white/[0.1] my-1" />

          {/* Dock item: Math Notation Guide */}
          {onOpenMathGuide && (
            <button
              onClick={onOpenMathGuide}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[#10B981] hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Kamus Notasi Rumus TKA"
            >
              <span className="font-mono text-base font-bold">∫</span>
            </button>
          )}

          {/* Dock item: Edit Profile & Photo */}
          <button
            onClick={onOpenAvatarModal}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer group"
            title="Edit Foto & Profil Pengguna"
          >
            <UserAvatar user={user} size="sm" className="w-7 h-7" />
          </button>
        </aside>

        {/* 3. MAIN FROSTED GLASS APPLICATION WINDOW (matching the large glass card in image) */}
        <main className="flex-1 min-w-0 rounded-[26px] sm:rounded-[34px] bg-[#141418]/80 backdrop-blur-3xl border border-white/[0.12] shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col transition-all">
          
          {/* WINDOW INTERNAL TOP BAR (Search pill + Category pill bar + User capsule) */}
          <header className="px-4 sm:px-6 lg:px-8 pt-5 pb-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Search Pill (Left side of top bar in image) */}
            <div className="relative w-full md:w-64 lg:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#1C1C22]/90 text-xs sm:text-[13px] text-white placeholder-[#71717A] rounded-full py-2.5 pl-10 pr-9 border border-white/[0.08] focus:border-white/40 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pill Tabs (Center in image) */}
            <div className="flex items-center overflow-x-auto no-scrollbar space-x-1 sm:space-x-1.5 py-1 select-none">
              {domains.map((d) => {
                const isActive = domainFilter === d.id && currentTab === 'modules';
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      onSelectDomainFilter(d.id);
                      if (currentTab !== 'modules') onSelectTab('modules');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#0D0D0D] shadow-md shadow-white/20'
                        : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* Right Action Icons & User Profile Capsule (Right in image) */}
            <div className="flex items-center justify-end space-x-2.5">
              {/* Active Slide Equalizer Pill */}
              {activeModule && !isQuizActive && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                  <EqualizerIcon color="#10B981" size="sm" />
                  <span className="text-[10px] font-mono font-bold uppercase hidden sm:inline">Active Track</span>
                </div>
              )}

              {/* Notification Pill */}
              <button
                onClick={() => {
                  setShowNotificationToast(true);
                  setTimeout(() => setShowNotificationToast(false), 3000);
                }}
                className="w-9 h-9 rounded-full bg-[#1C1C22]/90 hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer relative"
                title="Pemberitahuan Akademik"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              </button>

              {/* User Profile Capsule with Photo and Dropdown */}
              <div 
                onClick={onOpenAvatarModal}
                className="flex items-center space-x-2.5 py-1 pl-1.5 pr-3 rounded-full bg-[#1C1C22]/90 hover:bg-[#26262E] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer shadow-sm group select-none"
                title="Klik untuk edit nama & foto profil"
              >
                <UserAvatar user={user} size="sm" className="w-7 h-7" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white group-hover:text-[#10B981] transition-colors truncate max-w-[100px] leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-[#71717A] truncate max-w-[100px] leading-tight">
                    {user.role === 'teacher' ? 'Guru TKA' : (user.classGrade || 'XI-MIA 1')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-white transition-colors group-hover:translate-x-0.5" />
              </div>
            </div>
          </header>

          {/* Toast alert */}
          {showNotificationToast && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Modul TKA Matematika MAS Darunnajah 9 telah disinkronkan dengan silabus terbaru.</span>
              </div>
              <button onClick={() => setShowNotificationToast(false)} className="text-[#10B981] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* INTERNAL CONTENT AREA */}
          <div className="p-4 sm:p-6 lg:p-7 flex-1 overflow-y-auto">
            {/* If user is inside a submodule / quiz / other tab, render it inside the frosted frame */}
            {activeModule || currentTab !== 'modules' ? (
              <div>
                {/* Back button pill to return to main vision streaming dashboard */}
                {activeModule && (
                  <div className="mb-5 flex items-center justify-between">
                    <button
                      onClick={() => onSelectTab('modules')}
                      className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold border border-white/[0.1] transition-all cursor-pointer shadow-md"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Kembali ke Beranda Modul</span>
                    </button>

                    <div className="flex items-center space-x-2 text-xs text-[#8E8E93]">
                      <span className="font-semibold text-white">{activeModule.title}</span>
                      <span>·</span>
                      <span className="text-[#10B981]">{activeModule.domain}</span>
                    </div>
                  </div>
                )}
                {children}
              </div>
            ) : (
              /* THE BENTO STREAMING LAYOUT (IDENTICAL TO REFERENCE IMAGE) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                
                {/* LEFT COLUMN (approx 3.5 cols on desktop): "New Trailer / Unggulan" + "Continue Watching" */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-5">
                  {/* Top Card: Modul Unggulan ("New Trailer" in image) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C22]/70 border border-white/[0.08] backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-[#F59E0B]" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Modul Unggulan
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#71717A] font-medium flex items-center">
                        Hari ini <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {trailerModules.map((tm) => {
                        const prog = progress[tm.id];
                        const isUnlocked = prog?.isUnlocked ?? false;
                        return (
                          <div
                            key={tm.id}
                            onClick={() => isUnlocked && onSelectModule(tm)}
                            className={`group relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#141418] p-2.5 flex items-center space-x-3 transition-all ${
                              isUnlocked 
                                ? 'hover:bg-white/[0.08] hover:border-white/20 cursor-pointer' 
                                : 'opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative bg-[#202028]">
                              <ModuleCoverArt
                                type={tm.geometricArtType}
                                accentColor={tm.accentColor}
                                isLocked={!isUnlocked}
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                  <Play className="w-3 h-3 fill-black ml-0.5" />
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-mono uppercase font-bold text-[#10B981]">
                                {tm.domain.split('&')[0]}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-[#10B981] transition-colors mt-0.5">
                                {tm.title}
                              </h4>
                              <p className="text-[11px] text-[#71717A] mt-0.5">
                                {tm.trackCount} Slide Intuitif · {tm.estimatedDuration}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Card: Lanjutkan Belajar ("Continue Watching" in image) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C22]/70 border border-white/[0.08] backdrop-blur-xl shadow-lg flex-1">
                    <div className="flex items-center justify-between mb-3.5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Lanjutkan Belajar
                      </h3>
                      <span className="text-[11px] text-[#71717A] font-mono">
                        {Object.values(progress).filter(p => p.isCompleted).length}/{modules.length} Selesai
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {continueWatchingModules.map((cMod) => {
                        const prog = progress[cMod.id];
                        const isUnlocked = prog?.isUnlocked ?? false;
                        const isCompleted = prog?.isCompleted ?? false;
                        return (
                          <div
                            key={cMod.id}
                            onClick={() => isUnlocked && onSelectModule(cMod)}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                              isUnlocked
                                ? 'hover:bg-white/[0.06] cursor-pointer group'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative bg-[#1E1E24] border border-white/[0.06]">
                                <ModuleCoverArt
                                  type={cMod.geometricArtType}
                                  accentColor={cMod.accentColor}
                                  isLocked={!isUnlocked}
                                />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-white truncate max-w-[140px] group-hover:text-[#10B981] transition-colors">
                                  {cMod.title}
                                </h5>
                                <span className="text-[10px] text-[#71717A]">
                                  {isCompleted ? '✓ Selesai' : isUnlocked ? 'Sedang Dipelajari' : 'Terkunci'}
                                </span>
                              </div>
                            </div>

                            <button
                              disabled={!isUnlocked}
                              className="w-7 h-7 rounded-full bg-white/[0.06] group-hover:bg-white text-[#A1A1AA] group-hover:text-black flex items-center justify-center transition-all shrink-0"
                            >
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (approx 8.5 cols on desktop): Big Hero Banner + "You might like" grid */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col space-y-6">
                  
                  {/* HERO CARD ("Now Trending" Spider-Man style in reference image) */}
                  {featuredModule && (
                    <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] bg-gradient-to-br from-[#1C1215] via-[#15151B] to-[#0E0E12] p-6 sm:p-8 lg:p-10 shadow-2xl min-h-[340px] sm:min-h-[380px] flex flex-col justify-between group">
                      {/* Crimson Silhouette Artwork Layer */}
                      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[65%] pointer-events-none overflow-hidden opacity-25 group-hover:opacity-40 transition-opacity mix-blend-screen">
                        <img 
                          src="/assets/student-bg.jpg" 
                          alt="Crimson Silhouette Atmosphere"
                          className="w-full h-full object-cover object-right scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E12] via-[#0E0E12]/60 to-transparent" />
                      </div>

                      {/* Geometric SVG Background Accent */}
                      <div className="absolute right-[-5%] top-[-10%] w-[45%] h-[120%] pointer-events-none opacity-30 group-hover:opacity-40 transition-opacity">
                        <ModuleCoverArt
                          type={featuredModule.geometricArtType}
                          accentColor={featuredModule.accentColor}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E12] via-[#0E0E12]/80 to-transparent pointer-events-none" />

                      {/* Top Badges */}
                      <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 backdrop-blur-md">
                            <Flame className="w-3 h-3 mr-0.5" /> Now Trending
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.1] text-white/90 border border-white/[0.1]">
                            {featuredModule.domain}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.1] text-white/90 border border-white/[0.1]">
                            15 Soal TKA
                          </span>
                        </div>

                        {/* Title matching "Spider-Man: Across the Spider-Verse" bold display */}
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-xl mb-3">
                          {featuredModule.title}
                        </h2>

                        {/* Excerpt text */}
                        <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-lg mb-6 line-clamp-3">
                          {featuredModule.shortDescription}
                        </p>
                      </div>

                      {/* Action buttons + Carousel controls */}
                      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
                        <div className="flex items-center space-x-3">
                          {/* Big White Pill Button "Watch" -> "Mulai Belajar" */}
                          <button
                            onClick={() => onSelectModule(featuredModule)}
                            className="flex items-center space-x-2 px-6 sm:px-7 py-3 rounded-full bg-white hover:bg-[#E5E5E5] text-[#0D0D0D] font-bold text-xs sm:text-sm transition-all transform hover:scale-105 shadow-xl shadow-white/20 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Mulai Belajar</span>
                          </button>

                          {/* Frosted Pill Button "Download" -> "Ikuti Kuis TKA" */}
                          <button
                            onClick={() => onStartQuiz(featuredModule)}
                            className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-white font-semibold text-xs sm:text-sm border border-white/[0.15] backdrop-blur-md transition-all cursor-pointer"
                          >
                            <GraduationCap className="w-4 h-4 text-[#10B981]" />
                            <span>Kuis 15 Soal</span>
                          </button>

                          {/* Dots Options Button */}
                          <button
                            onClick={onOpenMathGuide}
                            className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] flex items-center justify-center text-white transition-colors cursor-pointer"
                            title="Kamus Notasi Rumus"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Carousel Arrows "<" and ">" in image */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={prevFeatured}
                            className="w-9 h-9 rounded-full bg-black/40 hover:bg-white/[0.15] border border-white/[0.1] flex items-center justify-center text-white transition-colors cursor-pointer"
                            title="Modul Sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-mono text-[#71717A] px-1">
                            {featuredIndex + 1} / {modules.length}
                          </span>
                          <button
                            onClick={nextFeatured}
                            className="w-9 h-9 rounded-full bg-black/40 hover:bg-white/[0.15] border border-white/[0.1] flex items-center justify-center text-white transition-colors cursor-pointer"
                            title="Modul Selanjutnya"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM SECTION: "You might like" movie posters row */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Modul Pilihan Rekomendasi
                      </h3>
                      <button
                        onClick={() => onSelectDomainFilter('all')}
                        className="text-xs text-[#71717A] hover:text-white transition-colors font-medium cursor-pointer"
                      >
                        Lihat Semua ({filteredModules.length})
                      </button>
                    </div>

                    {/* 4 Poster Cards in a Row (The Flash, Manifest, Elemental, Interstellar style) */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredModules.slice(0, 4).map((mod) => {
                        const prog = progress[mod.id];
                        const isUnlocked = prog?.isUnlocked ?? false;
                        const isCompleted = prog?.isCompleted ?? false;
                        return (
                          <div
                            key={mod.id}
                            onClick={() => {
                              if (isUnlocked) onSelectModule(mod);
                            }}
                            className={`group relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#18181F]/90 backdrop-blur-xl transition-all duration-300 ${
                              isUnlocked
                                ? 'hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/80 hover:border-white/25 cursor-pointer'
                                : 'opacity-70 cursor-not-allowed'
                            }`}
                          >
                            {/* Portrait Cover Artwork (3:4 ratio) */}
                            <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#15151B]">
                              <ModuleCoverArt
                                type={mod.geometricArtType}
                                accentColor={mod.accentColor}
                                isLocked={!isUnlocked}
                              />

                              {/* Top domain pill inside poster */}
                              <div className="absolute top-2.5 left-2.5 z-10">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white/90 border border-white/10 backdrop-blur-md">
                                  {mod.domain.split('&')[0]}
                                </span>
                              </div>

                              {/* Completed Badge */}
                              {isCompleted && (
                                <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#10B981] text-[#0D0D0D] text-[9px] font-bold shadow-md">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  <span>LULUS</span>
                                </div>
                              )}

                              {/* Locked Overlay */}
                              {!isUnlocked && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center z-10">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1 text-white/80">
                                    <Lock className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                    Terkunci
                                  </span>
                                </div>
                              )}

                              {/* Gradient overlay at bottom of poster for title legibility */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/70 to-transparent pointer-events-none" />

                              {/* Poster Content at bottom */}
                              <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10 flex items-end justify-between">
                                <div className="min-w-0 pr-2">
                                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug truncate group-hover:text-[#10B981] transition-colors">
                                    {mod.title}
                                  </h4>
                                  <p className="text-[10px] text-[#A1A1AA] line-clamp-1 mt-0.5">
                                    {mod.shortDescription}
                                  </p>
                                </div>

                                {/* Floating White Circular Play Button (bottom right in poster like image) */}
                                {isUnlocked && (
                                  <div className="w-9 h-9 rounded-full bg-white group-hover:bg-[#10B981] text-black group-hover:text-[#0D0D0D] flex items-center justify-center shadow-xl shrink-0 transition-transform group-hover:scale-110">
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER BAR (Clean, minimalist) */}
      <footer className="w-full max-w-[1360px] mt-6 py-3 px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] z-10">
        <div className="flex items-center space-x-2">
          <SigmaEchoLogo size="xs" />
          <span>MAS DARUNNAJAH 9 · TKA MATEMATIKA</span>
        </div>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <button onClick={onOpenAvatarModal} className="hover:text-white transition-colors">Edit Profil</button>
          <button onClick={onOpenMathGuide} className="hover:text-white transition-colors">Kamus Rumus</button>
          <span className="text-[#A1A1AA] flex items-center space-x-1" title="Peran terverifikasi dan terkunci di Supabase Auth Metadata">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Peran: {user.role === 'teacher' ? 'Guru / Pembimbing' : 'Siswa'}</span>
          </span>
          {onLogout && (
            <button onClick={onLogout} className="hover:text-red-400 transition-colors">Keluar</button>
          )}
        </div>
      </footer>
    </div>
  );
};
