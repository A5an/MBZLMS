import React from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { PracticeTask } from '../../services/geminiService';
import { MathText } from '../MathText';

export type PracticeCardTone = 'light' | 'dark';

type PracticeCardProps = {
  task: PracticeTask;
  index: number;
  tone?: PracticeCardTone;
  done: boolean;
  reveal?: { hint?: boolean; solution?: boolean };
  onToggleDone: () => void;
  onReveal: (field: 'hint' | 'solution') => void;
};

const toneClass = (tone: PracticeCardTone | undefined, light: string, dark: string) => (tone === 'light' ? light : dark);

const difficultyColor = (difficulty?: string, tone?: PracticeCardTone) => {
  const tag = (difficulty || '').toLowerCase();
  if (tag.includes('challenge')) return tone === 'light' ? 'from-amber-500/80 to-rose-500/80' : 'from-amber-400/80 to-rose-400/80';
  if (tag.includes('stretch')) return tone === 'light' ? 'from-sky-500/80 to-indigo-500/80' : 'from-sky-400/80 to-indigo-400/80';
  return tone === 'light' ? 'from-emerald-500/80 to-teal-500/80' : 'from-emerald-400/80 to-teal-400/80';
};

export const PracticeCard: React.FC<PracticeCardProps> = ({ task, index, tone, done, reveal, onToggleDone, onReveal }) => {
  const copyTask = async () => {
    const text = `${task.text}${task.latex ? `\nLaTeX: ${task.latex}` : ''}${task.hint ? `\nHint: ${task.hint}` : ''}${task.solution ? `\nSolution: ${task.solution}` : ''}`;
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* noop */
    }
  };

  const pill = (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-white bg-gradient-to-r ${difficultyColor(
        task.difficulty,
        tone
      )} shadow-sm`}
    >
      {task.difficulty ?? 'Core'}
    </div>
  );

  return (
    <div
      className={toneClass(
        tone,
        'rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-md backdrop-blur-xl',
        'rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {pill}
          {task.artifact && (
            <span
              className={toneClass(
                tone,
                'text-[11px] font-semibold text-slate-600 bg-slate-100/80 rounded-full px-2 py-1',
                'text-[11px] font-semibold text-white/80 bg-white/10 rounded-full px-2 py-1'
              )}
            >
              {task.artifact}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyTask}
            className={toneClass(
              tone,
              'p-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition',
              'p-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 hover:text-white transition'
            )}
            aria-label="Copy task"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onToggleDone}
            className={toneClass(
              tone,
              'p-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition',
              'p-1.5 rounded-full bg-emerald-400/10 border border-emerald-300/40 text-emerald-200 hover:bg-emerald-300/15 transition'
            )}
            aria-label="Mark complete"
          >
            <CheckCircle2 size={16} className={done ? '' : 'opacity-60'} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className={toneClass(tone, 'text-[11px] uppercase tracking-[0.16em] text-slate-500', 'text-[11px] uppercase tracking-[0.16em] text-white/55')}>
          Task {index + 1}
        </div>
        <MathText
          text={task.text}
          latex={task.latex}
          className={toneClass(tone, 'text-sm font-semibold text-slate-800 leading-snug', 'text-sm font-semibold text-white leading-snug')}
        />

        {(task.hint || task.solution) && (
          <div className="space-y-1">
            {task.hint && (
              <button
                type="button"
                onClick={() => onReveal('hint')}
                className={toneClass(
                  tone,
                  'w-full text-left rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:-translate-y-[1px] transition-all',
                  'w-full text-left rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/85 hover:-translate-y-[1px] transition-all'
                )}
              >
                {reveal?.hint ? (
                  <span className="text-[12px] font-normal leading-snug">{task.hint}</span>
                ) : (
                  'Reveal hint'
                )}
              </button>
            )}
            {task.solution && (
              <button
                type="button"
                onClick={() => onReveal('solution')}
                className={toneClass(
                  tone,
                  'w-full text-left rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[12px] font-semibold text-slate-800 hover:-translate-y-[1px] transition-all',
                  'w-full text-left rounded-xl border border-white/10 bg-white/15 px-3 py-2 text-[12px] font-semibold text-white hover:-translate-y-[1px] transition-all'
                )}
              >
                {reveal?.solution ? (
                  <MathText
                    text={task.solution}
                    latex={task.latex && task.solution?.includes('$') ? undefined : undefined}
                    className={toneClass(tone, 'text-[13px] font-normal leading-snug', 'text-[13px] font-normal leading-snug text-white')}
                  />
                ) : (
                  'Reveal solution'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
