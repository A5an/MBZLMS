import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { Settings, MapPin } from 'lucide-react';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const ProfileWidget: React.FC<WidgetProps> = (props) => {
  return (
    <WidgetContainer className="h-full" noPadding {...props}>
       <div className="relative h-full flex flex-col items-center justify-center bg-gradient-to-b from-white/40 to-white/10 p-6 text-center">
            
            <div className="relative shrink-0 group cursor-pointer mb-3">
                <div className="w-20 h-20 rounded-full p-1 shadow-lg bg-white transition-transform duration-500 group-hover:scale-105 mx-auto">
                    <img 
                        src="https://picsum.photos/300/300" 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-[3px] border-white"></div>
            </div>
            
            <div className="w-full">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Ali Ahmed</h2>
                <p className="text-xs font-medium text-blue-600 mt-1 uppercase tracking-wide">Computer Vision</p>
                
                <div className="mt-3 flex items-center justify-center gap-2 opacity-60">
                     <MapPin size={10} className="text-gray-600" />
                     <span className="text-[10px] text-gray-600 font-medium">Masdar City, Abu Dhabi</span>
                </div>

                <div className="mt-4 flex justify-center gap-2">
                    <span className="text-[9px] bg-white/50 px-3 py-1 rounded-full text-gray-500 border border-black/5 font-mono">ID: 2024001</span>
                </div>
            </div>
            
            {/* Quick Action Overlay on Hover */}
            <div className={`absolute top-4 right-4 opacity-0 ${!props.isEditable ? 'group-hover:opacity-100' : ''} transition-opacity`}>
                <Settings size={16} className="text-gray-400 hover:text-gray-700 cursor-pointer" />
            </div>
       </div>
    </WidgetContainer>
  );
};