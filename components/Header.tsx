import React from 'react';
import { ArrowLeft, Bell, Check, LayoutGrid, Moon, Network, Search, Sun } from 'lucide-react';
import { useTheme } from './theme';

interface HeaderProps {
  isEditable?: boolean;
  onToggleEdit?: () => void;
  mode?: 'home' | 'graph';
  onNavigateHome?: () => void;
  onNavigateGraph?: () => void;
  dateLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isEditable,
  onToggleEdit,
  mode = 'home',
  onNavigateHome,
  onNavigateGraph,
  dateLabel
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const isGraph = mode === 'graph';
  const showGraphToggle = Boolean(onNavigateHome || onNavigateGraph);
  const showEditToggle = Boolean(onToggleEdit);

  return (
    <header className={`fixed top-0 left-0 right-0 h-12 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white/80 border-slate-200/60 text-slate-900'}`}>
      <div className="flex items-center gap-4">
        <div className={`font-bold text-lg tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-xl">☁️</span> MBZUAI Cloud
        </div>
        <nav className={`hidden md:flex items-center gap-4 text-sm font-medium ml-4 ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            <a href="#" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Courses</a>
            <a href="#" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Research</a>
            <a href="#" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Library</a>
            <a href="#" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Career</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
         {showGraphToggle && (
            <button
              type="button"
              onClick={isGraph ? onNavigateHome : onNavigateGraph}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  : 'bg-slate-100/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {isGraph ? <ArrowLeft size={14} /> : <Network size={14} />}
              {isGraph ? 'Home' : 'Graph'}
            </button>
         )}
         <div className="relative hidden md:block">
            <Search className={`absolute left-2 top-1.5 ${isDark ? 'text-white/50' : 'text-slate-400'}`} size={14} />
            <input 
                type="text" 
                placeholder="Search resources..." 
                className={`rounded-md py-1 pl-8 pr-3 text-sm focus:outline-none w-64 ${
                  isDark
                    ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/20'
                    : 'bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:bg-slate-50'
                }`}
            />
         </div>

         {dateLabel && (
           <div className={`flex flex-col items-end rounded-xl px-3 py-1 ${isDark ? 'bg-white/10 border border-white/15' : 'bg-white border border-slate-200/70'}`}>
             <span className={`text-[9px] uppercase tracking-[0.3em] ${isDark ? 'text-white/50' : 'text-slate-400'}`}>Today</span>
             <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dateLabel}</span>
           </div>
         )}

         <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isDark
                ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                : 'bg-slate-100/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200/60'
            }`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? 'Light' : 'Dark'}
          </button>

         {showEditToggle && (
           <button
              onClick={onToggleEdit}
              className={`
                  flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all
                  ${isEditable ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : isDark ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white' : 'bg-slate-100/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200/60'}
              `}
           >
              {isEditable ? <Check size={14} /> : <LayoutGrid size={14} />}
              {isEditable ? 'Done' : 'Customize'}
           </button>
         )}

         <button className={`${isDark ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <Bell size={20} />
         </button>
         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 p-0.5">
             <img src="https://picsum.photos/200/200" alt="Avatar" className="w-full h-full rounded-full object-cover" />
         </div>
      </div>
    </header>
  );
};
