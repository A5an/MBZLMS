import React, { ReactNode, forwardRef } from 'react';

interface WidgetProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  onHeaderClick?: React.MouseEventHandler<HTMLDivElement>;
  noPadding?: boolean;
  // Props passed by React Grid Layout
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  isEditable?: boolean; 
}

export const WidgetContainer = forwardRef<HTMLDivElement, WidgetProps>(({ 
  children, 
  className = '', 
  style,
  title, 
  subtitle,
  icon, 
  headerAction,
  onHeaderClick,
  noPadding = false,
  onMouseDown,
  onMouseUp,
  onTouchEnd,
  isEditable = false,
  ...props
}, ref) => {
  return (
    <div 
      ref={ref}
      style={style}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      className={`
      relative
      bg-white/60 backdrop-blur-3xl 
      rounded-[2rem] 
      shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]
      flex flex-col 
      ${!isEditable ? 'hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3)] hover:scale-[1.01] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}
      group
      overflow-hidden
      ${className}
    `}
      {...props}
    >
      {/* 3D Lighting / Border Effect */}
      <div className="absolute inset-0 rounded-[2rem] border border-white/50 pointer-events-none z-30"></div>
      
      {/* --- Section 1: Header --- */}
      {(title || icon) && (
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-white/40 transition-colors duration-300 cursor-pointer relative z-20 min-h-[60px] widget-header shrink-0 ${onHeaderClick ? 'hover:bg-white/60' : ''}`}
          onClick={onHeaderClick}
          onKeyDown={(event) => {
            if (!onHeaderClick) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onHeaderClick(event as unknown as React.MouseEvent<HTMLDivElement>);
            }
          }}
          role={onHeaderClick ? 'button' : undefined}
          tabIndex={onHeaderClick ? 0 : undefined}
        >
          <div className="flex items-center gap-3">
            {icon && (
                <div className="shrink-0 text-gray-700 bg-white/50 p-1.5 rounded-lg shadow-sm">
                    {icon}
                </div>
            )}
            <div className="flex flex-col justify-center">
                {title && <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-snug">{title}</h2>}
                {subtitle && <p className="text-[10px] font-medium text-gray-500 leading-none mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div className="text-blue-600" onMouseDown={(e) => e.stopPropagation()}>{headerAction}</div>}
        </div>
      )}

      {/* --- Section 2: Content --- */}
      <div className="flex-1 p-1.5 relative z-10 overflow-hidden flex flex-col min-h-0">
          <div className={`
            flex-1 
            ${noPadding ? '' : 'p-4'} 
            bg-white/40 
            rounded-[1.5rem]
            overflow-hidden
            transition-colors duration-300
            h-full
            flex flex-col
            min-h-0
          `}>
            {children}
          </div>
      </div>
    </div>
  );
});

WidgetContainer.displayName = 'WidgetContainer';
