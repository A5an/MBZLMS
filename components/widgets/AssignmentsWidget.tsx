import React, { useState } from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { ListTodo, Plus, Clock, AlertCircle } from 'lucide-react';
import { Assignment } from '../../types';
import { useTheme } from '../theme';

const INITIAL_ASSIGNMENTS: Assignment[] = [
  { id: '1', title: 'CV Project Proposal', course: 'Computer Vision', dueDate: 'Tonight', urgent: true },
  { id: '2', title: 'NLP Paper Review', course: 'NLP', dueDate: 'Tmrw', urgent: false },
  { id: '3', title: 'Research Methodology', course: 'Research', dueDate: 'Oct 15', urgent: false },
  { id: '4', title: 'Thesis Abstract', course: 'Thesis', dueDate: 'Oct 20', urgent: true },
  { id: '5', title: 'Ethics Essay', course: 'Ethics', dueDate: 'Nov 1', urgent: false },
  { id: '6', title: 'Lab Safety Quiz', course: 'Admin', dueDate: 'Nov 5', urgent: true },
  { id: '7', title: 'Model Training Log', course: 'ML Ops', dueDate: 'Nov 12', urgent: false },
  { id: '8', title: 'Peer Review', course: 'NLP', dueDate: 'Nov 15', urgent: false },
  { id: '9', title: 'Midterm Prep', course: 'Math', dueDate: 'Nov 20', urgent: true },
  { id: '10', title: 'Grant Application', course: 'Research', dueDate: 'Dec 1', urgent: false },
];

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const AssignmentsWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState(INITIAL_ASSIGNMENTS);

  const toggleItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <WidgetContainer 
        className="h-full" 
        title="Reminders"
        subtitle={`${items.length} Pending`}
        icon={<ListTodo size={18} />}
        headerAction={
          <Plus
            className={`w-5 h-5 cursor-pointer transition-colors ${
              isDark ? 'text-white/60 hover:text-blue-300' : 'text-gray-500 hover:text-blue-500'
            }`}
          />
        }
        {...props}
    >
      {/* 2-Column Grid for Horizontal Split like Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full overflow-y-auto no-scrollbar content-start pb-2">
        {items.map(item => (
            <div
              key={item.id}
              className={`group p-3 rounded-xl transition-all cursor-pointer border ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-blue-400/30'
                  : 'bg-white/40 hover:bg-white/80 border-transparent hover:border-blue-100 shadow-sm hover:shadow-md'
              }`}
            >
                <div className="flex items-start justify-between gap-2">
                     <div 
                        onClick={(e) => { e.stopPropagation(); !props.isEditable && toggleItem(item.id); }}
                        className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 cursor-pointer transition-all ${
                          isDark
                            ? 'border-white/30 group-hover:border-blue-400/60 group-hover:bg-blue-400/10'
                            : 'border-gray-400 group-hover:border-blue-500 group-hover:bg-blue-500/10'
                        }`}
                     ></div>
                     
                     <div className="flex-1 min-w-0">
                        <h4 className={`text-[12px] font-semibold leading-tight truncate mb-1 ${isDark ? 'text-white/85' : 'text-gray-800'}`}>{item.title}</h4>
                        <div className="flex items-center gap-1.5">
                             <span
                               className={`text-[10px] px-1.5 py-0.5 rounded border truncate max-w-[80px] ${
                                 isDark ? 'text-white/60 bg-white/10 border-white/10' : 'text-gray-500 bg-white/50 border-gray-100'
                               }`}
                             >
                                {item.course}
                             </span>
                             {item.urgent && <AlertCircle size={10} className="text-red-500" />}
                        </div>
                     </div>
                </div>
                
                <div className="mt-2 flex items-center justify-end gap-1">
                    <Clock size={10} className={item.urgent ? "text-red-400" : isDark ? 'text-white/40' : 'text-gray-400'} />
                    <span className={`text-[10px] font-medium ${item.urgent ? 'text-red-500' : isDark ? 'text-white/50' : 'text-gray-400'}`}>
                        {item.dueDate}
                    </span>
                </div>
            </div>
        ))}
        {items.length === 0 && (
          <div className={`col-span-2 text-center text-xs mt-10 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
            All clear! Relax.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
