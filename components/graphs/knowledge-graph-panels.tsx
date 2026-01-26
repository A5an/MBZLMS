import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { GRAPH_COLORS, QUIZ_DETAILS, QUIZ_STATUS_STYLES } from './knowledge-graph-data';
import { CourseTreeCourse, GraphNode, QuizDetail } from './knowledge-graph-types';

type PanelTone = 'light' | 'dark';

const toneClass = (tone: PanelTone | undefined, light: string, dark: string) => (tone === 'light' ? light : dark);

interface ControlSliderProps {
  label: string;
  value: number;
  set: (value: number) => void;
  min: number;
  max: number;
  step: number;
  tone?: PanelTone;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, set, min, max, step, tone }) => {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="group space-y-3">
      <div className="flex justify-between items-end">
        <span
          className={toneClass(
            tone,
            'text-xs font-bold text-slate-500 tracking-tight group-hover:text-slate-700 transition-colors',
            'text-xs font-bold text-white/40 tracking-tight group-hover:text-white/60 transition-colors'
          )}
        >
          {label}
        </span>
        <span
          className={toneClass(
            tone,
            'text-xs font-mono font-bold text-sky-600 tabular-nums',
            'text-xs font-mono font-bold text-blue-400 tabular-nums'
          )}
        >
          {value}
        </span>
      </div>
      <div className="relative h-2 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => set(Number(event.target.value))}
          className="absolute -inset-y-3 inset-x-0 w-full h-8 opacity-0 cursor-pointer z-10"
        />
        <div className={toneClass(tone, 'absolute inset-0 rounded-full bg-slate-200', 'absolute inset-0 rounded-full bg-white/5')} />
        <div
          className={toneClass(
            tone,
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300',
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-300'
          )}
          style={{ width: `${percent}%` }}
        />
        <div
          className={toneClass(
            tone,
            'absolute top-1/2 h-4 w-4 rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.15)] -translate-y-1/2 pointer-events-none',
            'absolute top-1/2 h-4 w-4 rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.5)] -translate-y-1/2 pointer-events-none'
          )}
          style={{ left: `${percent}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
};

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tone?: PanelTone;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, tone }) => (
  <label className={toneClass(tone, 'flex items-center justify-between gap-3 text-xs text-slate-600', 'flex items-center justify-between gap-3 text-xs text-white/70')}>
    <span className={toneClass(tone, 'text-xs font-semibold text-slate-500', 'text-xs font-semibold text-white/55')}>{label}</span>
    <div className="flex items-center gap-2">
      <span className={toneClass(tone, 'text-[10px] font-mono text-slate-400', 'text-[10px] font-mono text-white/45')}>{value.toUpperCase()}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={toneClass(
          tone,
          'h-6 w-10 cursor-pointer rounded-md border border-slate-200 bg-white',
          'h-6 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent'
        )}
        aria-label={`${label} color`}
      />
    </div>
  </label>
);

interface ModeInfoCardProps {
  label: string;
  tag: string;
  detail: string;
  solid?: boolean;
  tone?: PanelTone;
}

export const ModeInfoCard: React.FC<ModeInfoCardProps> = ({ label, tag, detail, solid = false, tone }) => (
  <div
    className={`rounded-2xl shadow-xl px-4 py-3 max-w-[240px] ${toneClass(
      tone,
      `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-xl'}`,
      `border border-white/10 ${solid ? 'bg-[#101114]' : 'bg-white/[0.06] backdrop-blur-xl'}`
    )}`}
  >
    <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.3em] text-slate-400', 'text-[9px] uppercase tracking-[0.3em] text-white/40')}>Graph Mode</div>
    <div className={toneClass(tone, 'mt-1 text-sm font-semibold text-slate-900', 'mt-1 text-sm font-semibold text-white')}>{label}</div>
    <span className={toneClass(
      tone,
      'mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500',
      'mt-2 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60'
    )}>
      {tag}
    </span>
    <p className={toneClass(tone, 'mt-2 text-[11px] leading-snug text-slate-600', 'mt-2 text-[11px] leading-snug text-white/60')}>{detail}</p>
  </div>
);

interface CourseTreePanelProps {
  courses: CourseTreeCourse[];
  activeCourseId: string;
  openCourseIds: Record<string, boolean>;
  openSectionIds: Record<string, boolean>;
  onToggleCourse: (courseId: string) => void;
  onToggleSection: (courseId: string, sectionId: string) => void;
  onSelectCourse?: (courseId: string) => void;
  onSelectQuiz?: (nodeId: string) => void;
  className?: string;
  solid?: boolean;
  graphColors?: string[];
  tone?: PanelTone;
}

const QuizPercentBadge: React.FC<{ percent: number; color: string; tone?: PanelTone }> = ({ percent, color, tone }) => {
  const progress = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative h-9 w-9">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} ${progress * 3.6}deg, ${
            tone === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.15)'
          } 0deg)`
        }}
      />
      <div
        className={toneClass(
          tone,
          'absolute inset-[3px] rounded-full bg-white flex items-center justify-center text-[9px] font-semibold text-slate-600',
          'absolute inset-[3px] rounded-full bg-[#0f0f12]/90 flex items-center justify-center text-[9px] font-semibold text-white/70'
        )}
      >
        {progress}%
      </div>
    </div>
  );
};

export const CourseTreePanel: React.FC<CourseTreePanelProps> = ({
  courses,
  activeCourseId,
  openCourseIds,
  openSectionIds,
  onToggleCourse,
  onToggleSection,
  onSelectCourse,
  onSelectQuiz,
  className,
  solid = false,
  graphColors,
  tone
}) => (
  <div
    className={`rounded-[28px] shadow-2xl flex flex-col overflow-hidden ${toneClass(
      tone,
      `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-2xl'}`,
      `border border-white/[0.12] ${solid ? 'bg-[#101114]' : 'bg-white/[0.06] backdrop-blur-2xl'}`
    )} ${className ?? ''}`}
  >
    <div className={toneClass(tone, 'px-6 pt-6 pb-4 border-b border-slate-200', 'px-6 pt-6 pb-4 border-b border-white/10')}>
      <div className={toneClass(tone, 'text-[10px] uppercase tracking-[0.32em] text-slate-400', 'text-[10px] uppercase tracking-[0.32em] text-white/45')}>Course Tree</div>
      <div className={toneClass(tone, 'mt-1 text-lg font-semibold text-slate-900', 'mt-1 text-lg font-semibold text-white')}>Structure</div>
    </div>
    <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto custom-scrollbar">
      {courses.map((course) => {
        const isActive = course.id === activeCourseId;
        const isOpen = openCourseIds[course.id] ?? isActive;
        const palette = graphColors ?? GRAPH_COLORS;
        const accent = palette[course.group] || '#8E8E93';
        return (
          <div key={course.id} className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onSelectCourse?.(course.id);
                onToggleCourse(course.id);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${
                isActive
                  ? toneClass(tone, 'bg-slate-100 text-slate-900', 'bg-white/10 text-white')
                  : toneClass(tone, 'text-slate-600 hover:bg-slate-100/70', 'text-white/70 hover:bg-white/5')
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
                <span className="text-sm font-semibold">{course.label}</span>
              </div>
              <ChevronRight size={16} className={toneClass(tone, `text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`, `text-white/40 transition-transform ${isOpen ? 'rotate-90' : ''}`)} />
            </button>
            {isOpen && (
              <div className={toneClass(tone, 'pl-4 border-l border-slate-200 space-y-3', 'pl-4 border-l border-white/10 space-y-3')}>
                {course.sections.map((section) => {
                  const sectionKey = `${course.id}-${section.id}`;
                  const sectionOpen = openSectionIds[sectionKey] ?? isActive;
                  return (
                    <div key={sectionKey} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => onToggleSection(course.id, section.id)}
                        className={toneClass(tone, 'w-full flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-slate-400', 'w-full flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/45')}
                      >
                        <span>{section.label}</span>
                        <ChevronRight size={14} className={toneClass(tone, `text-slate-300 transition-transform ${sectionOpen ? 'rotate-90' : ''}`, `text-white/30 transition-transform ${sectionOpen ? 'rotate-90' : ''}`)} />
                      </button>
                      {sectionOpen && (
                        <div className={toneClass(tone, 'pl-3 border-l border-slate-100 space-y-2', 'pl-3 border-l border-white/5 space-y-2')}>
                          {section.items.map((item) => {
                            if (item.type === 'quiz' && item.status && typeof item.percent === 'number') {
                              const styles = QUIZ_STATUS_STYLES[item.status];
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => item.nodeId && onSelectQuiz?.(item.nodeId)}
                                  className={`flex items-center justify-between gap-3 rounded-xl px-2 py-2 border transition-colors ${
                                    item.nodeId
                                      ? toneClass(tone, 'bg-white border-slate-200 hover:bg-slate-50', 'bg-white/5 border-white/5 hover:bg-white/10')
                                      : toneClass(tone, 'bg-white border-slate-200', 'bg-white/5 border-white/5')
                                  }`}
                                >
                                  <div>
                                    <div className={toneClass(tone, 'text-[11px] font-semibold text-slate-700', 'text-[11px] font-semibold text-white/80')}>{item.label}</div>
                                    <div className={`text-[9px] uppercase tracking-[0.2em] ${styles.textClass}`}>{styles.label}</div>
                                  </div>
                                  <QuizPercentBadge percent={item.percent} color={styles.color} tone={tone} />
                                </button>
                              );
                            }
                            return (
                              <div key={item.id} className={toneClass(tone, 'flex items-center justify-between text-[11px] text-slate-600', 'flex items-center justify-between text-[11px] text-white/70')}>
                                <span>{item.label}</span>
                                {item.date && <span className={toneClass(tone, 'text-[10px] text-slate-400', 'text-[10px] text-white/35')}>{item.date}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

interface SidebarSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  tone?: PanelTone;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, isOpen, onToggle, children, tone }) => (
  <div className="space-y-3">
    <button
      type="button"
      onClick={onToggle}
      className={toneClass(
        tone,
        'w-full flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-400',
        'w-full flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/50'
      )}
    >
      <span>{title}</span>
      <ChevronRight
        size={14}
        className={toneClass(
          tone,
          `text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`,
          `text-white/40 transition-transform ${isOpen ? 'rotate-90' : ''}`
        )}
      />
    </button>
    {isOpen && <div className="space-y-3">{children}</div>}
  </div>
);

export const SidebarOption: React.FC<{ label: string; active: boolean; onClick: () => void; tone?: PanelTone }> = ({
  label,
  active,
  onClick,
  tone
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? toneClass(tone, 'bg-slate-100 text-slate-900', 'bg-white/10 text-white')
        : toneClass(tone, 'text-slate-600 hover:bg-slate-100/70', 'text-white/60 hover:bg-white/5')
    }`}
  >
    <span>{label}</span>
    <span
      className={toneClass(
        tone,
        `h-2 w-2 rounded-full ${active ? 'bg-slate-700' : 'bg-slate-300'}`,
        `h-2 w-2 rounded-full ${active ? 'bg-white' : 'bg-white/20'}`
      )}
    />
  </button>
);

export const SidebarSwitch: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void; tone?: PanelTone }> = ({
  label,
  checked,
  onChange,
  tone
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={toneClass(
      tone,
      'w-full flex items-center justify-between text-xs text-slate-600',
      'w-full flex items-center justify-between text-xs text-white/70'
    )}
  >
    <span>{label}</span>
    <span
      className={toneClass(
        tone,
        `w-10 h-5 rounded-full border border-slate-200 flex items-center px-0.5 transition-colors ${checked ? 'bg-[#30d158]/70' : 'bg-slate-100'}`,
        `w-10 h-5 rounded-full border border-white/10 flex items-center px-0.5 transition-colors ${checked ? 'bg-[#30d158]/70' : 'bg-white/10'}`
      )}
    >
      <span className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </span>
  </button>
);

const DetailRow: React.FC<{ label: string; value: string; tone?: PanelTone }> = ({ label, value, tone }) => (
  <div className="space-y-1">
    <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.2em] text-slate-400', 'text-[9px] uppercase tracking-[0.2em] text-white/40')}>{label}</div>
    <div className={toneClass(tone, 'text-[11px] text-slate-600', 'text-[11px] text-white/70')}>{value}</div>
  </div>
);

const QuizDetailContent: React.FC<{ detail: QuizDetail; compact?: boolean; tone?: PanelTone }> = ({ detail, compact, tone }) => {
  const statusStyle = QUIZ_STATUS_STYLES[detail.status];
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Quiz Detail</div>
          <div className={toneClass(tone, `${compact ? 'text-sm' : 'text-lg'} mt-2 font-semibold text-slate-900`, `${compact ? 'text-sm' : 'text-lg'} mt-2 font-semibold text-white`)}>{detail.title}</div>
          <div className={toneClass(tone, 'text-[11px] text-slate-600', 'text-[11px] text-white/60')}>{detail.subject}</div>
        </div>
        <span className={toneClass(tone, `px-2 py-1 rounded-full border border-slate-200 text-[9px] uppercase tracking-[0.2em] ${statusStyle.textClass}`, `px-2 py-1 rounded-full border border-white/10 text-[9px] uppercase tracking-[0.2em] ${statusStyle.textClass}`)}>
          {statusStyle.label}
        </span>
      </div>
      <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'}`}>
        <DetailRow label="Date" value={detail.date} tone={tone} />
        <DetailRow label="Score" value={detail.score} tone={tone} />
        <DetailRow label="Duration" value={detail.duration} tone={tone} />
        <DetailRow label="Place" value={detail.place} tone={tone} />
      </div>
      <DetailRow label="Professors" value={detail.professors.join(', ')} tone={tone} />
      <div className="space-y-2">
        <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.2em] text-slate-400', 'text-[9px] uppercase tracking-[0.2em] text-white/40')}>Topics</div>
        <div className="flex flex-wrap gap-2">
          {detail.topics.map((topic) => (
            <span
              key={topic}
              className={toneClass(
                tone,
                'rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] text-slate-600',
                'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70'
              )}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const QuizDetailPanel: React.FC<{ detail: QuizDetail | null; solid?: boolean; tone?: PanelTone }> = ({
  detail,
  solid = false,
  tone
}) => (
  <div
    className={`rounded-[24px] shadow-xl px-5 py-4 ${toneClass(
      tone,
      `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-xl'}`,
      `border border-white/15 ${solid ? 'bg-[#101114]' : 'bg-white/10 backdrop-blur-xl'}`
    )}`}
  >
    {detail ? (
      <QuizDetailContent detail={detail} tone={tone} />
    ) : (
      <div className="space-y-2">
        <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Quiz Detail</div>
        <p className={toneClass(tone, 'text-[11px] text-slate-500', 'text-[11px] text-white/50')}>Select a quiz to see topics, score, and timing.</p>
      </div>
    )}
  </div>
);

const formatNodeType = (type: string) =>
  type
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const NodeDetailPanel: React.FC<{ node: GraphNode | null; course?: CourseTreeCourse | null; solid?: boolean; tone?: PanelTone }> = ({
  node,
  course,
  solid = false,
  tone
}) => {
  if (!node) {
    return (
      <div
        className={`rounded-[24px] shadow-xl px-5 py-4 ${toneClass(
          tone,
          `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-xl'}`,
          `border border-white/15 ${solid ? 'bg-[#101114]' : 'bg-white/10 backdrop-blur-xl'}`
        )}`}
      >
        <div className="space-y-2">
          <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Node Detail</div>
          <p className={toneClass(tone, 'text-[11px] text-slate-500', 'text-[11px] text-white/50')}>Select a course or lecture node to view details.</p>
        </div>
      </div>
    );
  }

  const lectureCount = course?.sections.find((section) => section.id === 'lectures')?.items.length ?? 0;
  const assignmentCount = course?.sections.find((section) => section.id === 'assignments')?.items.length ?? 0;
  const quizCount = course?.sections.find((section) => section.id === 'quizzes')?.items.length ?? 0;

  return (
    <div
      className={`rounded-[24px] shadow-xl px-5 py-4 ${toneClass(
        tone,
        `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-xl'}`,
        `border border-white/15 ${solid ? 'bg-[#101114]' : 'bg-white/10 backdrop-blur-xl'}`
      )}`}
    >
      <div className="space-y-4">
        <div>
          <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Node Detail</div>
          <div className={toneClass(tone, 'mt-2 text-lg font-semibold text-slate-900', 'mt-2 text-lg font-semibold text-white')}>{node.label ?? node.id}</div>
          <div className={toneClass(tone, 'text-[11px] text-slate-600', 'text-[11px] text-white/60')}>{formatNodeType(node.type)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="Credits" value={`${node.val}`} tone={tone} />
          <DetailRow label="Cluster" value={`Group ${node.group}`} tone={tone} />
          {course && <DetailRow label="Course" value={course.label} tone={tone} />}
        </div>
        {course && (
          <div className="space-y-2">
            <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.2em] text-slate-400', 'text-[9px] uppercase tracking-[0.2em] text-white/40')}>Course Snapshot</div>
            <div className="flex flex-wrap gap-2">
              <span className={toneClass(
                tone,
                'rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] text-slate-600',
                'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70'
              )}>
                {lectureCount} Lectures
              </span>
              <span className={toneClass(
                tone,
                'rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] text-slate-600',
                'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70'
              )}>
                {assignmentCount} Assignments
              </span>
              <span className={toneClass(
                tone,
                'rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] text-slate-600',
                'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70'
              )}>
                {quizCount} Quizzes
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FloatingInfoCardProps {
  node: GraphNode;
  onClose: () => void;
  solid?: boolean;
  tone?: PanelTone;
}

export const FloatingInfoCardSvg: React.FC<FloatingInfoCardProps> = ({ node, onClose, solid = false, tone }) => {
  const quizDetail = node.type === 'quiz' ? QUIZ_DETAILS[node.id] : null;

  if (quizDetail) {
    return (
      <div
        className={`rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.2)] px-4 py-3 ${toneClass(
          tone,
          `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-2xl'}`,
          `border border-white/20 ${solid ? 'bg-[#101114]' : 'bg-white/10 backdrop-blur-2xl'}`
        )}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Quiz Insight</div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className={toneClass(tone, 'p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors', 'p-1 rounded-full text-white/50 hover:text-white/80 transition-colors')}
            aria-label="Close floating quiz info"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-3">
          <QuizDetailContent detail={quizDetail} compact tone={tone} />
        </div>
      </div>
    );
  }

  if (node.type === 'note') {
    return (
      <div
        className={`rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.2)] px-4 py-3 ${toneClass(
          tone,
          `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-2xl'}`,
          `border border-white/20 ${solid ? 'bg-[#101114]' : 'bg-white/10 backdrop-blur-2xl'}`
        )}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Note</div>
            <div className={toneClass(tone, 'mt-2 text-sm font-semibold text-slate-900', 'mt-2 text-sm font-semibold text-white')}>{node.label ?? node.id}</div>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className={toneClass(tone, 'p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors', 'p-1 rounded-full text-white/50 hover:text-white/80 transition-colors')}
            aria-label="Close floating note"
          >
            <X size={14} />
          </button>
        </div>
        <p className={toneClass(tone, 'mt-3 text-[11px] leading-snug text-slate-600', 'mt-3 text-[11px] leading-snug text-white/60')}>Pinned note for your current course.</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.2)] px-4 py-3 ${toneClass(
        tone,
        `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/80 backdrop-blur-2xl'}`,
        `border border-white/20 ${solid ? 'bg-[#101114]' : 'bg-white/10 backdrop-blur-2xl'}`
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={toneClass(tone, 'text-[9px] uppercase tracking-[0.25em] text-slate-400', 'text-[9px] uppercase tracking-[0.25em] text-white/50')}>Course Insight</div>
          <div className={toneClass(tone, 'mt-2 text-sm font-semibold text-slate-900', 'mt-2 text-sm font-semibold text-white')}>{node.label ?? node.id}</div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className={toneClass(tone, 'p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors', 'p-1 rounded-full text-white/50 hover:text-white/80 transition-colors')}
          aria-label="Close floating course info"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={toneClass(
          tone,
          'px-2 py-1 rounded-full bg-slate-100 text-[9px] uppercase tracking-[0.2em] text-slate-600',
          'px-2 py-1 rounded-full bg-white/15 text-[9px] uppercase tracking-[0.2em] text-white/70'
        )}>
          {node.type}
        </span>
        <span className={toneClass(
          tone,
          'px-2 py-1 rounded-full bg-slate-100 text-[9px] uppercase tracking-[0.2em] text-slate-600',
          'px-2 py-1 rounded-full bg-white/15 text-[9px] uppercase tracking-[0.2em] text-white/70'
        )}>
          Credits {node.val}
        </span>
      </div>
      <p className={toneClass(tone, 'mt-3 text-[11px] leading-snug text-slate-600', 'mt-3 text-[11px] leading-snug text-white/60')}>
        Live details for {node.label ?? node.id}. Drag the node to watch this card follow.
      </p>
    </div>
  );
};

interface ExperimentalPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  enableFloatingInfo: boolean;
  setEnableFloatingInfo: (value: boolean) => void;
  enableWebglHoverPulse: boolean;
  setEnableWebglHoverPulse: (value: boolean) => void;
  enableShapeVariants: boolean;
  setEnableShapeVariants: (value: boolean) => void;
  enableQuizRings: boolean;
  setEnableQuizRings: (value: boolean) => void;
  disablePanelBlur: boolean;
  setDisablePanelBlur: (value: boolean) => void;
  enableWebglHighContrastLinks: boolean;
  setEnableWebglHighContrastLinks: (value: boolean) => void;
  solid?: boolean;
  tone?: PanelTone;
}

export const ExperimentalPanel: React.FC<ExperimentalPanelProps> = ({
  isOpen,
  onToggleOpen,
  enableFloatingInfo,
  setEnableFloatingInfo,
  enableWebglHoverPulse,
  setEnableWebglHoverPulse,
  enableShapeVariants,
  setEnableShapeVariants,
  enableQuizRings,
  setEnableQuizRings,
  disablePanelBlur,
  setDisablePanelBlur,
  enableWebglHighContrastLinks,
  setEnableWebglHighContrastLinks,
  solid = false,
  tone
}) => (
  <div
    className={`w-[260px] rounded-2xl shadow-2xl overflow-hidden ${toneClass(
      tone,
      `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/85 backdrop-blur-xl'}`,
      `border border-white/10 ${solid ? 'bg-[#0f1014]' : 'bg-[#101114]/90 backdrop-blur-xl'}`
    )}`}
  >
    <button
      type="button"
      onClick={onToggleOpen}
      className={toneClass(
        tone,
        'w-full flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-slate-400',
        'w-full flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60'
      )}
    >
      <span>Experimental</span>
      <ChevronRight
        size={14}
        className={toneClass(
          tone,
          `text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`,
          `text-white/40 transition-transform ${isOpen ? 'rotate-90' : ''}`
        )}
      />
    </button>
    {isOpen && (
      <div className="px-4 pb-4 space-y-3">
        <div className={toneClass(tone, 'text-[10px] uppercase tracking-[0.2em] text-slate-400', 'text-[10px] uppercase tracking-[0.2em] text-white/35')}>Graph overlays</div>
        <ExperimentalToggle
          label="Floating course card"
          checked={enableFloatingInfo}
          onChange={setEnableFloatingInfo}
          tone={tone}
        />
        <ExperimentalToggle
          label="Hover bounce"
          checked={enableWebglHoverPulse}
          onChange={setEnableWebglHoverPulse}
          tone={tone}
        />
        <ExperimentalToggle
          label="Alternate node shapes"
          checked={enableShapeVariants}
          onChange={setEnableShapeVariants}
          tone={tone}
        />
        <ExperimentalToggle
          label="Quiz rings"
          checked={enableQuizRings}
          onChange={setEnableQuizRings}
          tone={tone}
        />
        <ExperimentalToggle
          label="Solid panels (no blur)"
          checked={disablePanelBlur}
          onChange={setDisablePanelBlur}
          tone={tone}
        />
        <div className={toneClass(tone, 'pt-2 text-[10px] uppercase tracking-[0.2em] text-slate-400', 'pt-2 text-[10px] uppercase tracking-[0.2em] text-white/35')}>WebGL tweaks</div>
        <ExperimentalToggle
          label="High-contrast links"
          checked={enableWebglHighContrastLinks}
          onChange={setEnableWebglHighContrastLinks}
          tone={tone}
        />
      </div>
    )}
  </div>
);

interface ExperimentalToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  tone?: PanelTone;
}

const ExperimentalToggle: React.FC<ExperimentalToggleProps> = ({ label, checked, onChange, tone }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={toneClass(tone, 'w-full flex items-center justify-between text-xs text-slate-600', 'w-full flex items-center justify-between text-xs text-white/70')}
  >
    <span>{label}</span>
    <span
      className={toneClass(
        tone,
        `w-10 h-5 rounded-full border border-slate-200 flex items-center px-0.5 transition-colors ${checked ? 'bg-[#5ac8fa]/70' : 'bg-slate-100'}`,
        `w-10 h-5 rounded-full border border-white/10 flex items-center px-0.5 transition-colors ${checked ? 'bg-[#5ac8fa]/90' : 'bg-white/10'}`
      )}
    >
      <span className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </span>
  </button>
);

interface ObsidianToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  tone?: PanelTone;
}

const ObsidianToggle: React.FC<ObsidianToggleProps> = ({ label, checked, onChange, tone }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={toneClass(tone, 'w-full flex items-center justify-between text-xs text-slate-600', 'w-full flex items-center justify-between text-xs text-white/70')}
  >
    <span>{label}</span>
    <span
      className={toneClass(
        tone,
        `w-10 h-5 rounded-full border border-slate-200 flex items-center px-0.5 transition-colors ${checked ? 'bg-[#ff8a1d]/80' : 'bg-slate-100'}`,
        `w-10 h-5 rounded-full border border-white/10 flex items-center px-0.5 transition-colors ${checked ? 'bg-[#ff8a1d]/90' : 'bg-white/10'}`
      )}
    >
      <span className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </span>
  </button>
);

interface ObsidianSliderProps {
  label: string;
  value: number;
  set: (value: number) => void;
  min: number;
  max: number;
  step: number;
  tone?: PanelTone;
}

const ObsidianSlider: React.FC<ObsidianSliderProps> = ({ label, value, set, min, max, step, tone }) => {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className={toneClass(tone, 'flex items-end justify-between text-xs text-slate-600', 'flex items-end justify-between text-xs text-white/70')}>
        <span>{label}</span>
        <span className={toneClass(tone, 'text-[10px] font-semibold text-slate-500', 'text-[10px] font-semibold text-white/50')}>{value.toFixed(1)}</span>
      </div>
      <div className="relative h-2 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => set(Number(event.target.value))}
          className="absolute -inset-y-3 inset-x-0 w-full h-8 opacity-0 cursor-pointer z-10"
        />
        <div className={toneClass(tone, 'absolute inset-0 rounded-full bg-slate-200', 'absolute inset-0 rounded-full bg-white/10')} />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#ff8a1d] transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
        <div
          className={toneClass(
            tone,
            'absolute top-1/2 h-4 w-4 rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.15)] -translate-y-1/2 pointer-events-none',
            'absolute top-1/2 h-4 w-4 rounded-full bg-white shadow-[0_6px_16px_rgba(0,0,0,0.5)] -translate-y-1/2 pointer-events-none'
          )}
          style={{ left: `${percent}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
};

interface ObsidianSettingsPanelProps {
  showArrows: boolean;
  setShowArrows: (value: boolean) => void;
  textFade: number;
  setTextFade: (value: number) => void;
  nodeScale: number;
  setNodeScale: (value: number) => void;
  linkThickness: number;
  setLinkThickness: (value: number) => void;
  animate: boolean;
  setAnimate: (value: boolean) => void;
  onClose: () => void;
  solid?: boolean;
  tone?: PanelTone;
}

export const ObsidianSettingsPanel: React.FC<ObsidianSettingsPanelProps> = ({
  showArrows,
  setShowArrows,
  textFade,
  setTextFade,
  nodeScale,
  setNodeScale,
  linkThickness,
  setLinkThickness,
  animate,
  setAnimate,
  onClose,
  solid = false,
  tone
}) => {
  const [filters, setFilters] = useState({
    tags: true,
    attachments: false,
    existingOnly: false,
    orphans: true
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isDisplayOpen, setIsDisplayOpen] = useState(true);

  return (
    <div
      className={`w-[280px] rounded-2xl shadow-2xl overflow-hidden ${toneClass(
        tone,
        `border border-slate-200 ${solid ? 'bg-white' : 'bg-white/90 backdrop-blur-xl'}`,
        `border border-white/10 ${solid ? 'bg-[#1b1b1b]' : 'bg-[#1b1b1b]/95 backdrop-blur-xl'}`
      )}`}
    >
      <div className={toneClass(tone, 'px-4 py-3 border-b border-slate-200 flex items-center justify-between', 'px-4 py-3 border-b border-white/10 flex items-center justify-between')}>
        <div className={toneClass(tone, 'text-sm font-semibold text-slate-700', 'text-sm font-semibold text-white/80')}>Filters</div>
        <button
          type="button"
          onClick={onClose}
          className={toneClass(tone, 'p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors', 'p-1 rounded-full text-white/40 hover:text-white/70 transition-colors')}
          aria-label="Close Obsidian settings"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className={toneClass(tone, 'w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400', 'w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/40')}
          >
            <span>Filters</span>
            <ChevronRight size={14} className={toneClass(tone, `text-slate-300 transition-transform ${isFiltersOpen ? 'rotate-90' : ''}`, `text-white/30 transition-transform ${isFiltersOpen ? 'rotate-90' : ''}`)} />
          </button>
          {isFiltersOpen && (
            <div className="space-y-3">
              <ObsidianToggle
                label="Tags"
                checked={filters.tags}
                onChange={(value) => setFilters((prev) => ({ ...prev, tags: value }))}
                tone={tone}
              />
              <ObsidianToggle
                label="Attachments"
                checked={filters.attachments}
                onChange={(value) => setFilters((prev) => ({ ...prev, attachments: value }))}
                tone={tone}
              />
              <ObsidianToggle
                label="Existing files only"
                checked={filters.existingOnly}
                onChange={(value) => setFilters((prev) => ({ ...prev, existingOnly: value }))}
                tone={tone}
              />
              <ObsidianToggle
                label="Orphans"
                checked={filters.orphans}
                onChange={(value) => setFilters((prev) => ({ ...prev, orphans: value }))}
                tone={tone}
              />
            </div>
          )}
        </div>

        <div className={toneClass(tone, 'space-y-3 pt-2 border-t border-slate-200', 'space-y-3 pt-2 border-t border-white/10')}>
          <button
            type="button"
            onClick={() => setIsDisplayOpen((prev) => !prev)}
            className={toneClass(tone, 'w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400', 'w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/40')}
          >
            <span>Display</span>
            <ChevronRight size={14} className={toneClass(tone, `text-slate-300 transition-transform ${isDisplayOpen ? 'rotate-90' : ''}`, `text-white/30 transition-transform ${isDisplayOpen ? 'rotate-90' : ''}`)} />
          </button>
          {isDisplayOpen && (
            <div className="space-y-3">
              <ObsidianToggle label="Arrows" checked={showArrows} onChange={setShowArrows} tone={tone} />
              <ObsidianSlider label="Text fade threshold" value={textFade} set={setTextFade} min={0.4} max={3.2} step={0.1} tone={tone} />
              <ObsidianSlider label="Node size" value={nodeScale} set={setNodeScale} min={0.8} max={2.4} step={0.1} tone={tone} />
              <ObsidianSlider label="Link thickness" value={linkThickness} set={setLinkThickness} min={0.8} max={3.0} step={0.1} tone={tone} />
              <button
                type="button"
                onClick={() => setAnimate(!animate)}
                className={toneClass(
                  tone,
                  'w-full mt-2 rounded-xl bg-[#ff8a1d] text-white text-sm font-semibold py-2 transition-transform active:scale-[0.98] shadow-[0_10px_25px_rgba(249,115,22,0.35)]',
                  'w-full mt-2 rounded-xl bg-[#ff8a1d] text-white text-sm font-semibold py-2 transition-transform active:scale-[0.98]'
                )}
              >
                {animate ? 'Pause' : 'Animate'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ObsidianInfoPanelsProps {
  activeNode: GraphNode | null;
  neighbors: string[];
  solid?: boolean;
  tone?: PanelTone;
}

export const ObsidianInfoPanels: React.FC<ObsidianInfoPanelsProps> = ({ activeNode, neighbors, solid = false, tone }) => {
  const neighborList = neighbors.slice(0, 6);
  const surfaceClass = toneClass(
    tone,
    solid ? 'bg-white' : 'bg-white/90 backdrop-blur-xl',
    solid ? 'bg-[#1b1b1b]' : 'bg-[#1b1b1b]/90 backdrop-blur-xl'
  );

  return (
    <div className="w-[280px] space-y-3">
      <div className={`rounded-2xl shadow-xl px-4 py-3 ${toneClass(tone, 'border border-slate-200', 'border border-white/10')} ${surfaceClass}`}>
        <div className={toneClass(tone, 'text-[10px] uppercase tracking-[0.2em] text-slate-400', 'text-[10px] uppercase tracking-[0.2em] text-white/40')}>Course Info</div>
        {activeNode ? (
          <>
            <div className={toneClass(tone, 'mt-2 text-sm font-semibold text-slate-900', 'mt-2 text-sm font-semibold text-white')}>{activeNode.id}</div>
            <div className="mt-2 flex gap-2">
              <span className={toneClass(
                tone,
                'px-2 py-1 rounded-full bg-slate-100 text-[9px] uppercase tracking-[0.2em] text-slate-500',
                'px-2 py-1 rounded-full bg-white/10 text-[9px] uppercase tracking-[0.2em] text-white/60'
              )}>
                {activeNode.type}
              </span>
              <span className={toneClass(
                tone,
                'px-2 py-1 rounded-full bg-slate-100 text-[9px] uppercase tracking-[0.2em] text-slate-500',
                'px-2 py-1 rounded-full bg-white/10 text-[9px] uppercase tracking-[0.2em] text-white/60'
              )}>
                Credits {activeNode.val}
              </span>
            </div>
            <p className={toneClass(tone, 'mt-2 text-[11px] leading-snug text-slate-500', 'mt-2 text-[11px] leading-snug text-white/50')}>
              Course details for {activeNode.id} and its related topics.
            </p>
          </>
        ) : (
          <p className={toneClass(tone, 'mt-2 text-[11px] leading-snug text-slate-500', 'mt-2 text-[11px] leading-snug text-white/50')}>
            Select a node to see course details and links.
          </p>
        )}
      </div>

      <div className={`rounded-2xl shadow-xl px-4 py-3 ${toneClass(tone, 'border border-slate-200', 'border border-white/10')} ${surfaceClass}`}>
        <div className={toneClass(tone, 'text-[10px] uppercase tracking-[0.2em] text-slate-400', 'text-[10px] uppercase tracking-[0.2em] text-white/40')}>Connections</div>
        {activeNode && neighborList.length > 0 ? (
          <div className="mt-2 space-y-2">
            {neighborList.map((neighbor) => (
              <div key={neighbor} className={toneClass(tone, 'flex items-center gap-2 text-[11px] text-slate-600', 'flex items-center gap-2 text-[11px] text-white/70')}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ddc84]" />
                <span>{neighbor}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={toneClass(tone, 'mt-2 text-[11px] text-slate-500', 'mt-2 text-[11px] text-white/50')}>No connections selected yet.</p>
        )}
      </div>
    </div>
  );
};
