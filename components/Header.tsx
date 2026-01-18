import React from 'react';
import { Grip, Bell, Search, LayoutGrid, Check } from 'lucide-react';

interface HeaderProps {
    isEditable?: boolean;
    onToggleEdit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isEditable, onToggleEdit }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-black/20 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-white/10">
      <div className="flex items-center gap-4">
        <div className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
            <span className="text-xl">☁️</span> MBZUAI Cloud
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm text-white/80 font-medium ml-4">
            <a href="#" className="hover:text-white transition-colors">Courses</a>
            <a href="#" className="hover:text-white transition-colors">Research</a>
            <a href="#" className="hover:text-white transition-colors">Library</a>
            <a href="#" className="hover:text-white transition-colors">Career</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
         <div className="relative hidden md:block">
            <Search className="absolute left-2 top-1.5 text-white/50" size={14} />
            <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-white/10 border border-white/20 rounded-md py-1 pl-8 pr-3 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20 w-64"
            />
         </div>
         
         <button 
            onClick={onToggleEdit}
            className={`
                flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all
                ${isEditable ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}
            `}
         >
            {isEditable ? <Check size={14} /> : <LayoutGrid size={14} />}
            {isEditable ? 'Done' : 'Customize'}
         </button>

         <button className="text-white/80 hover:text-white">
            <Bell size={20} />
         </button>
         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 p-0.5">
             <img src="https://picsum.photos/200/200" alt="Avatar" className="w-full h-full rounded-full object-cover" />
         </div>
      </div>
    </header>
  );
};