import React from 'react';
import { LearningModule, ModuleProgress } from '../types';
import { ModuleCoverArt } from './ModuleCoverArt';
import { Lock, CheckCircle, ArrowRight, Clock, HelpCircle, Play } from 'lucide-react';

interface ModuleCardProps {
  module: LearningModule;
  progress?: ModuleProgress;
  onSelect: (module: LearningModule) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  progress,
  onSelect,
}) => {
  const isUnlocked = progress?.isUnlocked ?? false;
  const isCompleted = progress?.isCompleted ?? false;
  const bestScore = progress?.bestScore;

  return (
    <div
      id={`module-card-${module.id}`}
      onClick={() => {
        if (isUnlocked) onSelect(module);
      }}
      className={`group relative flex flex-col p-3.5 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] transition-all duration-300 ease-out transform ${
        isUnlocked 
          ? 'cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/70 ring-1 ring-[#222222] hover:ring-[#10B981]/40' 
          : 'cursor-not-allowed opacity-75 ring-1 ring-[#1A1A1A]'
      }`}
    >
      {/* Square Cover Art with Metaphor Overlay */}
      <div className="relative w-full aspect-square mb-3.5 rounded-lg overflow-hidden">
        <ModuleCoverArt
          type={module.geometricArtType}
          accentColor={module.accentColor}
          isLocked={!isUnlocked}
        />

        {/* LOCKED STATE OVERLAY */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] flex items-center justify-center border border-[#333333] mb-2 text-[#888888]">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-[#A3A3A3] uppercase">
              Terkunci
            </span>
            <span className="text-[10px] text-[#737373] mt-0.5">
              Selesaikan modul sebelumnya (≥ 75%)
            </span>
          </div>
        )}

        {/* COMPLETED BADGE */}
        {isCompleted && (
          <div className="absolute top-2 right-2 flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#10B981] text-[#0D0D0D] text-[10px] font-bold shadow-md z-10">
            <CheckCircle className="w-3 h-3" />
            <span>SELESAI {bestScore !== undefined ? `(${bestScore}%)` : ''}</span>
          </div>
        )}

        {/* HOVER OVERLAY: "MULAI MODUL" Smooth Fade-in Button with Subtle Scale and Lift */}
        {isUnlocked && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center justify-center pointer-events-none">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#10B981] text-[#0D0D0D] font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-[#10B981]/25 transform translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompleted ? 'REVIEW MODUL' : 'MULAI MODUL'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Track info / metadata */}
      <div className="flex flex-col flex-grow">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#10B981] mb-1">
          <span className="uppercase font-semibold tracking-wider">
            TRACK {String(module.orderIndex).padStart(2, '0')}
          </span>
          <div className="flex items-center space-x-2 text-[#737373]">
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {module.estimatedDuration}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-bold text-white group-hover:text-[#10B981] transition-colors line-clamp-1 mb-1">
          {module.title}
        </h3>

        <p className="text-xs text-[#8A8A8A] line-clamp-2 leading-relaxed mb-3">
          {module.shortDescription}
        </p>

        {/* Footer info in streaming playlist style */}
        <div className="mt-auto pt-2 border-t border-[#1F1F1F] flex items-center justify-between text-[11px] text-[#666666]">
          <span>{module.trackCount} Materi Slide</span>
          <span className="flex items-center font-mono">
            <HelpCircle className="w-3 h-3 mr-1 text-[#10B981]" />
            15 Soal TKA
          </span>
        </div>
      </div>
    </div>
  );
};
