import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { SUPABASE_CONFIG, testSupabaseConnection } from '../services/supabaseClient';
import { Database, ShieldCheck, Key, Table, Copy, Check, Lock, Eye, ArrowRight, Wifi, RefreshCw, Server, Globe } from 'lucide-react';

export const SupabaseInspectorView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'tables' | 'rls' | 'sql' | 'credentials'>('credentials');
  const [connStatus, setConnStatus] = useState<{
    loading: boolean;
    connected: boolean;
    latencyMs: number;
    message: string;
    counts?: { modules: number; slides: number; questions: number };
  }>({
    loading: true,
    connected: false,
    latencyMs: 0,
    message: 'Memeriksa koneksi ke Supabase...',
  });

  const checkConnection = async () => {
    setConnStatus(prev => ({ ...prev, loading: true }));
    const res = await testSupabaseConnection();
    setConnStatus({
      loading: false,
      connected: res.connected,
      latencyMs: res.latencyMs,
      message: res.message,
      counts: res.counts
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const tables = [
    {
      name: 'profiles',
      description: 'Menyimpan identitas sarjana matematika, peran (student/teacher), dan konfigurasi avatar.',
      columns: ['id (UUID, PK)', 'email (TEXT)', 'full_name (TEXT)', 'role (TEXT: student | teacher)', 'school (TEXT)', 'class_grade (TEXT)', 'avatar_config (JSONB)', 'created_at (TIMESTAMPTZ)'],
      rlsSummary: 'Siswa hanya dapat melihat & mengedit profil miliknya sendiri; guru dapat melihat daftar nama profil.'
    },
    {
      name: 'modules',
      description: 'Katalog kurikulum matematika TKA Kelas XI MAS Darunnajah 9 (5 Modul).',
      columns: ['id (TEXT, PK)', 'order_index (INT)', 'title (TEXT)', 'domain (TEXT)', 'description (TEXT)', 'accent_color (TEXT)', 'cover_art_type (TEXT)', 'estimated_duration (TEXT)'],
      rlsSummary: 'Publik terotentikasi dapat membaca modul (SELECT). Hanya admin/guru yang dapat mengubah (UPDATE/INSERT).'
    },
    {
      name: 'slides',
      description: 'Materi interaktif berbasis track untuk tiap modul.',
      columns: ['id (TEXT, PK)', 'module_id (TEXT, FK)', 'order_index (INT)', 'title (TEXT)', 'category (TEXT)', 'content_markdown (TEXT)', 'math_formulas (JSONB)', 'key_takeaway (TEXT)'],
      rlsSummary: 'Publik terotentikasi dapat membaca seluruh slide materi.'
    },
    {
      name: 'questions',
      description: 'Bank 15 soal TKA per modul beserta opsi, jawaban benar, dan pembahasan pedagogis.',
      columns: ['id (TEXT, PK)', 'module_id (TEXT, FK)', 'order_index (INT)', 'question_text (TEXT)', 'options (JSONB)', 'correct_option (TEXT)', 'explanation (TEXT)', 'difficulty (TEXT)', 'tka_concept (TEXT)'],
      rlsSummary: 'Siswa dapat membaca teks soal & opsi. Kunci & pembahasan hanya diakses saat review setelah submit.'
    },
    {
      name: 'quiz_attempts',
      description: 'Riwayat pengerjaan kuis siswa (skor, waktu, jawaban, status kelulusan ≥ 75%).',
      columns: ['id (TEXT, PK)', 'user_id (UUID, FK)', 'module_id (TEXT, FK)', 'score (INT)', 'passed (BOOLEAN)', 'time_spent_seconds (INT)', 'answers (JSONB)', 'started_at (TIMESTAMPTZ)', 'completed_at (TIMESTAMPTZ)'],
      rlsSummary: 'Strict RLS: Siswa HANYA dapat membaca & menulis riwayat pengerjaan miliknya (auth.uid() = user_id). Guru hanya membaca dalam format agregat via secure Postgres view.'
    },
    {
      name: 'discussions',
      description: 'Thread tanya jawab dan diskusi matematis per modul.',
      columns: ['id (TEXT, PK)', 'module_id (TEXT, FK)', 'author_id (UUID, FK)', 'author_name (TEXT)', 'title (TEXT)', 'content (TEXT)', 'upvotes (JSONB)', 'is_pinned (BOOLEAN)', 'created_at (TIMESTAMPTZ)'],
      rlsSummary: 'Semua pengguna terotentikasi dapat membaca & membuat thread. Fitur semat (PIN) dibatasi untuk peran guru.'
    },
  ];

  const rlsPolicies = [
    {
      table: 'profiles',
      policyName: 'Users can view own profile',
      action: 'SELECT',
      using: 'auth.uid() = id',
    },
    {
      table: 'profiles',
      policyName: 'Users can update own profile',
      action: 'UPDATE',
      using: 'auth.uid() = id',
    },
    {
      table: 'modules & slides',
      policyName: 'Authenticated users can read curriculum',
      action: 'SELECT',
      using: 'auth.role() = "authenticated"',
    },
    {
      table: 'quiz_attempts',
      policyName: 'Students can read own quiz attempts',
      action: 'SELECT',
      using: 'auth.uid() = user_id',
    },
    {
      table: 'quiz_attempts',
      policyName: 'Students can insert own quiz attempts',
      action: 'INSERT',
      using: 'auth.uid() = user_id',
    },
    {
      table: 'discussions',
      policyName: 'Authenticated users can read & post discussions',
      action: 'SELECT / INSERT',
      using: 'auth.role() = "authenticated"',
    },
    {
      table: 'discussions',
      policyName: 'Only teachers can pin threads',
      action: 'UPDATE (is_pinned)',
      using: 'EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = "teacher")',
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(SupabaseService.getSupabaseSchemaSQL());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1F1F1F] mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#10B981]" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Arsitektur Database Supabase & Kebijakan RLS
            </h1>
          </div>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Dirancang secara presisi oleh Arsitek Supabase untuk platform SIGMA MAS Darunnajah 9.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-center"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Skema SQL'}</span>
        </button>
      </div>

      {/* Sub-tab navigations */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#1F1F1F] pb-2">
        <button
          onClick={() => setActiveSubTab('credentials')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeSubTab === 'credentials' 
              ? 'bg-[#181818] text-white ring-1 ring-[#10B981]' 
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${connStatus.connected ? 'bg-[#10B981] animate-pulse' : 'bg-amber-400'}`} />
          <span>Status & Kredensial Supabase</span>
        </button>
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeSubTab === 'tables' 
              ? 'bg-[#181818] text-white ring-1 ring-[#10B981]' 
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Tabel Relasional ({tables.length})
        </button>
        <button
          onClick={() => setActiveSubTab('rls')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeSubTab === 'rls' 
              ? 'bg-[#181818] text-white ring-1 ring-[#10B981]' 
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Row Level Security (RLS)
        </button>
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeSubTab === 'sql' 
              ? 'bg-[#181818] text-white ring-1 ring-[#10B981]' 
              : 'text-[#888888] hover:text-white'
          }`}
        >
          Skrip SQL Lengkap
        </button>
      </div>

      {/* Tab: Credentials & Live Connection */}
      {activeSubTab === 'credentials' && (
        <div className="space-y-6">
          {/* Live Status Card */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#141414] to-[#1a1a1a] border border-[#262626] shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  connStatus.connected 
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      Supabase Cloud Database
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                      connStatus.connected 
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${connStatus.connected ? 'bg-[#10B981]' : 'bg-amber-400'}`} />
                      <span>{connStatus.connected ? 'TERHUBUNG (LIVE)' : 'MENGECEK...'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#A3A3A3] mt-1">
                    {connStatus.message}
                    {connStatus.latencyMs > 0 && ` • Latensi: ${connStatus.latencyMs}ms`}
                  </p>
                </div>
              </div>

              <button
                onClick={checkConnection}
                disabled={connStatus.loading}
                className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 self-start sm:self-center cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connStatus.loading ? 'animate-spin text-[#10B981]' : ''}`} />
                <span>Uji Koneksi Ulang</span>
              </button>
            </div>

            {/* Counts Badge Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#222222]">
              <div className="p-2.5 rounded-lg bg-[#0F0F0F] border border-[#1F1F1F]">
                <div className="text-[11px] text-[#888888]">Modul Kurikulum</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">5 Modul</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F0F0F] border border-[#1F1F1F]">
                <div className="text-[11px] text-[#888888]">Track Materi</div>
                <div className="text-lg font-mono font-bold text-[#10B981] mt-0.5">25 Slides</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F0F0F] border border-[#1F1F1F]">
                <div className="text-[11px] text-[#888888]">Bank Soal TKA</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">75 Soal</div>
              </div>
            </div>
          </div>

          {/* Credentials Listing Card */}
          <div className="p-5 rounded-xl bg-[#141414] border border-[#222222]">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Konfigurasi Kredensial Supabase
              </h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* URL */}
              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-[#727272] uppercase block font-sans font-bold">SUPABASE_URL</span>
                  <span className="text-white select-all">{SUPABASE_CONFIG.url}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1A1A] text-[#10B981] border border-[#10B981]/30 self-start sm:self-center">
                  Production Endpoint
                </span>
              </div>

              {/* Publishable Key */}
              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-[#727272] uppercase block font-sans font-bold">SUPABASE_PUBLISHABLE_KEY</span>
                  <span className="text-[#34D399] select-all truncate block max-w-md">{SUPABASE_CONFIG.publishableKey}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_CONFIG.publishableKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-white text-[11px] font-sans flex items-center space-x-1 transition-colors self-start sm:self-center shrink-0 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Disalin' : 'Salin Key'}</span>
                </button>
              </div>

              {/* JWKS URL */}
              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-[#727272] uppercase block font-sans font-bold">SUPABASE_JWKS_URL</span>
                  <span className="text-[#9CA3AF] select-all truncate block max-w-md">{SUPABASE_CONFIG.jwksUrl}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1A1A] text-[#888888] border border-[#2A2A2A] self-start sm:self-center">
                  Auth v1 JWKS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Tab: Tables */}
      {activeSubTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map(t => (
            <div key={t.name} className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-[#10B981]">
                  public.{t.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] text-[#888888]">
                  PostgreSQL Table
                </span>
              </div>
              <p className="text-xs text-[#A3A3A3] mb-3">
                {t.description}
              </p>
              <div className="p-2.5 rounded bg-[#0D0D0D] border border-[#1E1E1E] mb-3">
                <span className="text-[10px] font-mono text-[#737373] uppercase block mb-1">
                  Kolom Skema:
                </span>
                <div className="flex flex-wrap gap-1">
                  {t.columns.map((c, i) => (
                    <span key={i} className="text-[10px] font-mono text-[#D4D4D4] bg-[#171717] px-1.5 py-0.5 rounded border border-[#262626]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-[#10B981] flex items-start space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{t.rlsSummary}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: RLS */}
      {activeSubTab === 'rls' && (
        <div className="rounded-xl bg-[#141414] border border-[#222222] overflow-hidden">
          <div className="p-4 bg-[#181818] border-b border-[#222222]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Kebijakan Keamanan Row Level Security (RLS) PostgreSQL
            </h3>
            <p className="text-[11px] text-[#888888] mt-0.5">
              Menjamin privasi nilai, jawaban, dan profil siswa di tingkat kernel database PostgreSQL.
            </p>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {rlsPolicies.map((p, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#10B981]">
                      {p.table}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#222222] text-white">
                      {p.action}
                    </span>
                  </div>
                  <span className="text-[#CCCCCC] font-medium block mt-1">
                    {p.policyName}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#0D0D0D] border border-[#1E1E1E] font-mono text-[11px] text-[#34D399]">
                  USING ({p.using})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Full SQL */}
      {activeSubTab === 'sql' && (
        <div className="rounded-xl bg-[#0D0D0D] border border-[#222222] p-4 relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E1E1E]">
            <span className="font-mono text-xs text-[#8A8A8A]">
              001_sigma_initial_schema.sql
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-[#10B981] hover:underline flex items-center space-x-1 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-[#A7F3D0] leading-relaxed max-h-[500px] overflow-y-auto overflow-x-auto">
            {SupabaseService.getSupabaseSchemaSQL()}
          </pre>
        </div>
      )}
    </div>
  );
};
