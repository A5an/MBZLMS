import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { WidgetContainer } from '../WidgetContainer';
import { KnowledgeGraphScene } from '../graphs/KnowledgeGraphScene';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const KnowledgeGraphWidget: React.FC<WidgetProps> = (props) => {
  const { isEditable } = props;
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <WidgetContainer
        {...props}
        title="Knowledge Graph"
        subtitle="Curriculum map"
        icon={<Brain size={18} />}
        isEditable={isEditable}
        noPadding
        onHeaderClick={
          isEditable
            ? undefined
            : () => {
                setIsExpanded(true);
              }
        }
      >
        <div className="flex-1 min-h-0 p-2">
          <KnowledgeGraphScene />
        </div>
      </WidgetContainer>

      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-3xl">
          <div className="relative h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-10 py-6 border-b border-white/10 bg-white/10">
              <div className="flex items-center gap-3">
                <div className="shrink-0 text-white bg-white/15 p-2.5 rounded-2xl border border-white/20 shadow-sm">
                  <Brain size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">Knowledge Graph</h2>
                  <p className="text-xs font-medium text-white/60">Interactive curriculum map</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white/80 bg-white/10 border border-white/20 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0 p-8">
              <div className="h-full w-full rounded-[2.5rem] bg-white/5 border border-white/10 p-4 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)]">
                <KnowledgeGraphScene />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
