import React, { useState, useEffect } from 'react';
import { UserProfile, LearningModule, ModuleProgress, QuizAttempt } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award, 
  Bookmark, 
  ChevronRight, 
  FileText,
  RotateCcw,
  FileEdit,
  Camera
} from 'lucide-react';
import { CompanionMotif } from './CompanionMotifs';
import { UserAvatar } from './UserAvatar';
import { StudentHeroBackground } from './StudentHeroBackground';

interface StudentDashboardProps {
  user: UserProfile;
  modules: LearningModule[];
  progress: Record<string, ModuleProgress>;
  attempts: QuizAttempt[];
  onSelectModule: (module: LearningModule) => void;
  onOpenEditProfile?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  modules,
  progress,
  attempts,
  onSelectModule,
  onOpenEditProfile,
}) => {
  const progressList = Object.values(progress) as ModuleProgress[];
  const completedCount = progressList.filter(p => p.isCompleted).length;
  const totalModules = modules.length;
  const progressPercent = Math.round((completedCount / totalModules) * 100);

  // Average score calculation
  const scoredModules = progressList.filter(p => p.bestScore !== undefined);
  const avgScore = scoredModules.length > 0
    ? Math.round(scoredModules.reduce((acc: number, curr: ModuleProgress) => acc + (curr.bestScore || 0), 0) / scoredModules.length)
    : 0;

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(SupabaseService.getCachedBookmarks());

  useEffect(() => {
    let isMounted = true;
    SupabaseService.getBookmarks().then(ids => {
      if (isMounted) setBookmarkedIds(ids);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Find bookmarked questions
  const bookmarkedQuestions: { module: LearningModule; question: any }[] = [];
  modules.forEach(m => {
    m.questions.forEach(q => {
      if (bookmarkedIds.includes(q.id)) {
        bookmarkedQuestions.push({ module: m, question: q });
      }
    });
  });

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Student Welcome Header with Crimson Silhouette Video / Artwork Background */}
      <StudentHeroBackground 
        className="rounded-2xl border border-white/15 shadow-2xl mb-6"
        showControls={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7">
          <div className="flex items-center space-x-4">
            <div className="relative group cursor-pointer" onClick={onOpenEditProfile} title="Klik untuk edit foto dan profil">
              <UserAvatar user={user} size="lg" showBadge={true} />
              {onOpenEditProfile && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Camera className="w-4 h-4 text-[#10B981]" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md">
                  {user.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/60 text-[#10B981] border border-[#10B981]/40 backdrop-blur-sm">
                  {user.classGrade}
                </span>
              </div>
              <p className="text-xs text-[#D4D4D8] mt-0.5 drop-shadow-sm">
                {user.school} · Persiapan Mandiri Tes Kemampuan Akademik (TKA)
              </p>
            </div>
          </div>

          {/* Right side: Edit Profile button & Companion Motif */}
          <div className="flex items-center space-x-3">
            {onOpenEditProfile && (
              <button
                id="dashboard-edit-profile-btn"
                onClick={onOpenEditProfile}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white hover:text-[#10B981] border border-white/20 hover:border-[#10B981]/60 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
                title="Edit foto profil dari galeri dan nama akun Anda"
              >
                <FileEdit className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Edit Profil & Foto</span>
              </button>
            )}

            <div className="hidden md:flex items-center space-x-2 pr-1">
              <CompanionMotif type="compass" size={40} subtleFloat />
            </div>
          </div>
        </div>
      </StudentHeroBackground>

      {/* Metric Cards (Academic Progress Only - No Gamification) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] uppercase mb-1">
            <span>Kelulusan Modul TKA</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {completedCount} / {totalModules}
          </div>
          <div className="w-full h-1.5 bg-[#202020] rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] uppercase mb-1">
            <span>Rata-Rata Nilai Kuis</span>
            <Award className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {avgScore > 0 ? `${avgScore}%` : 'Belum Ada'}
          </div>
          <span className="text-[10px] text-[#737373] mt-2 block">
            Target kelulusan standar TKA: ≥ 75%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] uppercase mb-1">
            <span>Soal Ditandai Bookmark</span>
            <Bookmark className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {bookmarkedQuestions.length} Soal
          </div>
          <span className="text-[10px] text-[#737373] mt-2 block">
            Daftar soal penting untuk dipelajari kembali
          </span>
        </div>
      </div>

      {/* Module-by-Module Personal Status (Playlist Discography Style) */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
          Status Pembelajaran Modul Matematika
        </h2>

        <div className="rounded-xl bg-[#141414] border border-[#222222] divide-y divide-[#1F1F1F] overflow-hidden">
          {modules.map((m) => {
            const p = progress[m.id];
            const isUnlocked = p?.isUnlocked;
            const isCompleted = p?.isCompleted;
            const bestScore = p?.bestScore;

            return (
              <div 
                key={m.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#181818] transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <span className="font-mono text-xs text-[#10B981] font-bold w-6">
                    0{m.orderIndex}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#737373]">
                      {m.domain} · {m.trackCount} Slide · 15 Soal
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {bestScore !== undefined && (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      bestScore >= 75 
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' 
                        : 'bg-amber-950/20 text-amber-400 border-amber-800/30'
                    }`}>
                      Nilai: {bestScore}%
                    </span>
                  )}

                  {isCompleted ? (
                    <span className="flex items-center space-x-1 text-xs text-[#10B981] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Lulus</span>
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-xs text-[#A3A3A3]">
                      Tersedia
                    </span>
                  ) : (
                    <span className="text-xs text-[#555555]">
                      Terkunci
                    </span>
                  )}

                  {isUnlocked && (
                    <button
                      onClick={() => onSelectModule(m)}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1F1F1F] hover:bg-[#10B981] hover:text-[#0D0D0D] text-white border border-[#2F2F2F] transition-colors"
                    >
                      Buka
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookmarked Questions List */}
      {bookmarkedQuestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-[#10B981]" />
            <span>Koleksi Soal Ditandai ({bookmarkedQuestions.length})</span>
          </h2>

          <div className="space-y-3">
            {bookmarkedQuestions.map(({ module: m, question: q }) => (
              <div key={q.id} className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
                <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-mono">
                  <span className="text-[#10B981] font-semibold">
                    Modul {m.orderIndex}: {m.title} · Soal #{q.orderIndex}
                  </span>
                  <span>{q.tkaConcept}</span>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium mb-3 whitespace-pre-line">
                  {q.questionText}
                </p>
                <div className="p-3 rounded bg-[#0E0E0E] border border-[#1E1E1E] text-xs text-[#A3A3A3]">
                  <strong className="text-[#10B981]">Kunci Jawaban ({q.correctOption}):</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Quiz Attempts Log */}
      {attempts.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
            Riwayat Percobaan Kuis Mandiri
          </h2>

          <div className="rounded-xl bg-[#141414] border border-[#222222] divide-y divide-[#1E1E1E]">
            {attempts.slice(0, 5).map(att => {
              const mod = modules.find(m => m.id === att.moduleId);
              return (
                <div key={att.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">
                      {mod?.title || att.moduleId}
                    </span>
                    <span className="text-[#737373]">
                      {new Date(att.completedAt || att.startedAt).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })} · Durasi: {Math.round(att.timeSpentSeconds / 60)} menit
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`font-mono font-bold text-sm block ${
                      att.passed ? 'text-[#10B981]' : 'text-red-400'
                    }`}>
                      {att.score}% ({att.correctCount}/15)
                    </span>
                    <span className="text-[10px] text-[#737373]">
                      {att.passed ? 'LULUS TKA' : 'BELUM LULUS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
