import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  RotateCcw, 
  Flame,
  Check,
  Film
} from 'lucide-react';

const DB_NAME = 'SigmaStudentMediaDB';
const STORE_NAME = 'backgroundMedia';
const KEY_NAME = 'customStudentBg';

// IndexedDB helper to persist custom video or image blob locally
const openMediaDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const saveCustomMedia = async (file: File): Promise<void> => {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(file, KEY_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

const getCustomMedia = async (): Promise<File | null> => {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_NAME);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const clearCustomMedia = async (): Promise<void> => {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // silent catch
  }
};

// Canvas animation simulating floating glowing ember particles & dust motes from the video
const FloatingEmbersCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 800;
      height = canvas.height = canvas.parentElement?.clientHeight || 400;
    };

    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      alpha: number;
      maxAlpha: number;
      dAlpha: number;
      hue: number;
    }

    const particles: Particle[] = Array.from({ length: 38 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.45) * 0.35,
      vy: -(Math.random() * 0.45 + 0.15), // drift softly upward
      alpha: Math.random() * 0.6 + 0.1,
      maxAlpha: Math.random() * 0.5 + 0.3,
      dAlpha: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
      hue: Math.random() > 0.4 ? 35 : 20, // warm amber to ember orange
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.dAlpha;

        if (p.alpha > p.maxAlpha || p.alpha < 0.08) {
          p.dAlpha = -p.dAlpha;
        }

        // Wrap around boundaries
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        // Draw soft glowing spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${Math.max(0, p.alpha)})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 55%, 0.8)`;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10 mix-blend-screen opacity-90" 
    />
  );
};

interface StudentHeroBackgroundProps {
  children?: React.ReactNode;
  variant?: 'full-canvas' | 'card-banner';
  className?: string;
  showControls?: boolean;
}

export const StudentHeroBackground: React.FC<StudentHeroBackgroundProps> = ({
  children,
  className = '',
  showControls = true,
}) => {
  const [bgMode, setBgMode] = useState<'ember' | 'silhouette' | 'dark' | 'custom'>('ember');
  const [overlayDim, setOverlayDim] = useState<'focus' | 'vibrant'>('focus'); // focus = 75% dark, vibrant = 50%
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [customMediaType, setCustomMediaType] = useState<'video' | 'image'>('video');
  const [showSettings, setShowSettings] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted custom media from IndexedDB on mount
  useEffect(() => {
    getCustomMedia().then((file) => {
      if (file) {
        const url = URL.createObjectURL(file);
        setCustomMediaUrl(url);
        setCustomMediaType(file.type.startsWith('video') ? 'video' : 'image');
        setBgMode('custom');
      }
    });

    return () => {
      if (customMediaUrl) {
        URL.revokeObjectURL(customMediaUrl);
      }
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await saveCustomMedia(file);
      if (customMediaUrl) {
        URL.revokeObjectURL(customMediaUrl);
      }
      const newUrl = URL.createObjectURL(file);
      setCustomMediaUrl(newUrl);
      setCustomMediaType(file.type.startsWith('video') ? 'video' : 'image');
      setBgMode('custom');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save custom media', err);
    }
  };

  const handleReset = async () => {
    await clearCustomMedia();
    if (customMediaUrl) {
      URL.revokeObjectURL(customMediaUrl);
      setCustomMediaUrl(null);
    }
    setBgMode('ember');
  };

  const isDarkOnly = bgMode === 'dark';
  const overlayOpacity = overlayDim === 'focus' 
    ? 'bg-black/70 backdrop-blur-[1px]' 
    : 'bg-black/45 backdrop-blur-none';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Media Layer */}
      {!isDarkOnly && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Custom Video / Media if selected */}
          {bgMode === 'custom' && customMediaUrl ? (
            customMediaType === 'video' ? (
              <video
                src={customMediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-center scale-105"
              />
            ) : (
              <img
                src={customMediaUrl}
                alt="Student Custom Background"
                className="w-full h-full object-cover object-center"
              />
            )
          ) : bgMode === 'silhouette' ? (
            /* Crimson Red Silhouette Artwork */
            <div className="relative w-full h-full">
              <img
                src="/assets/student-bg.jpg"
                alt="Silhouette Crimson Background"
                className="w-full h-full object-cover object-center scale-105"
              />
              <div 
                className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)',
                  backgroundSize: '4px 4px'
                }}
              />
            </div>
          ) : (
            /* Default: Warm Amber Ember & Cosmic Smoke Video Atmosphere */
            <div className="relative w-full h-full bg-[#07090F]">
              <img
                src="/assets/amber-ember-bg.jpg"
                alt="Amber Ember Cosmic Background"
                className="w-full h-full object-cover object-top scale-105 animate-pulse-slow"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = '/assets/student-bg.jpg';
                }}
              />

              {/* Dynamic Fiery Warm Glow at top-left matching the video */}
              <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#EA580C]/40 via-[#F97316]/25 to-transparent blur-3xl animate-pulse" />
              
              {/* Soft smoky dark vignette gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-black/30" />
              
              {/* Particle Spark Canvas */}
              <FloatingEmbersCanvas />
            </div>
          )}

          {/* Dark Overlay for optimal text readability & KaTeX formula clarity */}
          <div className={`absolute inset-0 transition-colors duration-500 ${overlayOpacity}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/60" />
        </div>
      )}

      {/* Floating Control Button for Background */}
      {showControls && (
        <div className="absolute top-3 right-3 z-30 flex items-center space-x-2">
          {uploadSuccess && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#10B981] text-black font-semibold shadow-lg flex items-center space-x-1 animate-fade-in">
              <Check className="w-3 h-3" />
              <span>Video Terpasang!</span>
            </span>
          )}

          <button
            id="student-bg-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/15 backdrop-blur-md text-[11px] font-semibold transition-all shadow-md cursor-pointer group"
            title="Pengaturan Latar Belakang Beranda"
          >
            <Flame className="w-3.5 h-3.5 text-[#F97316] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Tema Background</span>
          </button>

          {/* Dropdown Settings Menu */}
          {showSettings && (
            <div className="absolute right-0 top-10 w-72 rounded-2xl bg-[#18181C]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-4 z-40 text-xs text-[#E5E5E5] space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Visual Background</span>
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-[11px] font-mono text-[#8E8E93] block mb-1.5 uppercase">
                  Pilihan Tampilan:
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setBgMode('ember')}
                    className={`w-full px-2.5 py-2 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      bgMode === 'ember'
                        ? 'bg-[#EA580C]/25 border-[#EA580C] text-white'
                        : 'bg-white/5 border-white/10 text-[#A1A1AA] hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white text-[11px] block">Cahaya Bara & Partikel (Baru)</span>
                      <span className="text-[9px] text-[#A1A1AA]">Efek Nebula Hangat & Floating Sparks</span>
                    </div>
                    {bgMode === 'ember' && <Check className="w-3.5 h-3.5 text-[#F97316]" />}
                  </button>

                  <button
                    onClick={() => setBgMode('silhouette')}
                    className={`w-full px-2.5 py-2 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      bgMode === 'silhouette'
                        ? 'bg-[#E11D48]/20 border-[#E11D48] text-white'
                        : 'bg-white/5 border-white/10 text-[#A1A1AA] hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white text-[11px] block">Siluet Merah TKA</span>
                      <span className="text-[9px] text-[#A1A1AA]">Estetika Crimson Poster</span>
                    </div>
                    {bgMode === 'silhouette' && <Check className="w-3.5 h-3.5 text-[#E11D48]" />}
                  </button>

                  <button
                    onClick={() => setBgMode('dark')}
                    className={`w-full px-2.5 py-2 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      bgMode === 'dark'
                        ? 'bg-white/20 border-white text-white'
                        : 'bg-white/5 border-white/10 text-[#A1A1AA] hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white text-[11px] block">Gelap Minimalis</span>
                      <span className="text-[9px] text-[#A1A1AA]">Fokus Polos Standar</span>
                    </div>
                    {bgMode === 'dark' && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              </div>

              {/* Upload Custom Video/Image button */}
              <div>
                <label className="text-[11px] font-mono text-[#8E8E93] block mb-1.5 uppercase">
                  Unggah Video / File MP4:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#EA580C]/30 to-[#C2410C]/20 hover:from-[#EA580C]/40 hover:to-[#C2410C]/30 border border-[#EA580C]/40 text-white font-medium text-[11px] transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#FB923C]" />
                  <span>Pilih File Video MP4 dari Perangkat</span>
                </button>
                <p className="text-[10px] text-[#71717A] mt-1 italic">
                  *Pilih file video MP4 yang diunggah untuk diputar secara looping otomatis.
                </p>
              </div>

              {/* Contrast / Dimmer Level */}
              {bgMode !== 'dark' && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-[#8E8E93]">Tingkat Redup (Overlay):</span>
                    <span className="text-[10px] font-mono text-[#10B981]">
                      {overlayDim === 'focus' ? 'Fokus Belajar (70%)' : 'Vibrant Terang (45%)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setOverlayDim('focus')}
                      className={`px-2 py-1.5 rounded-lg text-center border text-[11px] transition-all cursor-pointer ${
                        overlayDim === 'focus'
                          ? 'bg-[#10B981]/20 border-[#10B981] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-[#A1A1AA]'
                      }`}
                    >
                      Fokus Belajar
                    </button>
                    <button
                      onClick={() => setOverlayDim('vibrant')}
                      className={`px-2 py-1.5 rounded-lg text-center border text-[11px] transition-all cursor-pointer ${
                        overlayDim === 'vibrant'
                          ? 'bg-[#EA580C]/20 border-[#EA580C] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-[#A1A1AA]'
                      }`}
                    >
                      Vibrant / Terang
                    </button>
                  </div>
                </div>
              )}

              {/* Reset to Default */}
              {bgMode === 'custom' && (
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-[#8E8E93] hover:text-white text-[10px] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Kembalikan ke Cahaya Bara Default</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
