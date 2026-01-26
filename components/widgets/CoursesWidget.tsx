import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { BookOpen } from 'lucide-react';
import { Course } from '../../types';
import { useTheme } from '../theme';

const COURSES: Course[] = [
    { id: '1', name: 'Computer Vision', code: 'CS-701', progress: 75, color: 'bg-blue-500' },
    { id: '2', name: 'NLP', code: 'CS-702', progress: 45, color: 'bg-purple-500' },
    { id: '3', name: 'Machine Learning', code: 'CS-703', progress: 90, color: 'bg-indigo-500' },
    { id: '4', name: 'Ethics', code: 'HUM-601', progress: 30, color: 'bg-green-500' },
];

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const CoursesWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
    
  return (
    <WidgetContainer 
        title="Courses"
        subtitle="Fall 2025"
        icon={<BookOpen size={18} />}
        {...props}
    >
      <div className="grid grid-cols-2 gap-2 h-full content-center">
        {COURSES.map(course => (
            <div key={course.id} className={`p-2 rounded-xl shadow-sm transition-all cursor-pointer hover:-translate-y-0.5 ${
              isDark
                ? 'bg-white/5 border border-white/10 hover:shadow-[0_12px_24px_-18px_rgba(0,0,0,0.6)]'
                : 'bg-white/60 border border-gray-100 hover:shadow-md'
            }`}>
                <div className="flex items-center gap-2 mb-1.5">
                     <div className={`w-1.5 h-1.5 rounded-full ${course.color}`}></div>
                     <span className={`text-[9px] font-bold ${isDark ? 'text-white/50' : 'text-gray-400'}`}>{course.code}</span>
                </div>
                <h3 className={`font-semibold text-[10px] truncate mb-1 ${isDark ? 'text-white/80' : 'text-gray-800'}`}>{course.name}</h3>
                <div className={`w-full rounded-full h-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div 
                        className={`h-0.5 rounded-full ${course.color}`} 
                        style={{ width: `${course.progress}%` }}
                    ></div>
                </div>
            </div>
        ))}
      </div>
    </WidgetContainer>
  );
};
