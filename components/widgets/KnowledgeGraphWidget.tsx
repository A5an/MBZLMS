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
  const [isExpanded, setIsExpanded] = useState(false);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-2xl">
          <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />
          <div className="relative w-[92vw] h-[86vh] max-w-[1400px] rounded-[2.5rem] border border-white/40 bg-white/70 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.7)] backdrop-blur-3xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 bg-white/60">
              <div className="flex items-center gap-3">
                <div className="shrink-0 text-gray-700 bg-white/70 p-2 rounded-2xl shadow-sm">
                  <Brain size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Knowledge Graph</h2>
                  <p className="text-xs font-medium text-gray-500">Interactive curriculum map</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 bg-white/70 border border-white/60 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-gray-800 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0 p-6">
              <div className="h-full w-full rounded-[2rem] bg-white/40 p-3">
                <KnowledgeGraphScene />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
