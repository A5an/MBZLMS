import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { Settings, MapPin } from 'lucide-react';
import { useTheme } from '../theme';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const ProfileWidget: React.FC<WidgetProps> = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <WidgetContainer className="h-full" noPadding {...props}>
       <div className={`relative h-full flex flex-col items-center justify-center p-6 text-center ${
         isDark ? 'bg-gradient-to-b from-white/10 to-white/5' : 'bg-gradient-to-b from-white/40 to-white/10'
       }`}>
            
            <div className="relative shrink-0 group cursor-pointer mb-3">
                <div className={`w-20 h-20 rounded-full p-1 shadow-lg transition-transform duration-500 group-hover:scale-105 mx-auto ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                    <img 
                        src="https://picsum.photos/300/300" 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
                <div className={`absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-[3px] ${isDark ? 'border-slate-950' : 'border-white'}`}></div>
            </div>
            
            <div className="w-full">
                <h2 className={`text-xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Ali Ahmed</h2>
                <p className={`text-xs font-medium mt-1 uppercase tracking-wide ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Computer Vision</p>
                
                <div className="mt-3 flex items-center justify-center gap-2 opacity-60">
                     <MapPin size={10} className={isDark ? 'text-white/60' : 'text-gray-600'} />
                     <span className={`text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Masdar City, Abu Dhabi</span>
                </div>

                <div className="mt-4 flex justify-center gap-2">
                    <span className={`text-[9px] px-3 py-1 rounded-full border font-mono ${
                      isDark ? 'bg-white/10 text-white/60 border-white/10' : 'bg-white/50 text-gray-500 border-black/5'
                    }`}>ID: 2024001</span>
                </div>
            </div>
            
            {/* Quick Action Overlay on Hover */}
            <div className={`absolute top-4 right-4 opacity-0 ${!props.isEditable ? 'group-hover:opacity-100' : ''} transition-opacity`}>
                <Settings size={16} className={`cursor-pointer ${isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-700'}`} />
            </div>
       </div>
    </WidgetContainer>
  );
};
