import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SigmaEchoLogo } from './SigmaEchoLogo';
import { 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Check,
  Mail,
  KeyRound,
  Sparkles,
  Info,
  Terminal,
  Cpu,
  Lock,
  Unlock,
  Shield
} from 'lucide-react';

// Iconic Spotify SVG Logo
const SpotifyIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 167.5 167.5" fill="none">
    <circle cx="83.75" cy="83.75" r="83.75" fill="#1ED760" />
    <path 
      fill="#000000" 
      d="m118.7 120.8c-1.5 2.5-4.7 3.3-7.2 1.8-19.8-12.1-44.7-14.8-74.1-8.1-2.8.6-5.6-1.1-6.2-3.9-.6-2.8 1.1-5.6 3.9-6.2 32.2-7.3 59.6-4.3 81.8 9.2 2.5 1.5 3.3 4.7 1.8 7.2zm9.6-21.4c-1.9 3.1-6 4.1-9.1 2.2-22.7-13.9-57.2-18-84-9.8-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 30.6-9.3 68.7-4.8 94.8 11.2 3.1 1.9 4.1 6 2.2 9.1zm.8-22.3c-27.2-16.2-72-17.6-97.8-9.8-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 29.8-9 79.2-7.3 110.6 11.3 3.8 2.2 5 7.1 2.8 10.9-2.2 3.8-7.1 5-11 2.8z"
    />
  </svg>
);

interface LoginPageProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess
}) => {
  const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Registration state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regNisn, setRegNisn] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');

  // Dedicated Developer Portal state (Anti-Tabrak ID)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [devKey, setDevKey] = useState('');
  const [showDevKey, setShowDevKey] = useState(false);
  const [devRole, setDevRole] = useState<'teacher' | 'student'>('teacher');
  const [devCustomName, setDevCustomName] = useState('Developer Core (SIGMA)');
  const [devUnlockAll, setDevUnlockAll] = useState(true);
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false);
  const [devErrorMsg, setDevErrorMsg] = useState('');

  const handleDevLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevErrorMsg('');

    if (!devKey.trim()) {
      setDevErrorMsg('Silakan masukkan Master Key Developer terlebih dahulu.');
      return;
    }

    setIsDevLoggingIn(true);

    try {
      const res = await SupabaseService.loginAsDeveloper({
        devKey: devKey.trim(),
        role: devRole,
        customName: devCustomName.trim(),
        unlockAll: devUnlockAll
      });

      if (res.success && res.profile) {
        setIsDevModalOpen(false);
        onLoginSuccess(res.profile);
      } else {
        setDevErrorMsg(res.error || 'Master Key Developer tidak valid.');
      }
    } catch (err: any) {
      setDevErrorMsg(err.message || 'Gagal mengaktifkan sesi developer.');
    } finally {
      setIsDevLoggingIn(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Masukkan alamat email terdaftar.');
      return;
    }

    setIsSigningIn(true);

    try {
      if (authMethod === 'magic-link') {
        const res = await SupabaseService.signInWithOtp(identifier);
        if (res.success) {
          setSuccessMsg(res.message || 'Tautan masuk ajaib (Magic Link) telah dikirim ke email Anda! Periksa kotak masuk Anda.');
        } else {
          setErrorMsg(res.error || 'Gagal mengirim magic link.');
        }
      } else {
        if (!password) {
          setErrorMsg('Kata sandi wajib diisi.');
          setIsSigningIn(false);
          return;
        }

        const res = await SupabaseService.signInWithPassword(identifier, password);
        if (res.success && res.profile) {
          onLoginSuccess(res.profile);
        } else {
          setErrorMsg(res.error || 'Email atau kata sandi tidak sesuai.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem autentikasi.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Madrasah' | 'Apple') => {
    setErrorMsg(`Integrasi SSO ${provider} madrasah sedang dalam persiapan. Silakan masuk menggunakan alamat email dan kata sandi terdaftar Anda.`);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regEmail.trim()) {
      setErrorMsg('Alamat email wajib diisi.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    if (!regName.trim()) {
      setErrorMsg('Nama lengkap siswa/guru wajib diisi.');
      return;
    }

    setIsSigningIn(true);

    try {
      const res = await SupabaseService.signUp({
        email: regEmail,
        password: regPassword,
        name: regName,
        role: regRole, // Stored into raw_user_meta_data
        nisn: regNisn.trim() || undefined,
        school: 'MAS DARUNNAJAH 9',
        classGrade: regRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'
      });

      if (res.success) {
        if (res.profile) {
          onLoginSuccess(res.profile);
        } else if (res.requiresConfirmation) {
          setSuccessMsg('Pendaftaran berhasil! Akun dan metadata peran Anda telah dibuat di Supabase Auth. Silakan periksa email Anda untuk verifikasi atau masuk menggunakan form login.');
          setIsRegisterMode(false);
          setIdentifier(regEmail);
        }
      } else {
        setErrorMsg(res.error || 'Pendaftaran gagal.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses pendaftaran.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2A2A2A] via-[#121212] to-[#000000] text-white flex flex-col font-sans selection:bg-[#1ED760] selection:text-black">
      {/* Top Spotify & SIGMA Header Bar */}
      <header className="w-full py-5 px-6 flex items-center justify-between border-b border-[#292929] bg-[#000000]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SpotifyIcon className="w-9 h-9" />
            <div className="h-6 w-px bg-white/20" />
            <SigmaEchoLogo 
              size="sm" 
              badgeText="MAS DARUNNAJAH 9" 
              badgeColor="emerald"
              interactive={true}
            />
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-[#A7A7A7]">
            <span className="font-sigma text-base text-[#1ED760] tracking-widest uppercase">SIGMA</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-[#727272]">SUPABASE AUTH CLOUD</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Container (Centered Spotify Layout) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[734px] bg-[#121212] rounded-lg p-8 sm:p-14 sm:border sm:border-[#282828] shadow-2xl">
          
          {/* Card Headline featuring SigmaEchoLogo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4 transform hover:scale-105 transition-transform duration-200">
              <SigmaEchoLogo 
                size="lg" 
                badgeText="MAS DARUNNAJAH 9" 
                badgeColor="emerald"
                interactive={true}
              />
            </div>

            <h1 className="text-3xl sm:text-[38px] font-black text-white tracking-tight leading-tight flex items-center justify-center flex-wrap gap-2.5">
              <span>{isRegisterMode ? 'Daftar ke' : 'Masuk ke'}</span>
              <span className="font-sigma text-[#1ED760] tracking-wider text-4xl sm:text-[46px] drop-shadow-[0_2px_12px_rgba(30,215,96,0.35)]">
                SIGMA
              </span>
            </h1>
            <p className="text-sm text-[#A7A7A7] mt-2 font-medium max-w-md">
              Autentikasi Terenkripsi Supabase Auth Cloud · Peran Aman Terkunci di Metadata
            </p>
          </div>

          {/* Authentication Mode Switcher (Email/Password vs Magic Link) */}
          {!isRegisterMode && (
            <div className="max-w-[324px] mx-auto mb-6 flex rounded-full bg-[#181818] p-1 border border-[#282828]">
              <button
                type="button"
                onClick={() => { setAuthMethod('password'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMethod === 'password'
                    ? 'bg-[#1ED760] text-black shadow'
                    : 'text-[#A7A7A7] hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Kata Sandi</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('magic-link'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMethod === 'magic-link'
                    ? 'bg-[#1ED760] text-black shadow'
                    : 'text-[#A7A7A7] hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Magic Link</span>
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="max-w-[324px] mx-auto mb-4 p-3 bg-[#E91429]/20 border border-[#E91429] rounded text-xs text-[#FFA4A4] font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="max-w-[324px] mx-auto mb-4 p-3 bg-[#1ED760]/15 border border-[#1ED760]/50 rounded text-xs text-[#1ED760] font-medium leading-relaxed flex items-start space-x-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Area (Standard Spotify inputs) */}
          <div className="max-w-[324px] mx-auto">
            {isRegisterMode ? (
              /* Supabase Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-1.5">
                    Email Pengguna
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@darunnajah9.sch.id"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#727272] hover:border-white focus:border-[#1ED760] focus:outline-none focus:ring-1 focus:ring-[#1ED760] rounded-[4px] px-3.5 py-3 text-sm placeholder-[#727272] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-1.5">
                    Kata Sandi (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#727272] hover:border-white focus:border-[#1ED760] focus:outline-none focus:ring-1 focus:ring-[#1ED760] rounded-[4px] px-3.5 py-3 text-sm placeholder-[#727272] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-1.5">
                    Nama Lengkap Siswa / Guru
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap Anda"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#727272] hover:border-white focus:border-[#1ED760] focus:outline-none focus:ring-1 focus:ring-[#1ED760] rounded-[4px] px-3.5 py-3 text-sm placeholder-[#727272] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-1.5">
                    NISN / NIP Madrasah (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0072819201"
                    value={regNisn}
                    onChange={(e) => setRegNisn(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#727272] hover:border-white focus:border-[#1ED760] focus:outline-none focus:ring-1 focus:ring-[#1ED760] rounded-[4px] px-3.5 py-3 text-sm placeholder-[#727272] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-white">
                      Peran Awal (Tersimpan di Metadata)
                    </label>
                    <span className="text-[10px] text-[#A7A7A7]">Terkunci Aman</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`py-2.5 px-3 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        regRole === 'student'
                          ? 'bg-[#1ED760] text-black border-[#1ED760]'
                          : 'bg-transparent text-white border-[#727272] hover:border-white'
                      }`}
                    >
                      Siswa Kelas XI
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`py-2.5 px-3 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        regRole === 'teacher'
                          ? 'bg-[#1ED760] text-black border-[#1ED760]'
                          : 'bg-transparent text-white border-[#727272] hover:border-white'
                      }`}
                    >
                      Guru / Tim PKM
                    </button>
                  </div>
                  <p className="text-[11px] text-[#727272] mt-1.5 flex items-center space-x-1">
                    <Info className="w-3 h-3 inline mr-1 shrink-0" />
                    <span>Role dikunci di Supabase raw_user_meta_data dan tidak dapat diubah bebas di klien.</span>
                  </p>
                </div>

                {/* Spotify Green Pill Submit Button */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full bg-[#1ED760] hover:bg-[#1fdf64] hover:scale-104 active:scale-98 text-black font-extrabold text-sm py-3.5 px-8 rounded-full tracking-wider uppercase transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>{isSigningIn ? 'MEMPROSES...' : 'DAFTAR KE'}</span>
                  {!isSigningIn && <span className="font-sigma text-base tracking-wider">SIGMA</span>}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                  className="w-full text-center text-xs font-bold text-[#A7A7A7] hover:text-white hover:underline transition-colors mt-2"
                >
                  Sudah punya akun? Masuk di sini
                </button>
              </form>
            ) : (
              /* Standard Supabase Login Form */
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Email Pengguna
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@darunnajah9.sch.id"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#727272] hover:border-white focus:border-[#1ED760] focus:outline-none focus:ring-1 focus:ring-[#1ED760] rounded-[4px] px-3.5 py-3 text-sm placeholder-[#727272] transition-all"
                  />
                </div>

                {authMethod === 'password' && (
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Kata sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Kata sandi akun"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#121212] text-white border border-[#727272] hover:border-white focus:border-[#1ED760] focus:outline-none focus:ring-1 focus:ring-[#1ED760] rounded-[4px] px-3.5 py-3 pr-11 text-sm placeholder-[#727272] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7A7A7] hover:text-white transition-colors p-1 cursor-pointer"
                        title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1 pb-1">
                  <div 
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center space-x-3 cursor-pointer select-none group"
                  >
                    <div 
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                        rememberMe ? 'bg-[#1ED760]' : 'bg-[#727272]'
                      }`}
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform transform ${
                          rememberMe ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-white transition-colors">
                      Ingat sesi saya
                    </span>
                  </div>
                </div>

                {/* Iconic Spotify Green Submit Pill Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full bg-[#1ED760] hover:bg-[#1fdf64] hover:scale-104 active:scale-98 text-black font-extrabold text-sm py-3.5 px-8 rounded-full tracking-wider uppercase transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>
                    {isSigningIn 
                      ? 'MEMPROSES...' 
                      : authMethod === 'magic-link' 
                        ? 'KIRIM MAGIC LINK KE EMAIL' 
                        : 'MASUK KE'}
                  </span>
                  {!isSigningIn && authMethod === 'password' && (
                    <span className="font-sigma text-base tracking-wider">SIGMA</span>
                  )}
                </button>

                {/* Forgot password link */}
                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => setAuthMethod(authMethod === 'password' ? 'magic-link' : 'password')}
                    className="text-xs font-bold text-[#A7A7A7] hover:text-[#1ED760] underline transition-colors cursor-pointer"
                  >
                    {authMethod === 'password' 
                      ? 'Lupa kata sandi? Masuk menggunakan Magic Link' 
                      : 'Kembali masuk dengan Kata Sandi'}
                  </button>
                </div>
              </form>
            )}

            {/* Spotify Divider */}
            <div className="w-full border-t border-[#292929] my-8" />

            {/* Sign up for Sigma / Spotify Switch */}
            <div className="text-center space-y-4">
              <p className="text-[#A7A7A7] text-sm font-medium">
                {isRegisterMode ? 'Sudah punya akun?' : 'Belum punya akun?'}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full py-3 px-8 rounded-full bg-transparent hover:scale-104 border border-[#727272] hover:border-white text-white font-bold text-sm transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-1.5"
              >
                <span>{isRegisterMode ? 'KEMBALI KE MASUK' : 'DAFTAR KE'}</span>
                {!isRegisterMode && <span className="font-sigma text-base text-[#1ED760] tracking-wider">SIGMA</span>}
              </button>
            </div>

            {/* Dedicated Developer Portal Trigger */}
            <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
              <span className="text-[11px] text-[#555555] font-mono">Dev ID: dev-root-sigma-001</span>
              <button
                type="button"
                id="open-dev-login-btn"
                onClick={() => {
                  setDevErrorMsg('');
                  setIsDevModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#888888] hover:text-[#1ED760] transition-colors py-1.5 px-3 rounded-md bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#1ED760]/40 cursor-pointer"
                title="Akses Konsol Pengembang Sistem (ID Khusus Anti-Tabrak)"
              >
                <Terminal className="w-3.5 h-3.5 text-[#1ED760]" />
                <span className="font-semibold">Mode Developer</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1ED760]/20 text-[#1ED760] font-bold">KHUSUS</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Developer Portal Modal (ID Khusus Anti-Tabrak) */}
      {isDevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#121212] border border-[#1ED760]/50 p-6 sm:p-8 shadow-2xl shadow-[#1ED760]/10 text-white relative">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#1ED760]/20 border border-[#1ED760]/40 flex items-center justify-center text-[#1ED760]">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>Portal Akses Developer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1ED760] text-black font-black uppercase tracking-wider">
                      Anti-Tabrak
                    </span>
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    ID Khusus Terkunci: <code className="text-[#1ED760] font-mono font-bold">dev-root-sigma-001</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#2e2e2e] text-[#A7A7A7] hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Information Notice */}
            <div className="mb-5 p-3.5 rounded-xl bg-[#181818] border border-[#282828] text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-[#1ED760] font-semibold">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Proteksi Identitas & Data Eksklusif</span>
              </div>
              <p className="text-[#A7A7A7] leading-relaxed">
                Akun ini memiliki ID khusus yang dilindungi server. Pengguna biasa (siswa maupun guru) tidak dapat mendaftar atau menimpa sesi ini sehingga riwayat pengujian Anda aman dari tubrukan data.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleDevLoginSubmit} className="space-y-4">
              {devErrorMsg && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{devErrorMsg}</span>
                </div>
              )}

              {/* Master Key Input with Encryption Notice */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">
                    Master Key Developer
                  </label>
                  <span className="flex items-center space-x-1 text-[10px] text-[#1ED760] font-mono font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>SHA-256 ENCRYPTED</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showDevKey ? 'text' : 'password'}
                    value={devKey}
                    onChange={(e) => setDevKey(e.target.value)}
                    placeholder="Masukkan Master Key Developer..."
                    className="w-full py-2.5 pl-3.5 pr-10 rounded-lg bg-[#202020] border border-[#333333] focus:border-[#1ED760] focus:ring-1 focus:ring-[#1ED760] text-sm text-white font-mono placeholder-[#666666] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDevKey(!showDevKey)}
                    className="absolute right-3 top-2.5 text-[#888888] hover:text-white transition-colors cursor-pointer"
                    title={showDevKey ? 'Sembunyikan Kunci' : 'Lihat Kunci'}
                  >
                    {showDevKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#777777] mt-1.5 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-[#1ED760] shrink-0" />
                  <span>Kunci diverifikasi melalui pencocokan digest SHA-256 satu arah (One-Way Hash).</span>
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider mb-1.5">
                  Peran Pengujian (Role Preview)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDevRole('teacher')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      devRole === 'teacher'
                        ? 'bg-[#1ED760]/20 border-[#1ED760] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#303030] text-[#A7A7A7] hover:border-[#505050]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-[#1ED760]" />
                    <span>Guru / PKM (Admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevRole('student')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      devRole === 'student'
                        ? 'bg-[#1ED760]/20 border-[#1ED760] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#303030] text-[#A7A7A7] hover:border-[#505050]'
                    }`}
                  >
                    <Cpu className="w-4 h-4 text-[#38BDF8]" />
                    <span>Siswa (Mode Uji)</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider mb-1.5">
                  Nama Akun Developer
                </label>
                <input
                  type="text"
                  value={devCustomName}
                  onChange={(e) => setDevCustomName(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-lg bg-[#202020] border border-[#333333] focus:border-[#1ED760] focus:ring-1 focus:ring-[#1ED760] text-sm text-white placeholder-[#666666] outline-none transition-all"
                />
              </div>

              {/* Unlock All Modules Checkbox */}
              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={devUnlockAll}
                    onChange={(e) => setDevUnlockAll(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#202020] border-[#444444] text-[#1ED760] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#DDDDDD] font-medium">
                    Buka Otomatis Semua 7 Modul & Kuis (Bypass Prasyarat)
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDevModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 rounded-full bg-[#202020] hover:bg-[#2a2a2a] text-[#A7A7A7] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDevLoggingIn}
                  className="w-2/3 py-2.5 px-4 rounded-full bg-[#1ED760] hover:bg-[#1fdf64] hover:scale-102 text-black font-black text-xs transition-all uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#1ED760]/20 disabled:opacity-50"
                >
                  <Terminal className="w-4 h-4" />
                  <span>{isDevLoggingIn ? 'Memvalidasi...' : 'Aktifkan Sesi Dev'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Iconic Spotify Footer */}
      <footer className="w-full py-8 px-6 text-center text-xs text-[#A7A7A7] bg-[#121212] border-t border-[#282828] mt-auto">
        <div className="max-w-[734px] mx-auto space-y-3">
          <p className="text-[11px] leading-relaxed text-[#727272]">
            Autentikasi terenkripsi oleh Supabase Auth. Peran pengguna dilindungi melalui Row Level Security & User Metadata.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[#A7A7A7]">
            <span className="hover:text-white hover:underline cursor-pointer">Bantuan</span>
            <span className="hover:text-white hover:underline cursor-pointer">Privasi</span>
            <span className="hover:text-white hover:underline cursor-pointer">Ketentuan Layanan</span>
            <span>·</span>
            <span>© 2026 SIGMA · MAS Darunnajah 9</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Also export alias for SpotifyLoginPage for full compatibility
export const SpotifyLoginPage = LoginPage;

