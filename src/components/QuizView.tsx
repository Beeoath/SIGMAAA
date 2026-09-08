import React, { useState, useEffect, useRef } from 'react';
import { LearningModule, QuizQuestion, QuizAttempt, QuizSubmissionResponse, QuizQuestionReview } from '../types';
import { 
  Clock, 
  Check, 
  Flag, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowLeft, 
  Bookmark,
  Lock,
  Sparkles,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { MathRenderer } from './MathRenderer';
import { MathNotationModal } from './MathView';

interface QuizViewProps {
  module: LearningModule;
  onExit: () => void;
  onCompleteQuiz: (attempt: QuizAttempt) => void;
}

interface QuizSessionState {
  targetEndTime: number;
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>;
  markedForReview: Record<string, boolean>;
  currentQuestionIndex: number;
}

export const QuizView: React.FC<QuizViewProps> = ({
  module,
  onExit,
  onCompleteQuiz,
}) => {
  const SESSION_KEY = `sigma_quiz_active_${module.id}`;
  const TOTAL_TIMER_SECONDS = 20 * 60; // 20 minutes

  // SECURE ARCHITECTURE: Questions are fetched from Supabase / API
  // STRICTLY EXCLUDING correctOption and explanation.
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [submissionResponse, setSubmissionResponse] = useState<QuizSubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_TIMER_SECONDS);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Fetch questions securely on module change
  useEffect(() => {
    let isMounted = true;
    setIsLoadingQuestions(true);

    SupabaseService.getStudentQuizQuestions(module.id).then(fetchedQuestions => {
      if (isMounted) {
        setQuestions(fetchedQuestions);
        setIsLoadingQuestions(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [module.id]);

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Derived counts
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  
  // Exact unanswered question numbers (1-indexed)
  const unansweredNumbers: number[] = questions
    .map((q, idx) => (!userAnswers[q.id] ? idx + 1 : null))
    .filter((n): n is number => n !== null);

  const allQuestionsAnswered = questions.length > 0 && unansweredNumbers.length === 0;

  // 1. Restore persistent session and timer on mount
  useEffect(() => {
    setBookmarkedIds(SupabaseService.getCachedBookmarks());
    let isMounted = true;
    SupabaseService.getBookmarks().then(ids => {
      if (isMounted) setBookmarkedIds(ids);
    });

    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed: QuizSessionState = JSON.parse(saved);
        const now = Date.now();
        const rem = Math.max(0, Math.floor((parsed.targetEndTime - now) / 1000));

        if (parsed.userAnswers) setUserAnswers(parsed.userAnswers);
        if (parsed.markedForReview) setMarkedForReview(parsed.markedForReview);
        if (typeof parsed.currentQuestionIndex === 'number' && parsed.currentQuestionIndex >= 0 && parsed.currentQuestionIndex < questions.length) {
          setCurrentQuestionIndex(parsed.currentQuestionIndex);
        }

        if (rem <= 0) {
          // Time expired while user was away -> auto-submit immediately
          setSecondsRemaining(0);
          setIsSessionLoaded(true);
          triggerAutoSubmit(parsed.userAnswers || {}, parsed.markedForReview || {});
          return;
        } else {
          setSecondsRemaining(rem);
        }
      } else {
        // Initialize new 20-minute persistent session
        const targetEndTime = Date.now() + (TOTAL_TIMER_SECONDS * 1000);
        const initialState: QuizSessionState = {
          targetEndTime,
          userAnswers: {},
          markedForReview: {},
          currentQuestionIndex: 0,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(initialState));
        setSecondsRemaining(TOTAL_TIMER_SECONDS);
      }
    } catch (e) {
      console.warn('Could not read persistent quiz session:', e);
      setSecondsRemaining(TOTAL_TIMER_SECONDS);
    }

    setIsSessionLoaded(true);
  }, [module.id]);

  // 2. Persist answers, reviews, and current index to localStorage on changes
  useEffect(() => {
    if (!isSessionLoaded || isSubmitted) return;

    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed: QuizSessionState = JSON.parse(saved);
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          ...parsed,
          userAnswers,
          markedForReview,
          currentQuestionIndex,
        }));
      }
    } catch (e) {
      console.warn('Could not update persistent quiz session:', e);
    }
  }, [userAnswers, markedForReview, currentQuestionIndex, isSessionLoaded, isSubmitted, SESSION_KEY]);

  // 3. Countdown timer synced with targetEndTime (Persists after refresh)
  useEffect(() => {
    if (!isSessionLoaded || isSubmitted) return;

    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed: QuizSessionState = JSON.parse(saved);
          const rem = Math.max(0, Math.floor((parsed.targetEndTime - Date.now()) / 1000));
          setSecondsRemaining(rem);

          if (rem <= 0) {
            clearInterval(interval);
            triggerAutoSubmit();
          }
        } else {
          setSecondsRemaining(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              triggerAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }
      } catch (e) {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            triggerAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionLoaded, isSubmitted, SESSION_KEY]);

  const handleSelectOption = (optionId: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleToggleReview = () => {
    if (isSubmitted) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleToggleBookmark = async (qId: string) => {
    await SupabaseService.toggleBookmark(qId);
    const updated = await SupabaseService.getBookmarks();
    setBookmarkedIds(updated);
  };

  // Auto-submit triggers when timer hits 00:00 (bypasses manual 15-question restriction)
  const triggerAutoSubmit = (
    answersToSubmit = userAnswers,
    reviewToSubmit = markedForReview
  ) => {
    setIsAutoSubmitted(true);
    finalizeSubmission(answersToSubmit, reviewToSubmit);
  };

  const finalizeSubmission = async (
    finalAnswers = userAnswers,
    finalReview = markedForReview
  ) => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    const timeSpent = TOTAL_TIMER_SECONDS - secondsRemaining;
    const userProfile = await SupabaseService.getUserProfile();

    try {
      // SUBMIT QUIZ ATTEMPT TO SUPABASE RPC / SERVER
      // Scoring is performed strictly on the server using database correct_option.
      // Explanation and correct answers are only returned in the response for review!
      const response = await SupabaseService.submitQuizAttempt({
        moduleId: module.id,
        userId: userProfile.id,
        answers: finalAnswers,
        timeSpentSeconds: timeSpent,
        reviewedQuestionIds: Object.keys(finalReview).filter(k => finalReview[k]),
      });

      setSubmissionResponse(response);
      localStorage.removeItem(SESSION_KEY);

      const attempt: QuizAttempt = {
        id: response.attemptId,
        userId: userProfile.id,
        moduleId: module.id,
        startedAt: new Date(Date.now() - (timeSpent * 1000)).toISOString(),
        completedAt: new Date().toISOString(),
        score: response.score,
        correctCount: response.correctCount,
        passed: response.passed,
        timeSpentSeconds: timeSpent,
        answers: finalAnswers,
        reviewedQuestionIds: Object.keys(finalReview).filter(k => finalReview[k]),
      };

      setCompletedAttempt(attempt);
      setIsSubmitted(true);
      onCompleteQuiz(attempt);
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    localStorage.removeItem(SESSION_KEY);

    const targetEndTime = Date.now() + (TOTAL_TIMER_SECONDS * 1000);
    const initialState: QuizSessionState = {
      targetEndTime,
      userAnswers: {},
      markedForReview: {},
      currentQuestionIndex: 0,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(initialState));

    setUserAnswers({});
    setMarkedForReview({});
    setSecondsRemaining(TOTAL_TIMER_SECONDS);
    setIsSubmitted(false);
    setIsAutoSubmitted(false);
    setCompletedAttempt(null);
    setSubmissionResponse(null);
    setCurrentQuestionIndex(0);
  };

  // Jump helper
  const jumpToQuestion = (questionNumber: number) => {
    const targetIdx = questionNumber - 1;
    if (targetIdx >= 0 && targetIdx < questions.length) {
      setCurrentQuestionIndex(targetIdx);
    }
  };

  // Format timer into MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsRemaining <= 180; // Warning pulse when <= 3 mins

  if (isLoadingQuestions) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Loader2 className="w-9 h-9 text-[#10B981] animate-spin mb-4" />
        <h3 className="text-base font-bold text-white mb-1">Menyiapkan Lembar Soal TKA...</h3>
        <p className="text-xs text-[#888888]">Mengunduh butir soal terstruktur secara aman dari server database.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="w-9 h-9 text-amber-500 mb-4" />
        <h3 className="text-base font-bold text-white mb-1">Bank Soal Belum Tersedia</h3>
        <p className="text-xs text-[#888888] mb-4">Gagal memuat butir soal untuk modul ini. Silakan coba muat ulang.</p>
        <button
          onClick={() => {
            setIsLoadingQuestions(true);
            SupabaseService.getStudentQuizQuestions(module.id).then(fetched => {
              setQuestions(fetched);
              setIsLoadingQuestions(false);
            });
          }}
          className="px-4 py-2 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] font-bold text-xs cursor-pointer transition-colors"
        >
          Muat Ulang Soal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 lg:px-8">
      {/* Quiz Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1F1F1F]">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="flex items-center space-x-1.5 text-xs font-semibold text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Keluar Kuis</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2A2A2A]" />
          <div>
            <h2 className="text-sm font-bold text-white line-clamp-1">
              Kuis TKA: {module.title}
            </h2>
            <span className="text-[10px] text-[#737373] font-mono">
              Standar Tes Kemampuan Akademik · 15 Soal
            </span>
          </div>
        </div>

        {/* 20-minute countdown clock & Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsMathModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#161616] text-[#A3A3A3] hover:text-white border border-[#292929] hover:border-[#10B981]/50 transition-colors cursor-pointer"
            title="Kamus Notasi Matematika & Rumus TKA"
          >
            <span className="font-mono text-[#10B981] font-bold">∑</span>
            <span className="hidden sm:inline">Kamus Notasi</span>
          </button>

          {!isSubmitted && (
            <div 
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border transition-colors ${
                isLowTime 
                  ? 'bg-red-950/40 text-red-400 border-red-800 animate-pulse' 
                  : 'bg-[#161616] text-[#10B981] border-[#292929]'
              }`}
              title="Batas waktu pengerjaan 20 menit (tersimpan otomatis saat refresh)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}

          {!isSubmitted ? (
            <button
              id="submit-quiz-nav-button"
              onClick={() => setShowConfirmModal(true)}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                allQuestionsAnswered
                  ? 'bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] shadow-md shadow-[#10B981]/20'
                  : 'bg-[#222222] text-[#888888] hover:text-white hover:bg-[#2A2A2A] border border-[#333333]'
              }`}
              title={allQuestionsAnswered ? 'Semua 15 soal telah terjawab, siap dikumpulkan' : `Lengkapi seluruh 15 soal (${answeredCount}/15 terjawab)`}
            >
              {!allQuestionsAnswered && <Lock className="w-3 h-3 text-[#A3A3A3]" />}
              <span>Kumpulkan Kuis ({answeredCount}/15)</span>
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#1C1C1C] hover:bg-[#282828] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ulangi Kuis</span>
            </button>
          )}
        </div>
      </div>

      {/* AUTO-SUBMIT ALERT BANNER (If timer hit 00:00) */}
      {isSubmitted && isAutoSubmitted && (
        <div className="mb-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Waktu 20:00 Habis!</strong> Lembar kuis Anda telah otomatis dikumpulkan oleh sistem.
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-300/70">Auto-Submitted</span>
        </div>
      )}

      {/* SUBMISSION RESULT BANNER (Feedback revealed ONLY after submission) */}
      {isSubmitted && completedAttempt && (
        <div className={`mb-6 p-5 sm:p-6 rounded-xl border shadow-xl ${
          completedAttempt.passed 
            ? 'bg-[#0E281C] border-[#10B981]/50 text-white' 
            : 'bg-[#261515] border-red-700/50 text-white'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                completedAttempt.passed ? 'bg-[#10B981] text-[#0D0D0D]' : 'bg-red-600 text-white'
              }`}>
                {completedAttempt.score}%
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold">
                    {completedAttempt.passed 
                      ? 'Selamat! Anda Lulus Standar TKA' 
                      : 'Belum Mencapai Nilai Ambang Batas'}
                  </h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-bold ${
                    completedAttempt.passed ? 'bg-[#10B981]/30 text-[#34D399]' : 'bg-red-500/30 text-red-300'
                  }`}>
                    {completedAttempt.correctCount} / 15 Benar
                  </span>
                  <span className="text-[11px] text-[#A3A3A3] font-mono">
                    Waktu: {formatTime(completedAttempt.timeSpentSeconds)}
                  </span>
                </div>
                <p className="text-xs text-[#CCCCCC] mt-1">
                  {completedAttempt.passed 
                    ? 'Pemahaman konsep Anda telah memenuhi standar TKA (≥ 75%). Silakan telaah pembahasan soal dan lanjutkan ke modul berikutnya!' 
                    : 'Kuis memerlukan skor minimal 75% untuk tuntas. Pelajari pembahasan resmi dan coba ulangi kuis.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-full bg-[#181818] hover:bg-[#222222] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer"
              >
                Coba Ulangi
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 rounded-full bg-[#10B981] text-[#0D0D0D] hover:bg-[#059669] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Kembali ke Modul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE-FRIENDLY NAVIGATOR STRIP (< lg screens) */}
      <div className="lg:hidden mb-4 p-3 rounded-xl bg-[#141414] border border-[#222222]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Navigasi Soal (15)
            </span>
            <span className="text-[10px] font-mono text-[#10B981]">
              {answeredCount}/15
            </span>
          </div>
          <span className="text-[10px] text-[#737373]">
            Geser untuk melompat ke nomor soal
          </span>
        </div>

        {/* Horizontal scrollable quick-jump strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            const isAnswered = !!userAnswers[q.id];
            const isReview = !!markedForReview[q.id];

            let navStyle = 'bg-[#202020] text-[#777777] border border-[#2E2E2E]';
            let icon = null;

            if (isSubmitted) {
              const review = submissionResponse?.reviews?.find(r => r.questionId === q.id);
              if (review?.isCorrect) {
                navStyle = 'bg-[#10B981] text-[#0D0D0D] font-bold border-[#10B981]';
                icon = <Check className="w-2.5 h-2.5 ml-0.5" />;
              } else {
                navStyle = 'bg-[#EF4444] text-white font-bold border-red-500';
                icon = <XCircle className="w-2.5 h-2.5 ml-0.5" />;
              }
            } else if (isReview) {
              navStyle = 'bg-[#F59E0B] text-[#0D0D0D] font-bold border-amber-400';
              icon = <Flag className="w-2.5 h-2.5 ml-0.5" />;
            } else if (isAnswered) {
              navStyle = 'bg-[#10B981] text-[#0D0D0D] font-bold border-[#10B981]';
              icon = <Check className="w-2.5 h-2.5 ml-0.5" />;
            }

            const currentRing = isCurrent
              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141414] scale-105 shadow-md'
              : '';

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex-shrink-0 min-w-[44px] h-[40px] px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${navStyle} ${currentRing}`}
                aria-label={`Pindah ke soal ${idx + 1}`}
              >
                <span>{idx + 1}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Mobile Exact Unanswered Warning */}
        {!isSubmitted && unansweredNumbers.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#1F1F1F] flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-amber-400 font-medium">Belum Dijawab:</span>
            {unansweredNumbers.map((num) => (
              <button
                key={num}
                onClick={() => jumpToQuestion(num)}
                className="px-1.5 py-0.5 rounded bg-[#242424] hover:bg-amber-950/60 hover:text-amber-300 text-[#A3A3A3] font-mono border border-[#333333] transition-colors cursor-pointer"
              >
                #{num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP 2-COLUMN GRID (LEFT-SIDE QUESTION NAVIGATOR ON DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: QUESTION NAVIGATOR (Desktop Sticky Sidebar) */}
        {/* ============================================================ */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="rounded-xl bg-[#141414] border border-[#222222] p-5 shadow-xl sticky top-20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Navigasi Soal TKA
                </h3>
                <span className="text-[10px] text-[#737373]">
                  15 Butir Soal Terstruktur
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#10B981]">
                  {answeredCount}/15
                </span>
                <span className="block text-[10px] text-[#666666]">Terjawab</span>
              </div>
            </div>

            {/* 15 Question Navigator Grid */}
            <div className="grid grid-cols-5 gap-2.5 mb-4">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!userAnswers[q.id];
                const isReview = !!markedForReview[q.id];

                let navBgClass = 'bg-[#1C1C1C] text-[#737373] border border-[#2A2A2A] hover:border-[#444] hover:text-white';
                let stateIcon = null;

                if (isSubmitted) {
                  const review = submissionResponse?.reviews?.find(r => r.questionId === q.id);
                  if (review?.isCorrect) {
                    navBgClass = 'bg-[#10B981] text-[#0D0D0D] font-bold border-[#10B981] shadow-sm';
                    stateIcon = <Check className="w-2.5 h-2.5 ml-0.5" />;
                  } else {
                    navBgClass = 'bg-[#EF4444] text-white font-bold border-red-500 shadow-sm';
                    stateIcon = <XCircle className="w-2.5 h-2.5 ml-0.5" />;
                  }
                } else if (isReview) {
                  navBgClass = 'bg-[#F59E0B] text-[#0D0D0D] font-bold border-amber-400 shadow-sm';
                  stateIcon = <Flag className="w-2.5 h-2.5 ml-0.5" />;
                } else if (isAnswered) {
                  navBgClass = 'bg-[#10B981] text-[#0D0D0D] font-bold border-[#10B981] shadow-sm';
                  stateIcon = <Check className="w-2.5 h-2.5 ml-0.5" />;
                }

                const currentRingClass = isCurrent
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141414] scale-105 z-10 shadow-lg'
                  : 'hover:scale-102';

                return (
                  <button
                    key={q.id}
                    id={`desktop-nav-question-${idx + 1}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`relative flex items-center justify-center h-10 rounded-lg text-xs font-mono transition-transform duration-150 cursor-pointer ${navBgClass} ${currentRingClass}`}
                    aria-label={`Soal nomor ${idx + 1} ${isAnswered ? 'sudah dijawab' : 'belum dijawab'} ${isReview ? 'ditandai ragu' : ''}`}
                  >
                    <span>{idx + 1}</span>
                    {stateIcon}
                  </button>
                );
              })}
            </div>

            {/* EXACT UNANSWERED NUMBERS DISPLAY (Left-side navigator specification) */}
            <div className="p-3 mb-4 rounded-lg bg-[#0E0E0E] border border-[#202020]">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-white">Status Kelengkapan:</span>
                {allQuestionsAnswered ? (
                  <span className="text-[#10B981] font-mono font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lengkap 15/15</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono font-bold">
                    {unansweredNumbers.length} Soal Belum Diisi
                  </span>
                )}
              </div>

              {!allQuestionsAnswered ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#888888] block">
                    Klik nomor untuk langsung melompat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {unansweredNumbers.map((num) => (
                      <button
                        key={num}
                        onClick={() => jumpToQuestion(num)}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1F1F1F] text-[#CCCCCC] hover:text-[#10B981] hover:bg-[#2A2A2A] border border-[#2E2E2E] transition-colors cursor-pointer"
                        title={`Lompat ke soal nomor ${num}`}
                      >
                        No. {num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-[#10B981]/80">
                  Seluruh 15 butir soal telah memiliki jawaban. Anda dapat melakukan pengumpulan manual sekarang.
                </p>
              )}
            </div>

            {/* Accessible Legend */}
            <div className="pt-3 border-t border-[#1E1E1E] space-y-1.5 text-[11px] text-[#888888]">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-[#10B981] text-[#0D0D0D] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Terjawab (Hijau + Checkmark)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-[#F59E0B] text-[#0D0D0D] flex items-center justify-center">
                  <Flag className="w-2.5 h-2.5" />
                </span>
                <span>Ragu-ragu (Amber + Bendera)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-[#1C1C1C] border border-[#2A2A2A] text-[#737373] flex items-center justify-center font-mono text-[9px]">
                  -
                </span>
                <span>Belum Dijawab (Abu Gelap)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-[#1C1C1C] ring-2 ring-white" />
                <span>Soal Aktif (Ring Putih)</span>
              </div>
            </div>

            {/* Submit Action Button on Desktop Sidebar */}
            {!isSubmitted && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className={`w-full mt-4 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  allQuestionsAnswered
                    ? 'bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] shadow-md shadow-[#10B981]/20'
                    : 'bg-[#1F1F1F] hover:bg-[#282828] text-[#888888] border border-[#2D2D2D]'
                }`}
              >
                {!allQuestionsAnswered && <Lock className="w-3.5 h-3.5" />}
                <span>Kumpulkan Hasil ({answeredCount}/15)</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ACTIVE QUESTION STAGE */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl bg-[#141414] border border-[#222222] p-5 sm:p-7 shadow-xl">
            
            {/* Question Header & Review Flag Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-5 border-b border-[#1E1E1E]">
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#1C1C1C] text-[#10B981] border border-[#2C2C2C]">
                  Soal #{currentQuestion.orderIndex} dari 15
                </span>
                <span className="text-xs text-[#737373]">
                  {currentQuestion.tkaConcept}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleBookmark(currentQuestion.id)}
                  className={`p-2 rounded-full border text-xs transition-colors cursor-pointer ${
                    bookmarkedIds.includes(currentQuestion.id)
                      ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                      : 'border-[#262626] text-[#737373] hover:text-white'
                  }`}
                  title="Bookmark soal untuk dipelajari nanti"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                {!isSubmitted && (
                  <button
                    onClick={handleToggleReview}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      markedForReview[currentQuestion.id]
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B] font-semibold'
                        : 'bg-[#1A1A1A] text-[#888888] hover:text-white border-[#2A2A2A]'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>
                      {markedForReview[currentQuestion.id] ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Body with KaTeX MathRenderer */}
            <div className="text-sm sm:text-base font-medium text-white leading-relaxed mb-6">
              <MathRenderer text={currentQuestion.questionText} />
            </div>

            {/* Options List (Strict security rule: Feedback ONLY after submission) */}
            {(() => {
              const currentReview = submissionResponse?.reviews?.find(r => r.questionId === currentQuestion.id);
              const revealedCorrectOption = currentReview?.correctOption;
              const revealedExplanation = currentReview?.explanation;

              return (
                <>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = userAnswers[currentQuestion.id] === option.id;
                      const isCorrect = Boolean(revealedCorrectOption && option.id === revealedCorrectOption);

                      // Neutral Spotify-dark styling during quiz
                      let optionStyle = 'bg-[#181818] border-[#262626] hover:bg-[#202020] text-[#E5E5E5]';

                      if (isSubmitted) {
                        // After submission: reveal correct and incorrect using the server review response
                        if (isCorrect) {
                          optionStyle = 'bg-[#10B981]/20 border-[#10B981] text-white font-semibold ring-1 ring-[#10B981]';
                        } else if (isSelected && !isCorrect) {
                          optionStyle = 'bg-red-950/40 border-red-600 text-red-200';
                        } else {
                          optionStyle = 'bg-[#141414] border-[#222222] opacity-50 text-[#888888]';
                        }
                      } else if (isSelected) {
                        // During quiz: only show user selection
                        optionStyle = 'bg-[#10B981]/15 border-[#10B981] text-white ring-1 ring-[#10B981] shadow-md';
                      }

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(option.id)}
                          disabled={isSubmitted}
                          className={`w-full flex items-start p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${optionStyle}`}
                        >
                          <span 
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs mr-3 mt-0.5 border ${
                              isSelected 
                                ? 'bg-[#10B981] text-[#0D0D0D] border-[#10B981]' 
                                : 'bg-[#222222] text-[#A3A3A3] border-[#333333]'
                            }`}
                          >
                            {option.id}
                          </span>
                          <span className="flex-grow pt-1 leading-relaxed">
                            <MathRenderer text={option.text} />
                          </span>

                          {/* Feedback icons ONLY visible after submission */}
                          {isSubmitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 ml-2" />
                          )}
                          {isSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Official Explanation (Revealed ONLY after submission from server response) */}
                  {isSubmitted && revealedExplanation && (
                    <div className="mt-7 p-5 rounded-xl bg-[#0C1712] border border-[#10B981]/30 shadow-lg">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#10B981]/20">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pembahasan Resmi & Teorema TKA</span>
                        </span>
                        {revealedCorrectOption && (
                          <span className="text-xs font-mono font-bold text-white bg-[#10B981]/20 px-2 py-0.5 rounded border border-[#10B981]/40">
                            Kunci: {revealedCorrectOption}
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-[#D4D4D4] leading-relaxed">
                        <MathRenderer text={revealedExplanation} />
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Bottom Question Controls */}
            <div className="mt-8 pt-4 border-t border-[#1E1E1E] flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#1A1A1A] hover:bg-[#252525] text-[#D4D4D4] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2B2B2B] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="text-xs font-mono text-[#737373]">
                {currentQuestionIndex + 1} / 15
              </span>

              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#1A1A1A] hover:bg-[#252525] text-[#D4D4D4] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2B2B2B] transition-colors cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              allQuestionsAnswered 
                ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              {allQuestionsAnswered ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              {allQuestionsAnswered 
                ? 'Kumpulkan Hasil Kuis TKA?' 
                : 'Soal Belum Lengkap'}
            </h3>

            {/* Requirement: All questions required for manual submission */}
            {allQuestionsAnswered ? (
              <p className="text-xs text-[#A3A3A3] mb-5 leading-relaxed">
                Seluruh <strong>15 dari 15 soal</strong> telah berhasil Anda jawab.
                {reviewCount > 0 && (
                  <span className="block text-amber-400 mt-1 font-medium">
                    Catatan: Terdapat {reviewCount} soal yang masih Anda tandai ragu-ragu.
                  </span>
                )}
                Apakah Anda yakin ingin menyelesaikan kuis sekarang?
              </p>
            ) : (
              <div className="text-xs text-[#A3A3A3] mb-5 leading-relaxed text-left bg-[#121212] p-3.5 rounded-xl border border-[#262626]">
                <p className="text-amber-300 font-semibold mb-2">
                  ⚠️ Seluruh 15 butir soal wajib dijawab untuk dapat mengumpulkan secara manual.
                </p>
                <p className="text-[#888888] mb-2 text-[11px]">
                  Saat ini baru terjawab <strong className="text-white font-mono">{answeredCount}/15</strong> soal.
                </p>
                
                {/* EXACT UNANSWERED NUMBERS DISPLAY in MODAL */}
                <div className="pt-2 border-t border-[#1F1F1F]">
                  <span className="text-[11px] text-white font-medium block mb-1.5">
                    Nomor yang belum dijawab ({unansweredNumbers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {unansweredNumbers.map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setShowConfirmModal(false);
                          jumpToQuestion(num);
                        }}
                        className="px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#10B981] hover:text-[#0D0D0D] text-amber-400 font-mono font-bold text-xs border border-[#333333] transition-colors cursor-pointer"
                        title={`Lompat ke soal #${num}`}
                      >
                        Soal #{num} →
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-full bg-[#242424] hover:bg-[#303030] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {allQuestionsAnswered ? 'Periksa Kembali' : 'Tutup & Lengkapi'}
              </button>

              <button
                id="confirm-final-submit"
                onClick={() => finalizeSubmission()}
                disabled={!allQuestionsAnswered || isSubmitting}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center ${
                  allQuestionsAnswered && !isSubmitting
                    ? 'bg-[#10B981] hover:bg-[#059669] text-[#0D0D0D] cursor-pointer shadow-md'
                    : 'bg-[#262626] text-[#666666] cursor-not-allowed border border-[#333333]'
                }`}
                title={allQuestionsAnswered ? 'Kumpulkan kuis' : 'Wajib melengkapi 15 soal untuk mengumpulkan'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Menghitung Skor...</span>
                  </>
                ) : allQuestionsAnswered ? (
                  'Ya, Kumpulkan'
                ) : (
                  'Wajib 15 Soal'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Math Notation Reference Modal */}
      <MathNotationModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
      />
    </div>
  );
};
