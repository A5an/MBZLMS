import React, { useEffect, useState } from 'react';
import { Brain, Maximize2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { WidgetContainer } from '../WidgetContainer';
import { KnowledgeGraphScene } from '../graphs/KnowledgeGraphScene';
import { useTheme } from '../theme';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

const SUBJECT_PREVIEW = [
  { id: 'cv', name: 'Computer Vision', track: 'AI Core', nodes: '12 nodes', dot: 'bg-sky-400' },
  { id: 'ml', name: 'Machine Learning', track: 'AI Core', nodes: '18 nodes', dot: 'bg-indigo-400' },
  { id: 'nlp', name: 'NLP Systems', track: 'AI Core', nodes: '14 nodes', dot: 'bg-violet-400' },
  { id: 'cloud', name: 'Cloud Computing', track: 'Systems', nodes: '10 nodes', dot: 'bg-cyan-400' },
  { id: 'security', name: 'Cybersecurity', track: 'Systems', nodes: '9 nodes', dot: 'bg-emerald-400' },
  { id: 'ethics', name: 'AI Ethics', track: 'Business', nodes: '7 nodes', dot: 'bg-amber-400' }
];

export const KnowledgeGraphWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isEditable } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const openGraph = () => setIsExpanded(true);
  const closeGraph = () => setIsExpanded(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleOpenGraph = () => setIsExpanded(true);
    window.addEventListener('open-knowledge-graph', handleOpenGraph);
    return () => window.removeEventListener('open-knowledge-graph', handleOpenGraph);
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeGraph();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const overlay = (
    <div className="fixed inset-0 z-[100]">
      <KnowledgeGraphScene isFullscreen className="h-full w-full" onExit={closeGraph} />
    </div>
  );

  return (
    <>
      <WidgetContainer
        {...props}
        title="Knowledge Graph"
        subtitle="Curriculum map"
        icon={<Brain size={18} />}
        isEditable={isEditable}
        headerAction={
          !isEditable ? (
            <button
              type="button"
              onClick={openGraph}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none focus-visible:ring-2 active:scale-[0.98] ${
                isDark
                  ? 'text-white/70 bg-white/10 border border-white/15 hover:text-white hover:bg-white/20 focus-visible:ring-white/30'
                  : 'text-slate-600/90 bg-white/70 border border-white/60 hover:text-slate-800 hover:bg-white/90 focus-visible:ring-slate-400/40'
              }`}
              aria-label="Open knowledge graph"
            >
              <Maximize2 size={12} />
              Open
            </button>
          ) : undefined
        }
      >
        <div className="flex h-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 flex-1 content-start">
            {SUBJECT_PREVIEW.map((subject) => (
              <div
                key={subject.id}
                className={`flex flex-col justify-between rounded-2xl px-3 py-2.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 ${
                  isDark
                    ? 'border border-white/10 bg-white/5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.7)]'
                    : 'border border-white/70 bg-white/60 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${subject.dot}`} />
                    <span className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      {subject.track}
                    </span>
                  </div>
                  <span className={`text-[9px] font-semibold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{subject.nodes}</span>
                </div>
                <div className={`mt-2 text-[12px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                  {subject.name}
                </div>
              </div>
            ))}
          </div>
          {!isEditable && (
            <button
              type="button"
              onClick={openGraph}
              className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none focus-visible:ring-2 active:scale-[0.98] ${
                isDark
                  ? 'bg-white/10 border border-white/15 text-white/75 hover:bg-white/20 hover:text-white focus-visible:ring-white/30'
                  : 'bg-white/80 border border-white/70 text-slate-700 hover:bg-white hover:text-slate-900 focus-visible:ring-slate-300/60'
              }`}
            >
              <Maximize2 size={14} />
              Open Full Graph
            </button>
          )}
        </div>
      </WidgetContainer>

      {isExpanded && isMounted && createPortal(overlay, document.body)}
    </>
  );
};
