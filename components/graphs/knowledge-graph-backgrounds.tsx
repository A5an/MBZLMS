import React, { useEffect, useRef } from 'react';
import { ObsidianVariant } from './knowledge-graph-types';

type BackdropTone = 'light' | 'dark';

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16)
  };
};

export const DotGridLayer: React.FC<{
  tone?: BackdropTone;
  returnSpeed?: number;
  dotSize?: number;
  dotSpacing?: number;
  proximity?: number;
  displaceStrength?: number;
  damping?: number;
  baseColor?: string;
  activeColor?: string;
  baseOpacity?: number;
  activeOpacity?: number;
}> = ({
  tone = 'light',
  returnSpeed = 0.5,
  dotSize = 1.9,
  dotSpacing = 28,
  proximity = 120,
  displaceStrength = 0.5,
  damping = 0.75,
  baseColor = '#271E37',
  activeColor = '#5227FF',
  baseOpacity = 0.7,
  activeOpacity = 0.38
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isLight = tone === 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const DOT_SPACING = dotSpacing;
    const DOT_SIZE = dotSize;
    const MOUSE_RADIUS = proximity;
    const RETURN_SPEED = returnSpeed;
    const DISPLACE_STRENGTH = displaceStrength;
    const BASE_RGB = hexToRgb(baseColor);
    const ACTIVE_RGB = hexToRgb(activeColor);
    const BASE_COLOR = `rgba(${BASE_RGB.r}, ${BASE_RGB.g}, ${BASE_RGB.b}, ${baseOpacity})`;
    const ACTIVE_COLOR = `rgba(${ACTIVE_RGB.r}, ${ACTIVE_RGB.g}, ${ACTIVE_RGB.b}, ${activeOpacity})`;

    let dots: Array<{ x: number; y: number; ox: number; oy: number; vx: number; vy: number }> = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      initDots();
    };

    const initDots = () => {
      dots = [];
      const cols = Math.ceil(canvas.width / DOT_SPACING);
      const rows = Math.ceil(canvas.height / DOT_SPACING);
      const startX = (canvas.width % DOT_SPACING) / 2;
      const startY = (canvas.height % DOT_SPACING) / 2;

      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          const x = startX + i * DOT_SPACING;
          const y = startY + j * DOT_SPACING;
          dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        const dx = mouseRef.current.x - dot.x;
        const dy = mouseRef.current.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * force * -1 * (DISPLACE_STRENGTH * 10);
          const moveY = Math.sin(angle) * force * -1 * (DISPLACE_STRENGTH * 10);
          dot.vx += moveX;
          dot.vy += moveY;
        }

        dot.x += (dot.ox - dot.x) * RETURN_SPEED;
        dot.y += (dot.oy - dot.y) * RETURN_SPEED;
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.vx *= damping;
        dot.vy *= damping;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_SIZE, 0, Math.PI * 2);

        const distFromOrigin = Math.sqrt((dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2);
        if (distFromOrigin > 1) {
          ctx.fillStyle = ACTIVE_COLOR;
        } else {
          ctx.fillStyle = BASE_COLOR;
        }
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    resize();
    animate();

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [
    isLight,
    returnSpeed,
    dotSize,
    dotSpacing,
    proximity,
    displaceStrength,
    damping,
    baseColor,
    activeColor,
    baseOpacity,
    activeOpacity
  ]);

  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${
        isLight ? 'bg-gradient-to-br from-white via-slate-50 to-slate-200' : 'bg-[#050505]'
      }`}
    >
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: isLight
            ? `
              linear-gradient(to right, rgba(15,23,42,0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15,23,42,0.15) 1px, transparent 1px)
            `
            : `
              linear-gradient(to right, #333 1px, transparent 1px),
              linear-gradient(to bottom, #333 1px, transparent 1px)
            `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)'
        }}
      />

      <div
        className={`absolute inset-0 z-0 pointer-events-none ${
          isLight ? 'opacity-[0.05] mix-blend-soft-light' : 'opacity-[0.03] mix-blend-overlay'
        }`}
        style={{
          backgroundImage: isLight
            ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.55\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
        }}
      />

      <canvas ref={canvasRef} className="w-full h-full relative z-10" />

      <div
        className={`absolute inset-0 opacity-80 z-20 ${
          isLight
            ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.0)_0%,rgba(148,163,184,0.25)_80%)]'
            : 'bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]'
        }`}
      />
    </div>
  );
};

export const ObsidianBackdrop: React.FC<{ variant: ObsidianVariant; tone?: BackdropTone }> = ({
  variant,
  tone = 'dark'
}) => {
  const isLight = tone === 'light';
  const noiseOpacity = isLight ? (variant === 'obsidian-v3' ? 0.04 : variant === 'obsidian-v2' ? 0.05 : 0.06) : (variant === 'obsidian-v3' ? 0.05 : variant === 'obsidian-v2' ? 0.07 : 0.08);
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isLight ? 'bg-gradient-to-br from-white via-slate-50 to-slate-200' : 'bg-[#141414]'}`}>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(circle at 45% 35%, rgba(59,130,246,0.08), transparent 55%)'
            : 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 55%)'
        }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          opacity: noiseOpacity,
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${isLight ? '0.6' : '0.8'}' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <div className={`absolute inset-0 ${isLight ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.0)_0%,rgba(148,163,184,0.22)_80%)]' : 'bg-[radial-gradient(circle_at_center,transparent_0%,#141414_80%)]'} opacity-80`} />
    </div>
  );
};
