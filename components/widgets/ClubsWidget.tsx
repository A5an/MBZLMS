import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { Users } from 'lucide-react';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const ClubsWidget: React.FC<WidgetProps> = (props) => {
    
  return (
    <WidgetContainer 
        title="Clubs"
        subtitle="Community"
        icon={<Users size={18} />}
        {...props}
    >
        <div className="flex gap-3 h-full items-center overflow-x-auto no-scrollbar pb-1 px-1">
            {[
                { name: 'Robotics', img: 'https://picsum.photos/id/1/100/100' },
                { name: 'Chess', img: 'https://picsum.photos/id/2/100/100' },
                { name: 'Debate', img: 'https://picsum.photos/id/3/100/100' },
                { name: 'Hackathon', img: 'https://picsum.photos/id/4/100/100' },
                { name: 'Sports', img: 'https://picsum.photos/id/5/100/100' },
                { name: 'Music', img: 'https://picsum.photos/id/6/100/100' },
                { name: 'Arts', img: 'https://picsum.photos/id/7/100/100' },
                { name: 'Coding', img: 'https://picsum.photos/id/8/100/100' },
            ].map((club, idx) => (
                <div key={idx} className="relative group flex-shrink-0 w-14 h-14 overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                    <img src={club.img} alt={club.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-[8px] font-bold tracking-wide">{club.name}</span>
                    </div>
                </div>
            ))}
             <div className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 hover:text-blue-400 transition-colors bg-white/30">
                <span className="text-[9px] font-medium">All</span>
            </div>
        </div>
    </WidgetContainer>
  );
};