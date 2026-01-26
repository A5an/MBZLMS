import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { GraduationCap, Trophy, TrendingUp, Book } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { GradeData } from '../../types';
import { useTheme } from '../theme';

const data: GradeData[] = [
  { subject: 'CV', A: 95, fullMark: 100 },
  { subject: 'NLP', A: 88, fullMark: 100 },
  { subject: 'ML', A: 92, fullMark: 100 },
  { subject: 'Math', A: 85, fullMark: 100 },
  { subject: 'Ethics', A: 98, fullMark: 100 },
  { subject: 'Research', A: 90, fullMark: 100 },
];

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const GradesWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <WidgetContainer 
        title="Performance"
        subtitle="Fall Semester 2025"
        icon={<GraduationCap size={18} />}
        {...props}
    >
      <div className="w-full h-full relative min-h-[150px] flex flex-col">
        {/* Top Stats Row */}
        <div className="flex justify-between items-start mb-2 px-1">
            <div className="flex flex-col">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-gray-500'}`}>CGPA</span>
                <span className={`text-3xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-800'}`}>3.85</span>
                <div className="flex items-center gap-1 mt-1 text-green-500">
                    <TrendingUp size={10} />
                    <span className="text-[9px] font-bold">+0.12</span>
                </div>
            </div>
            
             <div className="flex gap-3">
                 <div className="text-right">
                    <div className={`flex items-center justify-end gap-1 mb-0.5 ${isDark ? 'text-white/45' : 'text-gray-400'}`}>
                        <Trophy size={10} />
                        <span className="text-[9px] font-semibold uppercase">Rank</span>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>#5</span>
                    <span className={`text-[9px] block ${isDark ? 'text-white/40' : 'text-gray-400'}`}>of 142</span>
                 </div>
                 <div className="text-right">
                    <div className={`flex items-center justify-end gap-1 mb-0.5 ${isDark ? 'text-white/45' : 'text-gray-400'}`}>
                        <Book size={10} />
                        <span className="text-[9px] font-semibold uppercase">Creds</span>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>24</span>
                    <span className={`text-[9px] block ${isDark ? 'text-white/40' : 'text-gray-400'}`}>/ 30</span>
                 </div>
             </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative min-h-0">
             <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="55%" outerRadius="70%" data={data}>
                    <PolarGrid stroke={isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'} strokeDasharray="3 3" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: isDark ? 'rgba(255,255,255,0.65)' : '#6b7280', fontSize: 9, fontWeight: 700 }} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                    name="Student"
                    dataKey="A"
                    stroke={isDark ? '#60a5fa' : '#2563eb'}
                    strokeWidth={2}
                    fill={isDark ? '#60a5fa' : '#3b82f6'}
                    fillOpacity={isDark ? 0.18 : 0.2}
                    isAnimationActive={true}
                    />
                </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </WidgetContainer>
  );
};
