import React, { useState } from 'react';
import { UserProfile, ModuleProgress } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Terminal, 
  Shield, 
  Unlock, 
  ArrowLeftRight, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  User,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface DevFloatingDockProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onRefreshData: () => Promise<void>;
}

export const DevFloatingDock: React.FC<DevFloatingDockProps> = ({
  user,
  onUpdateUser,
  onRefreshData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Only render if active user is developer
  if (!user.isDev && user.id !== 'dev-root-sigma-001') {
    return null;
  }

  const showFeedback = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleToggleRole = async () => {
    const newRole = user.role === 'teacher' ? 'student' : 'teacher';
    const updated: UserProfile = {
      ...user,
      role: newRole,
      classGrade: newRole === 'teacher' ? 'System Architect & Guru Pembimbing' : 'Siswa Mode Dev (XI-MIA 1)'
    };

    onUpdateUser(updated);
    try {
      localStorage.setItem('sigma_user_profile', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showFeedback(`Peran dialihkan ke: ${newRole === 'teacher' ? 'Guru / PKM' : 'Siswa'}`);
  };

  const handleUnlockAllModules = async () => {
    try {
      const moduleIds = ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7'];
      const allUnlocked: Record<string, ModuleProgress> = {};

      moduleIds.forEach(mId => {
        allUnlocked[mId] = {
          moduleId: mId,
          isUnlocked: true,
          isCompleted: true,
          lastSlideIndex: 0,
          attemptsCount: 1,
          bestScore: 100
        };
      });

      localStorage.setItem('sigma_module_progress', JSON.stringify(allUnlocked));
      await onRefreshData();
      showFeedback('Semua 7 modul berhasil dibuka!');
    } catch (err: any) {
      showFeedback('Gagal membuka modul: ' + err.message);
    }
  };

  const handleResetModuleProgress = async () => {
    try {
      const moduleIds = ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7'];
      const resetMap: Record<string, ModuleProgress> = {};

      moduleIds.forEach((mId, idx) => {
        resetMap[mId] = {
          moduleId: mId,
          isUnlocked: idx === 0,
          isCompleted: false,
          lastSlideIndex: 0,
          attemptsCount: 0
        };
      });

      localStorage.setItem('sigma_module_progress', JSON.stringify(resetMap));
      await onRefreshData();
      showFeedback('Progres modul di-reset ke Modul 1.');
    } catch (err: any) {
      showFeedback('Gagal reset: ' + err.message);
    }
  };

  return (
    <aside aria-label="Developer Suite Dock" className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Expanded Dock */}
      {isExpanded ? (
        <div className="w-80 rounded-2xl bg-[#121212]/95 border border-[#1ED760]/60 p-4 shadow-2xl shadow-black/80 backdrop-blur-md text-white animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#282828] mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#1ED760]/20 border border-[#1ED760]/50 flex items-center justify-center text-[#1ED760]">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>DEV SUITE</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1ED760] text-black font-black uppercase">
                    Anti-Tabrak
                  </span>
                </div>
                <div className="text-[10px] text-[#888888] font-mono">
                  ID: <span className="text-[#1ED760]">dev-root-sigma-001</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-[#888888] hover:text-white hover:bg-[#202020] transition-colors"
              title="Minimize Dev Dock"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Status Feedback Notice */}
          {statusNotice && (
            <div className="mb-3 p-2 rounded-lg bg-[#1ED760]/20 border border-[#1ED760]/40 text-[#1ED760] text-xs flex items-center space-x-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Quick Dev Controls */}
          <div className="space-y-2">
            {/* Role Switcher */}
            <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold">
                  Tampilan Aktif
                </div>
                <div className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                  {user.role === 'teacher' ? (
                    <>
                      <GraduationCap className="w-3.5 h-3.5 text-[#1ED760]" />
                      <span>Guru / PKM</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Siswa XI-MIA</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleRole}
                className="py-1.5 px-2.5 rounded-lg bg-[#242424] hover:bg-[#2E2E2E] border border-[#383838] hover:border-[#1ED760]/50 text-xs font-bold text-white flex items-center space-x-1 transition-all cursor-pointer"
                title="Beralih peran tanpa logout"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#1ED760]" />
                <span>Ganti</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleUnlockAllModules}
                className="py-2 px-2.5 rounded-lg bg-[#1E2E1E] hover:bg-[#223822] border border-[#1ED760]/40 text-[#1ED760] text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                title="Buka semua modul 1-7"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Modul</span>
              </button>

              <button
                type="button"
                onClick={handleResetModuleProgress}
                className="py-2 px-2.5 rounded-lg bg-[#242424] hover:bg-[#2A2A2A] border border-[#333333] text-[#A7A7A7] hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                title="Reset progres ke modul 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Modul</span>
              </button>
            </div>

            {/* Protected Note */}
            <div className="pt-2 text-[10px] text-[#666666] flex items-center space-x-1">
              <Shield className="w-3 h-3 text-[#1ED760] shrink-0" />
              <span>Sesi ini terlindungi dari registrasi publik siswa/guru.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Floating Pill */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 py-2 px-3.5 rounded-full bg-[#121212]/90 hover:bg-[#181818] border border-[#1ED760]/60 shadow-lg shadow-black/80 text-white text-xs font-bold transition-all hover:scale-104 cursor-pointer group backdrop-blur-md"
          title="Buka Developer Suite"
        >
          <span className="w-2 h-2 rounded-full bg-[#1ED760] animate-pulse" />
          <Terminal className="w-3.5 h-3.5 text-[#1ED760]" />
          <span className="font-mono text-[11px] text-white group-hover:text-[#1ED760]">
            DEV: {user.role === 'teacher' ? 'GURU' : 'SISWA'}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-[#888888] group-hover:text-white" />
        </button>
      )}
    </aside>
  );
};
