import React, { useEffect, useMemo, useState } from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { Header } from './components/Header';
import { ProfileWidget } from './components/widgets/ProfileWidget';
import { AssignmentsWidget } from './components/widgets/AssignmentsWidget';
import { KnowledgeGraphWidget } from './components/widgets/KnowledgeGraphWidget';
import { CalendarWidget } from './components/widgets/CalendarWidget';
import { NotesWidget } from './components/widgets/NotesWidget';
import { GradesWidget } from './components/widgets/GradesWidget';
import { CoursesWidget } from './components/widgets/CoursesWidget';
import { ClubsWidget } from './components/widgets/ClubsWidget';
import { BriefWidget } from './components/widgets/BriefWidget';
import { ThemeContext, ThemeMode } from './components/theme';

const Responsive = ReactGridLayout.Responsive;
const WidthProvider = ReactGridLayout.WidthProvider;

const ResponsiveGridLayout = WidthProvider(Responsive);

type MobileTone = 'dark' | 'black';

// Increased Grid Resolution for smoother dragging
// rowHeight = 100 (approx half of previous). 
// All 'h' and 'y' values are doubled compared to the previous version.
const initialLayouts = {
  lg: [
    { i: 'profile', x: 0, y: 0, w: 1, h: 2 },
    { i: 'notes', x: 1, y: 0, w: 2, h: 2 },
    { i: 'assignments', x: 0, y: 2, w: 2, h: 4 }, 
    { i: 'calendar', x: 2, y: 2, w: 1, h: 4 },    
    { i: 'grades', x: 0, y: 6, w: 1, h: 2 },
    { i: 'kg', x: 1, y: 6, w: 2, h: 4 },
    { i: 'courses', x: 0, y: 8, w: 1, h: 2 },
    { i: 'brief', x: 0, y: 10, w: 2, h: 2 },
    { i: 'clubs', x: 0, y: 12, w: 3, h: 2 },
  ],
  md: [
    { i: 'profile', x: 0, y: 0, w: 1, h: 2 },
    { i: 'notes', x: 1, y: 0, w: 1, h: 2 },
    { i: 'assignments', x: 0, y: 2, w: 2, h: 4 },
    { i: 'calendar', x: 0, y: 6, w: 1, h: 4 },
    { i: 'grades', x: 1, y: 6, w: 1, h: 2 },
    { i: 'kg', x: 0, y: 8, w: 2, h: 4 },
    { i: 'courses', x: 0, y: 12, w: 1, h: 2 },
    { i: 'brief', x: 1, y: 12, w: 1, h: 2 },
    { i: 'clubs', x: 0, y: 14, w: 2, h: 2 },
  ],
  sm: [
    { i: 'profile', x: 0, y: 0, w: 1, h: 2 },
    { i: 'notes', x: 0, y: 2, w: 1, h: 2 },
    { i: 'assignments', x: 0, y: 4, w: 1, h: 4 },
    { i: 'calendar', x: 0, y: 8, w: 1, h: 4 },
    { i: 'grades', x: 0, y: 12, w: 1, h: 2 },
    { i: 'kg', x: 0, y: 14, w: 1, h: 4 },
    { i: 'courses', x: 0, y: 18, w: 1, h: 2 },
    { i: 'brief', x: 0, y: 20, w: 1, h: 2 },
    { i: 'clubs', x: 0, y: 22, w: 1, h: 2 },
  ]
};

function App() {
  const [isEditable, setIsEditable] = useState(false);
  const [layouts, setLayouts] = useState(initialLayouts);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('mbzuai-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [isMobileAcknowledged, setIsMobileAcknowledged] = useState(false);
  const [mobileTone, setMobileTone] = useState<MobileTone>(() => {
    if (typeof window === 'undefined') return 'dark';
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    if (prefersDark) return 'dark';
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6 ? 'dark' : 'black';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMatch = () => setIsMobile(mediaQuery.matches);
    updateMatch();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    } else {
      mediaQuery.addListener(updateMatch);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      } else {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const resolveTone = () => {
      const prefersDark = mediaQuery.matches;
      if (prefersDark) {
        setMobileTone('dark');
        return;
      }
      const hour = new Date().getHours();
      setMobileTone(hour >= 18 || hour < 6 ? 'dark' : 'black');
    };
    resolveTone();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', resolveTone);
    } else {
      mediaQuery.addListener(resolveTone);
    }
    const intervalId = window.setInterval(resolveTone, 15 * 60 * 1000);
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', resolveTone);
      } else {
        mediaQuery.removeListener(resolveTone);
      }
      window.clearInterval(intervalId);
    };
  }, []);

  const toggleEdit = () => setIsEditable(!isEditable);
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date()),
    []
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mbzuai-theme', theme);
    }
  }, [theme]);

  const openGraphFromHeader = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('open-knowledge-graph'));
  };

  const isDark = theme === 'dark';
  const backgroundStyle = isDark
    ? {
        backgroundImage:
          'radial-gradient(circle at 18% 16%, rgba(255,255,255,0.06), transparent 45%), radial-gradient(circle at 80% 10%, rgba(59,130,246,0.12), transparent 55%), linear-gradient(135deg, #050505, #0b0b10)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }
    : {
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.96), rgba(226,232,240,0.92)), linear-gradient(135deg, #f8fafc, #e2e8f0)',
        backgroundSize: '24px 24px, cover, cover',
        backgroundPosition: '0 0, center, center',
        backgroundAttachment: 'fixed'
      };

  const themeContextValue = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme]
  );

  if (isMobile) {
    const isMobileDark = mobileTone === 'dark';
    const mobileBackgroundStyle = isMobileDark
      ? {
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.16), transparent 55%), radial-gradient(circle at 70% 10%, rgba(14,116,144,0.12), transparent 60%), linear-gradient(180deg, #0a0a0a, #050505)'
        }
      : {
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(148,163,184,0.18), transparent 60%), linear-gradient(180deg, #000000, #0b0b0f)'
        };
    return (
      <ThemeContext.Provider value={themeContextValue}>
        <div
          className={`min-h-screen w-full flex items-center justify-center px-6 ${isMobileDark ? 'text-white' : 'text-white'}`}
          style={mobileBackgroundStyle}
        >
          {isMobileAcknowledged ? (
            <div className="text-lg font-semibold">Cool</div>
          ) : (
            <div className="max-w-sm text-center space-y-4">
              <div className={`text-[10px] uppercase tracking-[0.3em] ${isMobileDark ? 'text-white/40' : 'text-white/60'}`}>Heads up</div>
              <h1 className="text-xl font-semibold">This experience needs a bigger screen.</h1>
              <p className={`text-xs ${isMobileDark ? 'text-white/60' : 'text-white/70'}`}>
                The LMS demo is not optimized for phones yet. Please open it on a laptop or desktop.
              </p>
              <button
                type="button"
                onClick={() => setIsMobileAcknowledged(true)}
                className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                  isMobileDark
                    ? 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                    : 'bg-white/10 text-white/90 border border-white/30 hover:bg-white/20'
                }`}
              >
                Okay, I will try on big screen
              </button>
            </div>
          )}
        </div>
      </ThemeContext.Provider>
    );
  }

  // Common props for widgets to support RGL
  const widgetProps = { isEditable };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div 
          className={`min-h-screen w-full overflow-x-hidden ${isDark ? 'text-white selection:bg-blue-500/30' : 'text-slate-900 selection:bg-blue-200'}`}
          style={backgroundStyle}
      >
        <Header
          isEditable={isEditable}
          onToggleEdit={toggleEdit}
          mode="home"
          dateLabel={todayLabel}
          onNavigateGraph={openGraphFromHeader}
        />
        
        {/* Main Container */}
        <main className="pt-28 pb-20 px-4 md:px-6 mx-auto w-full max-w-[1200px] lg:max-w-[1100px] xl:max-w-[1200px] 2xl:max-w-[1400px] transition-all duration-500">
          
          <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1024, md: 768, sm: 0 }}
              cols={{ lg: 3, md: 2, sm: 1 }}
              rowHeight={100} // Reduced for finer control (was 210)
              margin={[24, 24]}
              isDraggable={isEditable}
              isResizable={isEditable}
              onLayoutChange={(currentLayout, allLayouts) => setLayouts(allLayouts)}
              compactType="vertical"
              preventCollision={false}
          >
              
              <div key="profile"><ProfileWidget {...widgetProps} /></div>
              <div key="notes"><NotesWidget {...widgetProps} /></div>
              <div key="assignments"><AssignmentsWidget {...widgetProps} /></div>
              <div key="calendar"><CalendarWidget {...widgetProps} /></div>
              <div key="grades"><GradesWidget {...widgetProps} /></div>
              <div key="kg"><KnowledgeGraphWidget {...widgetProps} /></div>
              <div key="courses"><CoursesWidget {...widgetProps} /></div>
              <div key="brief"><BriefWidget {...widgetProps} /></div>
              <div key="clubs"><ClubsWidget {...widgetProps} /></div>

          </ResponsiveGridLayout>

          <footer className={`mt-10 mb-10 text-center text-[10px] font-medium tracking-widest uppercase ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              <p>MBZUAI Cloud Campus • AI OS v2.0</p>
          </footer>

        </main>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
