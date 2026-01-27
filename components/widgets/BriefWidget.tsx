import React, { useEffect, useState } from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { Sparkles } from 'lucide-react';
import { getDailyBrief } from '../../services/geminiService';
import { useTheme } from '../theme';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const BriefWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [brief, setBrief] = useState("Loading your daily AI insights...");

  // useEffect(() => {
  //   const fetchBrief = async () => {
  //       const text = await getDailyBrief();
  //       setBrief(text);
  //   };
  //   fetchBrief();
  // }, []);

  return (
    <WidgetContainer 
        title="Daily Brief"
        icon={<Sparkles size={18} className="text-purple-500" />}
        {...props}
    >
        <div className="h-full flex flex-col justify-center">
            <p className={`text-sm font-medium leading-relaxed italic ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                "{brief}"
            </p>
            <div className="mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className={`text-[9px] uppercase tracking-widest ${isDark ? 'text-white/45' : 'text-gray-400'}`}>Live Updates</span>
            </div>
        </div>
    </WidgetContainer>
  );
};
