import React, { useState } from 'react';
import { LearningModule } from '../types';
import { ChevronLeft, ChevronRight, Check, BookOpen, MessageSquare, PlayCircle, Lightbulb, Bookmark } from 'lucide-react';
import { EqualizerIcon } from './EqualizerIcon';
import { MathRenderer } from './MathRenderer';
import { MathFormula, MathNotationModal } from './MathView';

interface SlideViewerProps {
  module: LearningModule;
  initialSlideIndex?: number;
  onBack: () => void;
  onStartQuiz: () => void;
  onOpenDiscussions: () => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  module,
  initialSlideIndex = 0,
  onBack,
  onStartQuiz,
  onOpenDiscussions,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);

  const currentSlide = module.slides[currentSlideIndex] || module.slides[0];
  const totalSlides = module.slides.length;
  const isLastSlide = currentSlideIndex === totalSlides - 1;

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6">
      {/* Top Header / Track Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1E1E1E]">
        <button
          id="slide-back-button"
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[#8A8A8A] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Library</span>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsMathModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#161616] text-[#A3A3A3] hover:text-white border border-[#262626] hover:border-[#10B981]/50 transition-colors cursor-pointer"
            title="Kamus Notasi Matematika & Rumus TKA"
          >
            <span className="font-mono text-[#10B981] font-bold">∑</span>
            <span className="hidden sm:inline">Kamus Notasi</span>
          </button>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-1.5 rounded-full border border-[#282828] text-xs transition-colors ${
              isBookmarked ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]' : 'text-[#8A8A8A] hover:text-white'
            }`}
            title="Tandai slide penting"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenDiscussions}
            className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-[#161616] text-[#A3A3A3] hover:text-white border border-[#262626] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden sm:inline">Diskusi Modul</span>
          </button>

          <button
            id="launch-quiz-header-button"
            onClick={onStartQuiz}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#10B981] text-[#0D0D0D] hover:bg-[#059669] transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Kuis TKA (15 Soal)</span>
          </button>
        </div>
      </div>

      {/* Main Slide Card (Streaming-Player Stage) */}
      <div className="relative rounded-xl bg-[#141414] border border-[#222222] p-6 sm:p-8 shadow-2xl">
        {/* Track / Slide badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              <EqualizerIcon color="#10B981" size="sm" label="Active Learning" />
              <span>{currentSlide.category}</span>
            </span>
            <span className="text-xs text-[#737373] font-mono">
              Slide {currentSlide.orderIndex} dari {totalSlides}
            </span>
          </div>

          <span className="text-xs text-[#525252] font-mono">
            {module.domain}
          </span>
        </div>

        {/* Slide Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight">
          {currentSlide.title}
        </h2>
        {currentSlide.subtitle && (
          <p className="text-sm font-medium text-[#10B981] mb-6">
            {currentSlide.subtitle}
          </p>
        )}

        {/* Slide Content Explanation with MathRenderer */}
        <div className="text-sm text-[#CCCCCC] leading-relaxed mb-6 font-normal">
          <MathRenderer text={currentSlide.contentMarkdown} />
        </div>

        {/* Mathematical Formulas KaTeX Rendered Panel */}
        {currentSlide.mathFormulas && currentSlide.mathFormulas.length > 0 && (
          <div className="my-6 p-4 rounded-xl bg-[#0A0A0A] border border-[#242424]">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#737373] mb-3">
              <span className="flex items-center space-x-1.5 text-white font-bold">
                <span className="text-[#10B981]">∑</span>
                <span>Formulasi & Teorema Kunci</span>
              </span>
              <span className="text-[#10B981] font-bold">TKA Standar KaTeX</span>
            </div>
            <div className="space-y-3">
              {currentSlide.mathFormulas.map((formula, idx) => (
                <MathFormula
                  key={idx}
                  formula={formula}
                  displayMode={true}
                  showCopy={true}
                  label={`Formula #${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Key Takeaway Callout */}
        <div className="p-4 rounded-lg bg-[#181818] border-l-4 border-[#10B981] flex items-start space-x-3 mb-6">
          <Lightbulb className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-0.5">
              Intisari TKA
            </h4>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {currentSlide.keyTakeaway}
            </p>
          </div>
        </div>

        {/* Interactive Check on Last Slide */}
        {isLastSlide && (
          <div className="p-5 rounded-lg bg-[#11241C] border border-[#10B981]/40 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Kamu telah menyelesaikan semua materi slide!
              </h4>
              <p className="text-xs text-[#A7F3D0]">
                Uji pemahamanmu pada Kuis TKA (15 Soal, batas waktu 20 menit). Skor minimal kelulusan adalah 75% untuk membuka modul berikutnya.
              </p>
            </div>
            <button
              id="start-quiz-bottom-button"
              onClick={onStartQuiz}
              className="flex-shrink-0 px-5 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] text-xs font-extrabold uppercase tracking-wider shadow-lg transition-all"
            >
              Mulai Kuis Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Bottom Track Controls & Progress Scrubber */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-[#121212] border border-[#1E1E1E]">
        {/* Scrubber Dots */}
        <div className="flex items-center space-x-1.5">
          {module.slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlideIndex 
                  ? 'w-6 bg-[#10B981]' 
                  : idx < currentSlideIndex 
                    ? 'w-2 bg-[#10B981]/50' 
                    : 'w-2 bg-[#262626]'
              }`}
              title={`Buka Slide ${idx + 1}: ${s.title}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1C1C1C] hover:bg-[#282828] text-white disabled:opacity-40 disabled:cursor-not-allowed border border-[#2B2B2B] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          {isLastSlide ? (
            <button
              onClick={onStartQuiz}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#10B981] text-[#0D0D0D] hover:bg-[#059669] transition-colors"
            >
              <span>Uji Soal TKA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#10B981] text-[#0D0D0D] hover:bg-[#059669] transition-colors font-bold"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Math Notation Reference Modal */}
      <MathNotationModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
      />
    </div>
  );
};
