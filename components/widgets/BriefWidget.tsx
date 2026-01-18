import React, { useEffect, useState } from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { Sparkles } from 'lucide-react';
import { getDailyBrief } from '../../services/geminiService';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const BriefWidget: React.FC<WidgetProps> = (props) => {
  const [brief, setBrief] = useState("Loading your daily AI insights...");

  useEffect(() => {
    const fetchBrief = async () => {
        const text = await getDailyBrief();
        setBrief(text);
    };
    fetchBrief();
  }, []);

  return (
    <WidgetContainer 
        title="Daily Brief"
        icon={<Sparkles size={18} className="text-purple-500" />}
        {...props}
    >
        <div className="h-full flex flex-col justify-center">
            <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                "{brief}"
            </p>
            <div className="mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest">Live Updates</span>
            </div>
        </div>
    </WidgetContainer>
  );
};