import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { NotebookPen } from 'lucide-react';
import { Note } from '../../types';
import { useTheme } from '../theme';

const NOTES: Note[] = [
    { id: '1', title: 'Thesis Ideas', preview: 'Focus on sparse transformers and efficient attention mechanisms.', date: '1/9' },
    { id: '2', title: 'Campus Transport', preview: 'Shuttle leaves at 8:00, 9:30, and 11:00 from building 1A.', date: '1/6' },
    { id: '3', title: 'Shopping List', preview: 'Milk, Eggs, GPU credits, Coffee beans.', date: '12/28' },
    { id: '4', title: 'Meeting Notes', preview: 'Prof suggested reading "Attention is all you need" again.', date: '12/20' },
    { id: '5', title: 'Project Ideas', preview: 'AI for identifying plant diseases using drone imagery.', date: '12/15' },
    { id: '6', title: 'Gym Schedule', preview: 'Mon/Wed/Fri - 6pm. Leg day on Friday.', date: '12/10' },
    { id: '7', title: 'Reading List', preview: 'Deep Learning Book (Goodfellow), Pattern Recognition (Bishop).', date: '12/05' },
    { id: '8', title: 'Code Snippets', preview: 'Python decorator for timing functions.', date: '11/30' },
];

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const NotesWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
    
  return (
    <WidgetContainer 
        className="h-full"
        title="Notes"
        subtitle="Last edited now"
        icon={<NotebookPen size={18} />}
        {...props}
    >
      <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto no-scrollbar content-start pb-2">
        {NOTES.map(note => (
            <div
              key={note.id}
              className={`p-3 rounded-xl transition-all border shadow-sm cursor-pointer group flex flex-col h-[85px] ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-yellow-300/30'
                  : 'bg-white/60 hover:bg-white border-transparent hover:border-yellow-200/50 hover:shadow-md'
              }`}
            >
                <div className="flex-1">
                    <h4 className={`font-semibold text-[12px] transition-colors truncate ${isDark ? 'text-white/85 group-hover:text-yellow-300' : 'text-gray-800 group-hover:text-yellow-600'}`}>{note.title}</h4>
                    <p className={`text-[10px] line-clamp-2 leading-snug mt-1 opacity-80 ${isDark ? 'text-white/55' : 'text-gray-500'}`}>{note.preview}</p>
                </div>
                <p className={`text-[9px] font-medium mt-1 text-right ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{note.date}</p>
            </div>
        ))}
      </div>
    </WidgetContainer>
  );
};
