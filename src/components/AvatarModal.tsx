import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AvatarConfig } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { UserAvatar } from './UserAvatar';
import { 
  User, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Check, 
  X, 
  Sparkles, 
  GraduationCap, 
  Palette,
  AlertCircle
} from 'lucide-react';

interface AvatarModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

const GLYPHS = ['Σ', 'π', 'f(x)', '∫', 'Δ', 'θ', '∞', '√x', 'd/dx'];

const FRAME_SHAPES: { id: 'circle' | 'hexagon' | 'rhombus' | 'square'; label: string }[] = [
  { id: 'circle', label: 'Lingkaran Baku' },
  { id: 'hexagon', label: 'Heksagon Topologi' },
  { id: 'rhombus', label: 'Belah Ketupat Vektor' },
  { id: 'square', label: 'Bujursangkar Matriks' },
];

const ACCENT_COLORS = [
  { hex: '#10B981', label: 'Emerald SIGMA' },
  { hex: '#06B6D4', label: 'Electric Cyan' },
  { hex: '#3B82F6', label: 'Deep Indigo' },
  { hex: '#F59E0B', label: 'Solar Amber' },
  { hex: '#8B5CF6', label: 'Quantum Violet' },
  { hex: '#EC4899', label: 'Rose Geometry' },
];

const FOCUS_TAGS = [
  'Aljabar & TKA',
  'Geometri Analitik',
  'Matriks & Vektor',
  'Notasi Sigma & Deret',
  'Logika & Penalaran',
  'Persiapan TKA 2026',
];

/**
 * Resizes and compresses an uploaded image file on an off-screen canvas
 * to prevent exceeding localStorage limits while keeping the image crisp.
 */
const compressImage = (file: File, maxSize = 360, quality = 0.88): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat format gambar.'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
};

export const AvatarModal: React.FC<AvatarModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
}) => {
  const [name, setName] = useState(user.name);
  const [classGrade, setClassGrade] = useState(user.classGrade || 'Kelas XI - MIA 1');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(user.photoUrl || user.avatarConfig.photoUrl);
  const [config, setConfig] = useState<AvatarConfig>(user.avatarConfig);
  const [activeTab, setActiveTab] = useState<'profile' | 'visuals'>('profile');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setClassGrade(user.classGrade || 'Kelas XI - MIA 1');
      setPhotoUrl(user.photoUrl || user.avatarConfig.photoUrl);
      setConfig(user.avatarConfig);
      setErrorMessage('');
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap unggah file foto gambar (JPG, PNG, WEBP).');
      return;
    }

    setErrorMessage('');
    setIsProcessingImage(true);

    try {
      const compressedDataUrl = await compressImage(file, 360, 0.88);
      setPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Error reading image:', err);
      setErrorMessage('Gagal memproses gambar foto. Silakan coba file lain.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // Reset file input value to allow re-uploading same file if desired
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    setErrorMessage('');
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama tidak boleh kosong.');
      return;
    }

    const updatedConfig: AvatarConfig = {
      ...config,
      photoUrl: photoUrl || undefined,
    };

    const updatedUser: UserProfile = {
      ...user,
      name: trimmedName,
      classGrade: classGrade.trim() || user.classGrade,
      avatarConfig: updatedConfig,
      photoUrl: photoUrl || undefined,
    };

    await SupabaseService.setUserProfile(updatedUser);
    onUpdateUser(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-[#262626] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="edit-profile-modal-title"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-profile-modal-title" className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Edit Profil & Foto Pengguna
              </h2>
              <p className="text-xs text-[#737373]">
                Kelola identitas diri dan foto profil akun SIGMA Anda.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1C1C] hover:bg-[#282828] flex items-center justify-center text-[#737373] hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-[#1E1E1E] bg-[#0E0E0E]/50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-bold border-b-2 mr-6 transition-all flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'border-[#10B981] text-white'
                : 'border-transparent text-[#737373] hover:text-[#CCCCCC]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto & Informasi Diri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visuals')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'visuals'
                ? 'border-[#10B981] text-white'
                : 'border-transparent text-[#737373] hover:text-[#CCCCCC]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Bingkai & Tema Aksen</span>
          </button>
        </div>

        {/* Modal Body with Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#181818] to-[#121212] border border-[#242424] flex items-center space-x-4 shadow-inner">
            <UserAvatar
              photoUrl={photoUrl}
              avatarConfig={config}
              name={name}
              size="xl"
              showBadge={true}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white truncate">
                  {name || 'Nama Siswa'}
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 uppercase shrink-0">
                  {user.role === 'teacher' ? 'Guru' : 'Siswa'}
                </span>
              </div>

              <p className="text-xs text-[#8A8A8A] truncate mt-0.5">
                {classGrade} · {user.school}
              </p>

              <div className="flex items-center space-x-2 mt-2">
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{
                    color: config.accentColor,
                    backgroundColor: `${config.accentColor}18`,
                    borderColor: `${config.accentColor}40`,
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  {config.focusTag}
                </span>

                {photoUrl ? (
                  <span className="text-[10px] text-[#10B981] font-medium flex items-center">
                    <Check className="w-3 h-3 mr-0.5" /> Foto Aktif
                  </span>
                ) : (
                  <span className="text-[10px] text-[#737373] font-medium">
                    Avatar Simbol Matematika
                  </span>
                )}
              </div>
            </div>
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* 1. Foto Profil dari Galeri */}
              <div>
                <label className="block text-[#CCCCCC] font-bold mb-2">
                  1. Foto Profil (Pilih dari Galeri / Unggah Berkas):
                </label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="profile-photo-file-input"
                />

                {/* Drag & Drop / Click Upload Box */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#303030] hover:border-[#10B981] bg-[#161616]/60 hover:bg-[#1C1C1C]'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#202020] flex items-center justify-center text-[#10B981] shadow-md">
                      {isProcessingImage ? (
                        <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {isProcessingImage ? 'Memproses gambar...' : 'Klik untuk pilih foto dari galeri'}
                      </p>
                      <p className="text-[11px] text-[#737373] mt-0.5">
                        atau seret & jatuhkan berkas gambar di sini (JPG, PNG, WEBP)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Photo */}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11px] text-[#666666]">
                    *Foto otomatis dioptimalkan secara lokal tanpa membebani browser.
                  </span>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 text-[11px] font-medium transition-colors"
                      title="Hapus foto profil dan gunakan avatar simbol matematika"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Edit Nama Sendiri */}
              <div>
                <label htmlFor="input-profile-name" className="block text-[#CCCCCC] font-bold mb-1.5">
                  2. Nama Lengkap / Nama Panggilan:
                </label>
                <div className="relative">
                  <input
                    id="input-profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda..."
                    maxLength={40}
                    className="w-full bg-[#181818] border border-[#2D2D2D] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666]">
                    {name.length}/40
                  </span>
                </div>
                <p className="text-[11px] text-[#737373] mt-1">
                  Nama ini ditampilkan pada navigasi atas, dasbor belajar, kartu evaluasi kuis, dan postingan diskusi forum.
                </p>
              </div>

              {/* 3. Edit Kelas / Jenjang */}
              <div>
                <label htmlFor="input-profile-class" className="block text-[#CCCCCC] font-bold mb-1.5">
                  3. Tingkat / Kelas:
                </label>
                <input
                  id="input-profile-class"
                  type="text"
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="Contoh: Kelas XI - MIA 1"
                  className="w-full bg-[#181818] border border-[#2D2D2D] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#10B981] transition-all"
                />
              </div>
            </div>
          )}

          {activeTab === 'visuals' && (
            <div className="space-y-5">
              {/* Bentuk Bingkai */}
              <div>
                <label className="block text-[#CCCCCC] font-bold mb-2">
                  1. Bentuk Bingkai Geometris (Frame Shape):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FRAME_SHAPES.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, frameShape: f.id }))}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        config.frameShape === f.id
                          ? 'bg-[#1F1F1F] border-[#10B981] text-white font-semibold shadow-sm'
                          : 'bg-[#161616] border-[#262626] text-[#888888] hover:text-white hover:border-[#383838]'
                      }`}
                    >
                      <span>{f.label}</span>
                      {config.frameShape === f.id && <Check className="w-4 h-4 text-[#10B981]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warna Aksen */}
              <div>
                <label className="block text-[#CCCCCC] font-bold mb-2">
                  2. Warna Aksen & Halo:
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, accentColor: c.hex }))}
                      className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                        config.accentColor === c.hex 
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#121212]' 
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {config.accentColor === c.hex && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simbol Matematika Cadangan */}
              <div>
                <label className="block text-[#CCCCCC] font-bold mb-2">
                  3. Simbol Matematika Cadangan (Digunakan jika foto tidak aktif):
                </label>
                <div className="flex flex-wrap gap-2">
                  {GLYPHS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, glyph: g }))}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm border transition-all ${
                        config.glyph === g 
                          ? 'bg-[#10B981] text-[#0D0D0D] font-bold border-[#10B981] shadow-md' 
                          : 'bg-[#181818] text-white border-[#2A2A2A] hover:border-[#444]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Peminatan / Tag Akademik */}
              <div>
                <label className="block text-[#CCCCCC] font-bold mb-2">
                  4. Fokus Akademik TKA:
                </label>
                <select
                  value={config.focusTag}
                  onChange={(e) => setConfig(prev => ({ ...prev, focusTag: e.target.value }))}
                  className="w-full bg-[#181818] border border-[#2D2D2D] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]"
                >
                  {FOCUS_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#222222] bg-[#0E0E0E] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white text-xs font-semibold transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || isProcessingImage}
            className="flex items-center space-x-2 px-6 py-2 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0D0D0D] text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#10B981]/20 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Simpan Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Also export as EditProfileModal for clearer semantic naming
export { AvatarModal as EditProfileModal };
