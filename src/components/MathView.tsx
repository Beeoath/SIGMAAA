import React, { useMemo, useState } from 'react';
import { Copy, Check, BookOpen, Search, X } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export { MathRenderer } from './MathRenderer';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
  showCopy?: boolean;
  label?: string;
}

/**
 * Safely renders LaTeX mathematical formulas using MathRenderer
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  formula,
  displayMode = true,
  className = '',
  showCopy = false,
  label,
}) => {
  const [copied, setCopied] = useState(false);

  // Clean formula if wrapped in $ or \[
  const cleanFormula = useMemo(() => {
    let clean = formula.trim();
    if (clean.startsWith('$$') && clean.endsWith('$$')) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('$') && clean.endsWith('$')) {
      clean = clean.slice(1, -1).trim();
    } else if (clean.startsWith('\\[') && clean.endsWith('\\]')) {
      clean = clean.slice(2, -2).trim();
    }
    return clean;
  }, [formula]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanFormula);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!displayMode) {
    return <MathRenderer math={cleanFormula} block={false} className={className} />;
  }

  return (
    <div
      className={`group relative p-3 sm:p-4 rounded-xl bg-[#0D0D0D] border border-[#222222] hover:border-[#10B981]/50 transition-all ${className}`}
    >
      {/* Top Header if label or copy is enabled */}
      {(label || showCopy) && (
        <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-[#737373]">
          <span className="text-[#10B981] font-semibold">{label || 'Notasi Matematika'}</span>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-xs text-[#737373] hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded bg-[#1A1A1A] hover:bg-[#262626]"
              title="Salin LaTeX"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#10B981]" />
                  <span className="text-[#10B981] font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin LaTeX</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* KaTeX Rendered Surface via MathRenderer */}
      <MathRenderer math={cleanFormula} block={true} />
    </div>
  );
};

/**
 * Parses mixed text containing LaTeX expressions like $...$ or $$...$$ using MathRenderer
 */
export const MathText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  return <MathRenderer text={text} className={className} />;
};

export interface MathNotationItem {
  id: string;
  category: string;
  name: string;
  latex: string;
  description: string;
  example: string;
}

export const TKA_MATH_NOTATIONS: MathNotationItem[] = [
  {
    id: 'notasi-1',
    category: 'Aljabar & Fungsi',
    name: 'Komposisi Fungsi',
    latex: '(f \\circ g)(x) = f(g(x))',
    description: 'Fungsi komposisi di mana luaran dari g(x) menjadi masukan fungsi f.',
    example: 'Jika f(x) = 2x dan g(x) = x + 1, maka (f ∘ g)(x) = 2(x + 1) = 2x + 2',
  },
  {
    id: 'notasi-2',
    category: 'Aljabar & Fungsi',
    name: 'Fungsi Invers Aljabar Rasional',
    latex: 'f(x) = \\frac{ax+b}{cx+d} \\implies f^{-1}(x) = \\frac{-dx+b}{cx-a}',
    description: 'Rumus cepat invers fungsi rasional pecahan linier untuk TKA.',
    example: 'Tukar posisi koefisien a dan d serta balikkan tandanya.',
  },
  {
    id: 'notasi-3',
    category: 'Geometri & Lingkaran',
    name: 'Persamaan Baku Lingkaran',
    latex: '(x - a)^2 + (y - b)^2 = r^2',
    description: 'Lingkaran berpusat di P(a, b) dengan panjang jari-jari r.',
    example: 'Pusat (3, -2) dan r = 5: (x - 3)² + (y + 2)² = 25',
  },
  {
    id: 'notasi-4',
    category: 'Geometri & Lingkaran',
    name: 'Garis Singgung Bergradien m',
    latex: 'y - b = m(x - a) \\pm r\\sqrt{1 + m^2}',
    description: 'Dua garis sejajar yang menyinggung lingkaran dengan kemiringan m.',
    example: 'Syarat tegak lurus: m₁ · m₂ = -1; syarat sejajar: m₁ = m₂.',
  },
  {
    id: 'notasi-5',
    category: 'Barisan & Deret',
    name: 'Notasi Sigma Penjumlahan',
    latex: '\\sum_{k=1}^{n} a_k = a_1 + a_2 + a_3 + \\dots + a_n',
    description: 'Operator penjumlahan beruntun untuk barisan dari indeks awal hingga indeks akhir.',
    example: '\\sum_{k=1}^{n} k = \\frac{n(n + 1)}{2}',
  },
  {
    id: 'notasi-6',
    category: 'Barisan & Deret',
    name: 'Deret Aritmetika & Geometri',
    latex: 'S_n = \\frac{n}{2}(2a + (n - 1)b) \\quad \\text{dan} \\quad S_\\infty = \\frac{a}{1 - r}',
    description: 'Jumlah n suku deret aritmetika dan jumlah tak hingga geometri konvergen (|r| < 1).',
    example: 'Deret konvergen jika rasio -1 < r < 1.',
  },
  {
    id: 'notasi-7',
    category: 'Kalkulus & Turunan',
    name: 'Aturan Rantai Turunan (Chain Rule)',
    latex: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)',
    description: 'Diferensiasi fungsi komposisi bertingkat.',
    example: 'y = (3x² + 1)⁵ => y\' = 5(3x² + 1)⁴ · (6x) = 30x(3x² + 1)⁴',
  },
  {
    id: 'notasi-8',
    category: 'Kalkulus & Turunan',
    name: 'Integral Substitusi & Parsial',
    latex: '\\int u \\, dv = u \\cdot v - \\int v \\, du',
    description: 'Teknik integrasi parsial untuk perkalian dua jenis fungsi berbeda.',
    example: 'Pilih u dengan urutan prioritas: LIATE (Log, Invers trig, Aljabar, Trig, Eksponen).',
  },
  {
    id: 'notasi-9',
    category: 'Matriks & Vektor',
    name: 'Determinan Matriks 2×2 & Invers',
    latex: 'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\implies A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}',
    description: 'Matriks memiliki invers (nonsingular) jika determinan det(A) ≠ 0.',
    example: 'det(A) = ad - bc.',
  },
  {
    id: 'notasi-10',
    category: 'Trigonometri',
    name: 'Identitas Sudut Rangkap',
    latex: '\\sin(2\\alpha) = 2\\sin\\alpha\\cos\\alpha, \\quad \\cos(2\\alpha) = \\cos^2\\alpha - \\sin^2\\alpha',
    description: 'Rumus sudut ganda untuk transformasi aljabar trigonometri.',
    example: '\\cos(2\\alpha) = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha',
  },
];

/**
 * Modal viewer for browsing key mathematical formulas & notation
 */
export const MathNotationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  if (!isOpen) return null;

  const categories = ['Semua', 'Aljabar & Fungsi', 'Geometri & Lingkaran', 'Barisan & Deret', 'Kalkulus & Turunan', 'Matriks & Vektor', 'Trigonometri'];

  const filtered = TKA_MATH_NOTATIONS.filter((item) => {
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.latex.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold text-sm">
              ∑
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Kamus Notasi Matematika & Formula TKA
              </h3>
              <p className="text-xs text-[#A3A3A3]">
                Daftar standar simbol, teorema, dan penulisan rumus LaTeX resmi SIGMA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-[#222222] bg-[#141414] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari notasi (misal: sigma, invers, matriks, turunan)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1F1F1F] border border-[#2E2E2E] text-xs sm:text-sm text-white placeholder-[#737373] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  selectedCategory === cat
                    ? 'bg-[#10B981] text-black font-bold'
                    : 'bg-[#222222] text-[#A3A3A3] hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Notations List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-[#737373] text-sm">
              Tidak ada notasi matematika yang cocok dengan pencarian "{search}".
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#181818] border border-[#242424] hover:border-[#10B981]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white tracking-tight">{item.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242424] text-[#10B981] border border-[#10B981]/30">
                    {item.category}
                  </span>
                </div>

                <div className="my-2">
                  <MathFormula formula={item.latex} displayMode={true} showCopy={true} label={item.name} />
                </div>

                <p className="text-xs text-[#CCCCCC] leading-relaxed mt-2">{item.description}</p>
                <div className="mt-1.5 text-[11px] font-mono text-[#10B981]/80">
                  <span className="text-[#737373]">Contoh / Trik: </span>
                  {item.example}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-[#222222] bg-[#161616] flex items-center justify-between text-xs text-[#737373]">
          <span>Didukung oleh KaTeX Math Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#242424] hover:bg-[#2E2E2E] text-white font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
