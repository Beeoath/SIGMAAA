import React, { useState, useEffect } from 'react';
import { UserProfile, LearningModule, QuizQuestion } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  HelpCircle, 
  Database, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileEdit,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { CompanionMotif } from './CompanionMotifs';

interface TeacherDashboardProps {
  user: UserProfile;
  modules: LearningModule[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  modules,
}) => {
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [selectedModuleInspect, setSelectedModuleInspect] = useState<string>(modules[0]?.id || 'mod-1');
  const [teacherQuestions, setTeacherQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingQuestions(true);
    SupabaseService.getTeacherQuizQuestions(selectedModuleInspect).then(qs => {
      if (isMounted) {
        setTeacherQuestions(qs);
        setIsLoadingQuestions(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedModuleInspect]);

  // Simulated aggregate statistics for MAS Darunnajah 9 (aggregate only, protecting student privacy)
  const aggregateStats = {
    totalStudentsEnrolled: 64, // Siswa Kelas XI MIA MAS Darunnajah 9
    totalAttemptsSubmitted: 142,
    classAverageScore: 78.4,
    tkaPassRate: 82.5, // percent
    mostChallengingConcepts: [
      { concept: 'Invers Fungsi Pecahan & Domain Alami', module: 'Modul 1', failRate: '28%' },
      { concept: 'Garis Singgung Lingkaran Tegak Lurus', module: 'Modul 2', failRate: '34%' },
      { concept: 'Komposisi Transformasi Matriks (M₂ · M₁)', module: 'Modul 3', failRate: '31%' },
      { concept: 'Deret Teleskopik Pecahan Parsial', module: 'Modul 4', failRate: '24%' },
      { concept: 'Negasi Implikasi Formal (~(p → q))', module: 'Modul 5', failRate: '29%' },
    ],
    moduleCompletionRates: [
      { id: 'mod-1', name: 'Komposisi Fungsi', completedRate: 94 },
      { id: 'mod-2', name: 'Geometri Lingkaran', completedRate: 86 },
      { id: 'mod-3', name: 'Matriks & Transformasi', completedRate: 78 },
      { id: 'mod-4', name: 'Barisan, Deret & Sigma', completedRate: 72 },
      { id: 'mod-5', name: 'Logika & Penalaran TKA', completedRate: 65 },
    ]
  };

  const handleCopySQL = () => {
    const sql = SupabaseService.getSupabaseSchemaSQL();
    navigator.clipboard.writeText(sql);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  const currentInspectedModule = modules.find(m => m.id === selectedModuleInspect) || modules[0];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Teacher Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#141414] border border-[#222222] shadow-xl mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Dasbor Agregat Guru & Pendamping PKM
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
              AGGREGATE ONLY
            </span>
          </div>
          <p className="text-xs text-[#8A8A8A] mt-1">
            MAS DARUNNAJAH 9 · Analitik Kohor Kelas XI untuk Persiapan Tes Kemampuan Akademik (TKA).
          </p>
          <p className="text-[11px] text-[#666666] mt-0.5">
            Sesuai pedoman etika pedagogis: Tidak ada data nama individual siswa yang terekspos ke publik.
          </p>
        </div>

        <div className="hidden md:flex items-center space-x-2">
          <CompanionMotif type="graph" size={44} subtleFloat />
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-mono text-[#737373] uppercase block mb-1">
            Siswa Terdaftar (XI)
          </span>
          <div className="text-2xl font-mono font-bold text-white flex items-center justify-between">
            <span>{aggregateStats.totalStudentsEnrolled}</span>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <span className="text-[10px] text-[#737373] mt-2 block">
            MAS Darunnajah 9
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-mono text-[#737373] uppercase block mb-1">
            Rata-rata Skor TKA
          </span>
          <div className="text-2xl font-mono font-bold text-white flex items-center justify-between">
            <span>{aggregateStats.classAverageScore}</span>
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <span className="text-[10px] text-[#10B981] mt-2 block">
            +5.2% di atas ambang batas (75)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-mono text-[#737373] uppercase block mb-1">
            Tingkat Kelulusan Kuis
          </span>
          <div className="text-2xl font-mono font-bold text-white flex items-center justify-between">
            <span>{aggregateStats.tkaPassRate}%</span>
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
          </div>
          <span className="text-[10px] text-[#737373] mt-2 block">
            Skor ≥ 75% pada percobaan
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
          <span className="text-[11px] font-mono text-[#737373] uppercase block mb-1">
            Total Kuis Diselesaikan
          </span>
          <div className="text-2xl font-mono font-bold text-white flex items-center justify-between">
            <span>{aggregateStats.totalAttemptsSubmitted}</span>
            <HelpCircle className="w-4 h-4 text-[#10B981]" />
          </div>
          <span className="text-[10px] text-[#737373] mt-2 block">
            Dari 5 Modul TKA
          </span>
        </div>
      </div>

      {/* Analytics Section: Completion by Module & Challenging Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Module Completion Progress */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#222222]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center justify-between">
            <span>Tingkat Penyelesaian Modul Kohor</span>
            <span className="font-mono text-[#10B981]">Target: 100%</span>
          </h3>

          <div className="space-y-3">
            {aggregateStats.moduleCompletionRates.map((item, idx) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white font-medium">
                    Modul {idx + 1}: {item.name}
                  </span>
                  <span className="font-mono text-[#A3A3A3]">
                    {item.completedRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#202020] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full"
                    style={{ width: `${item.completedRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenging Concepts Heatmap */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#222222]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Topik TKA yang Perlu Penguatan (Tingkat Kesulitan)</span>
          </h3>

          <div className="space-y-2.5">
            {aggregateStats.mostChallengingConcepts.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0E0E0E] border border-[#1F1F1F] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    {c.concept}
                  </span>
                  <span className="text-[10px] text-[#737373]">
                    {c.module}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-800/40">
                  {c.failRate} Salah
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Inspector for Teachers / Admins */}
      <div className="mb-8 p-5 rounded-xl bg-[#141414] border border-[#222222]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1F1F1F]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
              <FileEdit className="w-4 h-4 text-[#10B981]" />
              <span>Inspektur Konten Kurikulum & Bank Soal</span>
            </h3>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Materi slide dan bank 15 soal terstruktur database-driven
            </p>
          </div>

          <select
            value={selectedModuleInspect}
            onChange={(e) => setSelectedModuleInspect(e.target.value)}
            className="bg-[#0E0E0E] border border-[#282828] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#10B981]"
          >
            {modules.map(m => (
              <option key={m.id} value={m.id}>
                Modul {m.orderIndex}: {m.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slide List */}
          <div>
            <span className="text-[11px] font-bold text-[#A3A3A3] uppercase block mb-2">
              Slide Materi Terdaftar ({currentInspectedModule.slides.length})
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {currentInspectedModule.slides.map(s => (
                <div key={s.id} className="p-2.5 rounded bg-[#0D0D0D] border border-[#1E1E1E] text-xs">
                  <span className="text-[#10B981] font-mono font-semibold block">
                    Slide {s.orderIndex}: {s.title}
                  </span>
                  <span className="text-[10px] text-[#737373]">{s.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#A3A3A3] uppercase block">
                Bank Soal Kuis TKA ({teacherQuestions.length} Soal)
              </span>
              {isLoadingQuestions && <Loader2 className="w-3 h-3 text-[#10B981] animate-spin" />}
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {teacherQuestions.map(q => (
                <div key={q.id} className="p-2.5 rounded bg-[#0D0D0D] border border-[#1E1E1E] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#10B981] font-bold">
                      Soal #{q.orderIndex} ({q.difficulty})
                    </span>
                    <span className="text-[10px] text-white font-mono font-bold bg-[#1C1C1C] px-1.5 rounded">
                      Kunci: {q.correctOption || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[#CCCCCC] text-[11px] line-clamp-1 mt-1">
                    {q.questionText}
                  </p>
                </div>
              ))}
              {teacherQuestions.length === 0 && !isLoadingQuestions && (
                <p className="text-[11px] text-[#666666] italic py-2">Belum ada butir soal termuat.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Architecture & RLS Code Export for Tech Audit */}
      <div className="p-5 rounded-xl bg-[#0F1411] border border-[#10B981]/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Skema Database Supabase & Kebijakan RLS
            </h3>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] text-xs font-bold transition-colors"
          >
            {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSQL ? 'Tersalin!' : 'Salin SQL DDL'}</span>
          </button>
        </div>

        <p className="text-xs text-[#A3A3A3] mb-3">
          Skema PostgreSQL production-ready untuk Supabase, lengkap dengan definisi tabel, foreign key cascade, dan Row Level Security (RLS) untuk melindungi privasi siswa.
        </p>

        <div className="p-3.5 rounded-lg bg-[#080B09] border border-[#17251D] font-mono text-[11px] text-[#A7F3D0] max-h-48 overflow-y-auto overflow-x-auto">
          <pre>{SupabaseService.getSupabaseSchemaSQL().slice(0, 1000)}... (lihat salinan penuh)</pre>
        </div>
      </div>
    </div>
  );
};
