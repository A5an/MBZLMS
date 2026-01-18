import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { BookOpen } from 'lucide-react';
import { Course } from '../../types';

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
    
  return (
    <WidgetContainer 
        title="Courses"
        subtitle="Fall 2025"
        icon={<BookOpen size={18} />}
        {...props}
    >
      <div className="grid grid-cols-2 gap-2 h-full content-center">
        {COURSES.map(course => (
            <div key={course.id} className="bg-white/60 border border-gray-100 p-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-1.5">
                     <div className={`w-1.5 h-1.5 rounded-full ${course.color}`}></div>
                     <span className="text-[9px] font-bold text-gray-400">{course.code}</span>
                </div>
                <h3 className="font-semibold text-[10px] text-gray-800 truncate mb-1">{course.name}</h3>
                <div className="w-full bg-gray-200 rounded-full h-0.5">
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