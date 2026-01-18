import React from 'react';
import { WidgetContainer } from '../WidgetContainer';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const CalendarWidget: React.FC<WidgetProps> = (props) => {

  const events = [
    { id: 1, title: 'Advanced ML Lecture', time: '10:00', loc: 'Rm 302', duration: '1h 30m', color: 'bg-red-500', text: 'text-red-500' },
    { id: 2, title: 'Lunch w/ Supervisor', time: '12:30', loc: 'Cafeteria', duration: '45m', color: 'bg-green-500', text: 'text-green-500' },
    { id: 3, title: 'Robotics Club', time: '14:00', loc: 'Main Hall', duration: '2h', color: 'bg-orange-400', text: 'text-orange-500' },
    { id: 4, title: 'Study Group', time: '17:00', loc: 'Library', duration: '1h', color: 'bg-blue-400', text: 'text-blue-500' },
    { id: 5, title: 'Guest Speaker: AI Ethics', time: '19:00', loc: 'Auditorium', duration: '1h', color: 'bg-purple-500', text: 'text-purple-500' },
    { id: 6, title: 'Gym Session', time: '20:30', loc: 'Rec Center', duration: '1h', color: 'bg-gray-500', text: 'text-gray-600' },
  ];

  return (
    <WidgetContainer 
        className="h-full"
        title="Calendar"
        subtitle="Mon, Dec 12"
        icon={<Calendar size={18} />}
        {...props}
    >
      <div className="h-full flex flex-col relative overflow-y-auto no-scrollbar pb-2">
        {/* Timeline Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gray-200/50 rounded-full h-full"></div>

        {events.map((evt, idx) => (
            <div key={evt.id} className={`relative pl-8 ${idx !== events.length - 1 ? 'pb-4' : ''} group`}>
                <div className={`absolute left-[15px] top-3.5 w-2.5 h-2.5 ${evt.color} rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125`}></div>
                <div className="bg-white/50 p-3 rounded-xl border border-white/50 group-hover:bg-white group-hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                        <h4 className="text-[12px] font-semibold text-gray-900 leading-tight">{evt.title}</h4>
                        <span className={`text-[10px] ${evt.text} font-bold bg-white/50 px-1.5 py-0.5 rounded-md`}>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-gray-500">
                        <div className="flex items-center gap-1">
                            <MapPin size={10} />
                            <span className="text-[10px] font-medium">{evt.loc}</span>
                        </div>
                        {evt.duration && (
                            <div className="flex items-center gap-1 opacity-70">
                                <Clock size={10} />
                                <span className="text-[10px]">{evt.duration}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </WidgetContainer>
  );
};