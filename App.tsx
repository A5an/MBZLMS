import React, { useMemo, useState } from 'react';
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

const Responsive = ReactGridLayout.Responsive;
const WidthProvider = ReactGridLayout.WidthProvider;

const ResponsiveGridLayout = WidthProvider(Responsive);

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

  const toggleEdit = () => setIsEditable(!isEditable);
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date()),
    []
  );

  const openGraphFromHeader = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('open-knowledge-graph'));
  };

  // Common props for widgets to support RGL
  const widgetProps = { isEditable };

  return (
    <div 
        className="min-h-screen w-full overflow-x-hidden selection:bg-blue-200"
        style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
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

        <footer className="mt-10 mb-10 text-center text-white/40 text-[10px] font-medium tracking-widest uppercase">
            <p>MBZUAI Cloud Campus • AI OS v2.0</p>
        </footer>

      </main>
    </div>
  );
}

export default App;
