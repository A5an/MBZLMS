import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { QuizItem } from '../../services/geminiService';

type QuizSheetData = {
  items: QuizItem[];
  /** Optional label shown in the header (course • quiz title). */
  title?: string;
  /** Optional subtitle such as lecturer or session info. */
  subtitle?: string;
};

type QuizSheetProps = {
  quizData: QuizSheetData;
  onClose: () => void;
  onNext?: (nextIndex: number) => void;
  onGenerateSimilar: (questionId: string, wrongAnswer?: string) => void;
  startIndex?: number;
  showTimer?: boolean;
  onAnswer?: (questionId: string, option: string, isCorrect: boolean) => void;
  onComplete?: (score: number) => void;
  focusQuestionId?: string | null;
};

const QUESTION_DURATION_MS = 60_000;

export const QuizSheet: React.FC<QuizSheetProps> = ({
  quizData,
  onClose,
  onNext,
  onGenerateSimilar,
  startIndex = 0,
  showTimer = false,
  onAnswer,
  onComplete,
  focusQuestionId = null
}) => {
  const { items, title, subtitle } = quizData;
  const [index, setIndex] = useState(() => Math.min(startIndex, Math.max(items.length - 1, 0)));
  const [selection, setSelection] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION_MS);
  const timerRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const prevLengthRef = useRef(items.length);
  const [responses, setResponses] = useState<Record<string, { selection: string; isCorrect: boolean }>>({});

  const current = items[index];

  // Lock page scroll while sheet is open
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Focus trap
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const loadQuestionState = useCallback(
    (nextIndex: number) => {
      const nextItem = items[nextIndex];
      setIndex(nextIndex);
      const stored = responses[nextItem.id];
      setSelection(stored?.selection ?? null);
      setIsCorrect(stored?.isCorrect ?? null);
      setTimeLeft(QUESTION_DURATION_MS);
      onNext?.(nextIndex);
    },
    [items, onNext, responses]
  );

  const handleSelect = useCallback((option: string) => {
    if (!current || selection) return; // lock after first choice
    const correct = option === current.answer;
    setSelection(option);
    setIsCorrect(correct);
    setResponses((prev) => ({ ...prev, [current.id]: { selection: option, isCorrect: correct } }));
    if (correct) {
      setScore((prev) => prev + 1);
      setToast(true);
      window.setTimeout(() => setToast(false), 1200);
    }
    onAnswer?.(current.id, option, correct);
  }, [current, onAnswer, selection]);

  const handleNext = useCallback(() => {
    if (index >= items.length - 1) {
      onComplete?.(score);
      onClose();
      return;
    }
    loadQuestionState(index + 1);
  }, [index, items.length, onClose, onComplete, loadQuestionState, score]);

  const handlePrev = useCallback(() => {
    if (index === 0) return;
    loadQuestionState(index - 1);
  }, [index, loadQuestionState]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!current) return;
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (/^[1-4]$/.test(event.key)) {
      const idx = Number(event.key) - 1;
      const option = current.options[idx];
      if (option) handleSelect(option);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrev();
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleNext();
    }
  }, [current, handleNext, handlePrev, handleSelect, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Timer per question
  useEffect(() => {
    if (!showTimer) return;
    setTimeLeft(QUESTION_DURATION_MS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (selection === null) handleNext();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleNext, index, selection, showTimer]);

  // Jump to specific question when focusQuestionId changes or when new item is added
  useEffect(() => {
    const added = items.length > prevLengthRef.current;
    if (focusQuestionId) {
      const targetIndex = items.findIndex((q) => q.id === focusQuestionId);
      if (targetIndex >= 0) {
        const stored = responses[focusQuestionId];
        setIndex(targetIndex);
        setSelection(stored?.selection ?? null);
        setIsCorrect(stored?.isCorrect ?? null);
        setTimeLeft(QUESTION_DURATION_MS);
      }
    } else if (added) {
      const nextIndex = items.length - 1;
      const stored = responses[items[nextIndex].id];
      setIndex(nextIndex);
      setSelection(stored?.selection ?? null);
      setIsCorrect(stored?.isCorrect ?? null);
      setTimeLeft(QUESTION_DURATION_MS);
    }
    prevLengthRef.current = items.length;
  }, [items, focusQuestionId, responses]);

  const progress = useMemo(() => items.map((_, i) => (i < index ? 'done' : i === index ? 'active' : 'idle')), [index, items]);
  const timerPct = Math.max(0, Math.min(100, (timeLeft / QUESTION_DURATION_MS) * 100));

  if (!items.length || !current) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-6 py-10" role="dialog" aria-modal ref={sheetRef}>
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-4xl bg-white/80 dark:bg-[#0b0c11]/90 backdrop-blur-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.25)] rounded-[28px] p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-[0.08em]">Quiz Sheet</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight">{title || 'Course quiz'}</div>
            {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                {progress.map((state, i) => (
                  <span
                    key={items[i]?.id ?? i}
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${
                      state === 'done'
                        ? 'bg-emerald-500'
                        : state === 'active'
                          ? 'bg-white border border-slate-300 dark:border-white/40 scale-125 shadow-sm'
                          : 'bg-white/40 border border-white/30'
                    }`}
                  />
                ))}
              </div>
              {flagged.has(current.id) && (
                <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">Flagged</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showTimer && (
              <div className="w-32 h-2 rounded-full bg-white/40 dark:bg-white/10 overflow-hidden border border-white/20" aria-label="Time remaining">
                <div className="h-full bg-emerald-500 transition-[width] duration-500 ease-out" style={{ width: `${timerPct}%` }} />
              </div>
            )}
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/20 text-slate-700 dark:text-white hover:scale-[1.02] active:scale-95 transition-all duration-300"
              aria-label="Close quiz"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative space-y-4">
          {toast && (
            <div className="absolute -top-7 right-0 text-sm px-3 py-1 rounded-full bg-emerald-500 text-white shadow-lg animate-pulse" aria-live="polite">
              +10 XP
            </div>
          )}

          <div className="rounded-3xl border border-white/15 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/50">
              Question {index + 1}
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/40" />
              {items.length} total
            </div>
            <div className="mt-2 text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-white">
              {current.question}
            </div>
          </div>

          <div className="space-y-3">
            {current.options.map((option, optIndex) => {
              const chosen = selection === option;
              const correct = option === current.answer;
              const showCorrect = selection && correct;
              const showWrong = chosen && !correct;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={!!selection}
                  onClick={() => handleSelect(option)}
                  className={[
                    'w-full text-left rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] border',
                    'hover:-translate-y-[1px] hover:shadow-lg hover:brightness-105',
                    'active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30',
                    showCorrect
                      ? 'bg-emerald-500 text-white border-transparent'
                      : showWrong
                        ? 'bg-rose-500 text-white border-transparent'
                        : 'bg-white/70 dark:bg-white/10 border-white/20 text-slate-900 dark:text-white'
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500/80 dark:text-white/50">{optIndex + 1}.</span>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {selection && (
            <div className="rounded-2xl border border-white/15 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={`h-2 w-2 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isCorrect ? 'Correct' : 'Not quite'}
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200">{current.whyItMatters}</div>
              {current.hint && <div className="text-xs text-slate-500 dark:text-slate-400">Hint: {current.hint}</div>}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onGenerateSimilar(current.id, selection ?? undefined)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-400 bg-white/70 dark:bg-white/10 border border-white/20 hover:scale-[1.01] active:scale-[0.98]"
                >
                  Try similar
                </button>
                {flagged.has(current.id) && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-300">Marked for review</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">Question {index + 1} of {items.length}</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={index === 0}
              className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 bg-white/70 dark:bg-white/10 border border-white/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setFlagged((prev) => {
                  const next = new Set(prev);
                  if (next.has(current.id)) next.delete(current.id);
                  else next.add(current.id);
                  return next;
                })
              }
              className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 bg-white/70 dark:bg-white/10 border border-white/20 hover:scale-[1.01] active:scale-[0.98]"
            >
              {flagged.has(current.id) ? 'Unflag' : 'Flag / Review later'}
            </button>
            <button
              type="button"
              onClick={() => onGenerateSimilar(current.id, selection ?? undefined)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 bg-white/70 dark:bg-white/10 border border-white/20 hover:scale-[1.01] active:scale-[0.98]"
            >
              Try similar
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 bg-slate-900 text-white dark:bg-white/90 dark:text-slate-900 hover:scale-[1.01] active:scale-[0.98]"
            >
              {index === items.length - 1 ? 'Finish' : selection ? 'Next' : 'Skip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSheet;
