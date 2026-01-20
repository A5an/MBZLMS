import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ArrowLeft, ChevronDown, ChevronRight, Focus, Info, Network, RotateCcw, Settings } from 'lucide-react';
import { FluidGlassLens } from '../FluidGlass';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  val: number;
  type: string;
  floatPhase: number;
  floatSpeed: number;
  visualY?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

const GRAPH_COLORS = ['#FF3B30', '#30D158', '#0A84FF', '#BF5AF2', '#FF9F0A', '#64D2FF'];
const OBSIDIAN_ACCENT = '#3DDC84';

type ObsidianVariant = 'obsidian-v1' | 'obsidian-v2' | 'obsidian-v3';
type RenderMode =
  | 'gemini-v1-svg'
  | 'gemini-v1-webgl'
  | 'obsidian-v1-svg'
  | 'obsidian-v2-svg'
  | 'obsidian-v3-svg';

const RENDER_OPTIONS: Array<{
  id: RenderMode;
  label: string;
  tag: string;
  description: string;
  detail: string;
}> = [
  {
    id: 'gemini-v1-svg',
    label: 'Gemini V1',
    tag: 'SVG',
    description: 'Original Gemini graph',
    detail: 'Full labels, colored clusters, soft glow nodes.'
  },
  {
    id: 'gemini-v1-webgl',
    label: 'Gemini V1 (webgl)',
    tag: 'WEBGL',
    description: 'Lens refraction render',
    detail: 'WebGL refraction with the fluid glass lens.'
  },
  {
    id: 'obsidian-v1-svg',
    label: 'Obsidian V1',
    tag: 'SVG',
    description: 'Muted mono layout',
    detail: 'Single-color dots, strict highlight on hover.'
  },
  {
    id: 'obsidian-v2-svg',
    label: 'Obsidian V2',
    tag: 'SVG',
    description: 'Accent highlight layout',
    detail: 'Green accents and neighbor label hints.'
  },
  {
    id: 'obsidian-v3-svg',
    label: 'Obsidian V3',
    tag: 'SVG',
    description: 'Sparse layout',
    detail: 'Softer links, minimal labels, calmer density.'
  }
];

const getObsidianStyle = (variant: ObsidianVariant) => {
  const base = {
    accent: OBSIDIAN_ACCENT,
    nodeFill: '#CFCFCF',
    nodeDimOpacity: 0.25,
    linkBase: 'rgba(255,255,255,0.16)',
    linkDim: 'rgba(255,255,255,0.04)',
    linkWidth: 0.8,
    linkHoverWidth: 1.4,
    nodeRadiusBase: 2.2,
    nodeRadiusStep: 0.16,
    labelOpacity: 0.9,
    showNeighborLabels: false,
    showAccentRings: false
  };

  if (variant === 'obsidian-v2') {
    return {
      ...base,
      linkBase: 'rgba(255,255,255,0.18)',
      linkDim: 'rgba(255,255,255,0.05)',
      linkHoverWidth: 1.6,
      showNeighborLabels: true,
      showAccentRings: true
    };
  }

  if (variant === 'obsidian-v3') {
    return {
      ...base,
      nodeFill: '#BDBDBD',
      nodeDimOpacity: 0.18,
      linkBase: 'rgba(255,255,255,0.08)',
      linkDim: 'rgba(255,255,255,0.02)',
      linkWidth: 0.6,
      linkHoverWidth: 1.2,
      nodeRadiusBase: 2.0,
      nodeRadiusStep: 0.12,
      labelOpacity: 0.75
    };
  }

  return base;
};

const getObsidianVariantFromMode = (mode: RenderMode): ObsidianVariant | null => {
  if (!mode.startsWith('obsidian-')) return null;
  if (mode.includes('v1')) return 'obsidian-v1';
  if (mode.includes('v2')) return 'obsidian-v2';
  return 'obsidian-v3';
};

const DotGridLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const DOT_SPACING = 40;
    const DOT_SIZE = 1.5;
    const MOUSE_RADIUS = 120;
    const RETURN_SPEED = 0.05;
    const DISPLACE_STRENGTH = 0.15;

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
        dot.vx *= 0.9;
        dot.vy *= 0.9;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_SIZE, 0, Math.PI * 2);

        const distFromOrigin = Math.sqrt((dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2);
        if (distFromOrigin > 1) {
          ctx.fillStyle = `rgba(82, 39, 255, ${Math.min(distFromOrigin / 15, 0.5)})`;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
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
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    animate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none bg-[#050505] overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #333 1px, transparent 1px),
            linear-gradient(to bottom, #333 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)'
        }}
      />

      <div
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
        }}
      />

      <canvas ref={canvasRef} className="w-full h-full relative z-10" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)] opacity-80 z-20" />
    </div>
  );
};

const ObsidianBackdrop: React.FC<{ variant: ObsidianVariant }> = ({ variant }) => {
  const noiseOpacity = variant === 'obsidian-sparse' ? 0.05 : variant === 'obsidian-accent' ? 0.07 : 0.08;
  return (
    <div className="absolute inset-0 z-0 pointer-events-none bg-[#141414] overflow-hidden">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 55%)'
        }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          opacity: noiseOpacity,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#141414_80%)] opacity-80" />
    </div>
  );
};

const createGraphData = () => {
  const enrich = (node: Omit<GraphNode, 'floatPhase' | 'floatSpeed'>): GraphNode => ({
    ...node,
    floatPhase: Math.random() * Math.PI * 2,
    floatSpeed: 0.5 + Math.random() * 0.5
  });

  const baseNodes = [
    { id: 'CompSci Major', type: 'hub', group: 1, val: 30 },
    { id: 'Web Development', type: 'course', group: 1, val: 15 },
    { id: 'React Frameworks', type: 'concept', group: 1, val: 5 },
    { id: 'Backend Systems', type: 'concept', group: 1, val: 5 },
    { id: 'Cloud Computing', type: 'course', group: 1, val: 12 },
    { id: 'Cybersecurity', type: 'course', group: 1, val: 12 },
    { id: 'Software Engineering', type: 'course', group: 1, val: 12 },
    { id: 'Databases', type: 'course', group: 1, val: 12 },
    { id: 'Applied Math', type: 'hub', group: 2, val: 30 },
    { id: 'Calculus', type: 'course', group: 2, val: 15 },
    { id: 'Linear Algebra', type: 'course', group: 2, val: 15 },
    { id: 'Statistics', type: 'course', group: 2, val: 14 },
    { id: 'Probability', type: 'course', group: 2, val: 12 },
    { id: 'Optimization', type: 'course', group: 2, val: 12 },
    { id: 'AI Specialization', type: 'hub', group: 3, val: 35 },
    { id: 'Intro to AI', type: 'course', group: 3, val: 15 },
    { id: 'Machine Learning', type: 'course', group: 3, val: 18 },
    { id: 'Computer Vision', type: 'course', group: 3, val: 14 },
    { id: 'NLP', type: 'course', group: 3, val: 15 },
    { id: 'Deep Learning', type: 'course', group: 3, val: 16 },
    { id: 'Generative AI', type: 'course', group: 3, val: 12 },
    { id: 'Business Minor', type: 'hub', group: 4, val: 25 },
    { id: 'Entrepreneurship', type: 'course', group: 4, val: 12 },
    { id: 'Economics', type: 'course', group: 4, val: 10 },
    { id: 'AI Ethics', type: 'course', group: 4, val: 14 },
    { id: 'Product Strategy', type: 'course', group: 4, val: 11 },
    { id: 'Finance', type: 'course', group: 4, val: 10 }
  ].map(enrich);

  const extraConcepts = [
    { id: 'Data Structures', group: 1 },
    { id: 'Algorithms', group: 1 },
    { id: 'Microservices', group: 1 },
    { id: 'Docker & K8s', group: 1 },
    { id: 'Cryptography', group: 1 },
    { id: 'Network Security', group: 1 },
    { id: 'API Design', group: 1 },
    { id: 'System Design', group: 1 },
    { id: 'DevOps', group: 1 },
    { id: 'Gradient Descent', group: 2 },
    { id: 'Matrices', group: 2 },
    { id: 'Bayesian Theorem', group: 2 },
    { id: 'Numerical Methods', group: 2 },
    { id: 'Stochastic Processes', group: 2 },
    { id: 'Neural Networks', group: 3 },
    { id: 'Loss Optimization', group: 3 },
    { id: 'Transformers', group: 3 },
    { id: 'LLMs', group: 3 },
    { id: 'Robotics', group: 3 },
    { id: 'Reinforcement Learning', group: 3 },
    { id: 'Foundation Models', group: 3 },
    { id: 'Edge AI', group: 3 },
    { id: 'Bias & Fairness', group: 4 },
    { id: 'Tech Policy', group: 4 },
    { id: 'Market Analysis', group: 4 },
    { id: 'Venture Capital', group: 4 },
    { id: 'Market Research', group: 4 }
  ].map((node) => enrich({ ...node, type: 'concept', val: 4 }));

  const nodes = [...baseNodes, ...extraConcepts];

  const links: GraphLink[] = [
    { source: 'CompSci Major', target: 'Web Development' },
    { source: 'Web Development', target: 'React Frameworks' },
    { source: 'Web Development', target: 'Backend Systems' },
    { source: 'CompSci Major', target: 'Cloud Computing' },
    { source: 'CompSci Major', target: 'Cybersecurity' },
    { source: 'CompSci Major', target: 'Software Engineering' },
    { source: 'CompSci Major', target: 'Databases' },
    { source: 'Databases', target: 'Data Structures' },
    { source: 'Applied Math', target: 'Calculus' },
    { source: 'Applied Math', target: 'Linear Algebra' },
    { source: 'Applied Math', target: 'Statistics' },
    { source: 'Applied Math', target: 'Probability' },
    { source: 'Applied Math', target: 'Optimization' },
    { source: 'Calculus', target: 'Gradient Descent' },
    { source: 'Linear Algebra', target: 'Matrices' },
    { source: 'Statistics', target: 'Bayesian Theorem' },
    { source: 'AI Specialization', target: 'Intro to AI' },
    { source: 'AI Specialization', target: 'Machine Learning' },
    { source: 'Machine Learning', target: 'Neural Networks' },
    { source: 'Machine Learning', target: 'Loss Optimization' },
    { source: 'AI Specialization', target: 'Computer Vision' },
    { source: 'AI Specialization', target: 'NLP' },
    { source: 'AI Specialization', target: 'Deep Learning' },
    { source: 'AI Specialization', target: 'Generative AI' },
    { source: 'Deep Learning', target: 'Generative AI' },
    { source: 'NLP', target: 'Transformers' },
    { source: 'NLP', target: 'LLMs' },
    { source: 'Business Minor', target: 'Entrepreneurship' },
    { source: 'Entrepreneurship', target: 'Economics' },
    { source: 'Business Minor', target: 'AI Ethics' },
    { source: 'Business Minor', target: 'Product Strategy' },
    { source: 'Business Minor', target: 'Finance' },
    { source: 'AI Ethics', target: 'Bias & Fairness' },
    { source: 'AI Ethics', target: 'Tech Policy' },
    { source: 'Gradient Descent', target: 'Loss Optimization', label: 'Math Foundation' },
    { source: 'Statistics', target: 'Machine Learning', label: 'Theory' },
    { source: 'LLMs', target: 'Bias & Fairness', label: 'Safety' }
  ];

  extraConcepts.forEach((node) => {
    if (!links.find((link) => link.target === node.id || link.source === node.id)) {
      let target = 'Business Minor';
      if (node.group === 1) target = 'CompSci Major';
      else if (node.group === 2) target = 'Applied Math';
      else if (node.group === 3) target = 'AI Specialization';
      links.push({ source: target, target: node.id });
    }
  });

  return { nodes, links };
};

const GRAPH_DATA = createGraphData();

interface KnowledgeGraphSceneProps {
  className?: string;
  isFullscreen?: boolean;
  onExit?: () => void;
}

export const KnowledgeGraphScene: React.FC<KnowledgeGraphSceneProps> = ({
  className = '',
  isFullscreen = false,
  onExit
}) => {
  const { nodes, links } = GRAPH_DATA;
  const baseScale = isFullscreen ? 0.6 : 0.7;
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('gemini-v1-svg');
  const [isRenderMenuOpen, setIsRenderMenuOpen] = useState(false);
  const [repulsion, setRepulsion] = useState(-1000);
  const [gravity, setGravity] = useState(0.1);
  const [floatIntensity, setFloatIntensity] = useState(5);
  const [labelThreshold, setLabelThreshold] = useState(1.0);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const activeNodeRef = useRef<GraphNode | null>(null);
  const hoveredNodeRef = useRef<GraphNode | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const currentScaleRef = useRef(baseScale);
  const labelThresholdRef = useRef(labelThreshold);
  const floatIntensityRef = useRef(floatIntensity);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const sizeRef = useRef({ width: 0, height: 0 });

  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((node) => map.set(node.id, new Set()));
    links.forEach((link) => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      map.get(source)?.add(target);
      map.get(target)?.add(source);
    });
    return map;
  }, [nodes, links]);

  const nodeDegreeMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((node) => map.set(node.id, 0));
    links.forEach((link) => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      map.set(source, (map.get(source) ?? 0) + 1);
      map.set(target, (map.get(target) ?? 0) + 1);
    });
    return map;
  }, [nodes, links]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const getColor = (group: number) => GRAPH_COLORS[group] || '#8E8E93';
  const isObsidianMode = renderMode.startsWith('obsidian-');
  const isWebglMode = renderMode.endsWith('-webgl');

  const getNodeVisibilityThreshold = (node: GraphNode) => {
    let factor = 1.0;
    if (node.val >= 20) factor = 0.3;
    else if (node.val >= 10) factor = 0.6;
    return labelThresholdRef.current * factor;
  };

  const updateLabels = () => {
    if (!gRef.current) return;
    const labels = gRef.current.selectAll<SVGTextElement, GraphNode>('text');
    const nextOpacity = function (this: SVGTextElement, d: GraphNode) {
      const parent = d3.select(this.parentNode as SVGGElement);
      if (parent.classed('node-hovered') || parent.classed('node-active') || parent.classed('node-related')) return 1;
      if (isObsidianMode) return 0;
      const threshold = getNodeVisibilityThreshold(d);
      return currentScaleRef.current < threshold ? 0 : 0.8;
    };

    if (isObsidianMode) {
      labels.interrupt().style('opacity', nextOpacity);
      return;
    }

    labels
      .transition()
      .duration(200)
      .style('opacity', nextOpacity);
  };

  useEffect(() => {
    activeNodeRef.current = activeNode;
  }, [activeNode]);

  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  useEffect(() => {
    if (activeNode) setHoveredNode(null);
  }, [activeNode]);

  useEffect(() => {
    if (!containerRef.current) return;
    setEventSource(containerRef.current);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setRenderMode('gemini-v1-svg');
      setIsRenderMenuOpen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isWebglMode) {
      gRef.current = null;
      zoomRef.current = null;
    }
  }, [isWebglMode]);

  useEffect(() => {
    labelThresholdRef.current = labelThreshold;
    if (gRef.current) updateLabels();
  }, [labelThreshold]);

  useEffect(() => {
    if (gRef.current) updateLabels();
  }, [renderMode]);

  useEffect(() => {
    floatIntensityRef.current = floatIntensity;
  }, [floatIntensity]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          sizeRef.current = { width, height };
          if (svgRef.current) d3.select(svgRef.current).attr('viewBox', [0, 0, width, height]);
          if (simulationRef.current) {
            simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2));
            simulationRef.current.alpha(0.3).restart();
          }
        }
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isWebglMode) return;
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 420;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    const obsidianVariant = getObsidianVariantFromMode(renderMode);
    const obsidianStyle = obsidianVariant ? getObsidianStyle(obsidianVariant) : null;

    const defs = svg.append('defs');
    if (!isObsidianMode) {
      const shadowFilter = defs.append('filter').attr('id', 'drop-shadow').attr('height', '130%');
      shadowFilter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 2).attr('result', 'blur');
      shadowFilter.append('feOffset').attr('in', 'blur').attr('dx', 1).attr('dy', 2).attr('result', 'offsetBlur');
      const feMerge = shadowFilter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'offsetBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      defs
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 24)
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'rgba(255,255,255,0.3)');

      GRAPH_COLORS.forEach((color, index) => {
        defs
          .append('marker')
          .attr('id', `arrow-colored-${index}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 24)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', color);

        const gradient = defs.append('radialGradient').attr('id', `glow-grad-${index}`).attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.3);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);
      });
    }

    const g = svg.append('g').attr('class', 'graph-container');
    gRef.current = g;

    if (isObsidianMode && obsidianStyle) {
      svg.append('style').text(`
        .graph-container { transition: opacity 0.35s ease; }
        .node-group { transition: opacity 0.25s ease; }
        .node-group.node-dim { opacity: ${obsidianStyle.nodeDimOpacity}; }
        .node-dot { transition: r 0.25s ease, stroke 0.25s ease; }
        .node-ring { transition: stroke 0.25s ease; pointer-events: none; }
        .node-label { transition: opacity 0.2s ease; }
        .visible-link { transition: stroke 0.3s ease, stroke-opacity 0.3s ease, stroke-width 0.3s ease; }
      `);
    } else {
      svg.append('style').text(`
        .graph-container { transition: opacity 0.5s ease; }
        .graph-container.in-focus-mode .node-group:not(.node-active) { opacity: 0.2; filter: blur(3px); transition: opacity 0.5s, filter 0.5s; }
        .graph-container.in-focus-mode .visible-link:not(.link-active) { stroke-opacity: 0.05; transition: stroke-opacity 0.5s; }
        .node-group.node-active, .node-group.node-hovered { opacity: 1; filter: url(#drop-shadow); }
        .visible-link.link-active, .visible-link.link-hovered { stroke-opacity: 1; stroke-width: 2px; }
        .node-glow { transition: r 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .node-core { transition: r 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `);
    }

    const zoomScaleExtent: [number, number] = isFullscreen ? [0.1, 4] : [0.3, 3];
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(zoomScaleExtent)
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        currentScaleRef.current = event.transform.k;
        transformRef.current = event.transform;
        updateLabels();
      });
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
    svg.call(zoom).call(zoom.transform, initialTransform);
    transformRef.current = initialTransform;
    zoomRef.current = zoom;

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(repulsion))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => {
        if (isObsidianMode) {
          const degree = nodeDegreeMap.get(d.id) ?? 1;
          return 6 + Math.min(12, degree) * 0.6;
        }
        return d.val * 2;
      }).iterations(2))
      .force('x', d3.forceX(width / 2).strength(gravity))
      .force('y', d3.forceY(height / 2).strength(gravity));

    simulation.alphaDecay(0.02);
    simulationRef.current = simulation;

    const linkHitArea = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 20)
      .style('cursor', 'pointer')
      .on('click', (event) => {
        event.stopPropagation();
        setActiveNode(null);
      });

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('class', 'visible-link')
      .attr('stroke', isObsidianMode && obsidianStyle ? obsidianStyle.linkBase : 'rgba(255,255,255,0.1)')
      .attr('stroke-width', isObsidianMode && obsidianStyle ? obsidianStyle.linkWidth : 1)
      .attr('stroke-linecap', isObsidianMode ? 'round' : null)
      .attr('marker-end', isObsidianMode ? null : 'url(#arrow)');

    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    const nodeContent = node.append('g').attr('class', 'node-inner-content');

    if (isObsidianMode && obsidianStyle) {
      const getObsidianRadius = (d: GraphNode) => {
        const degree = nodeDegreeMap.get(d.id) ?? 1;
        return obsidianStyle.nodeRadiusBase + Math.min(8, degree) * obsidianStyle.nodeRadiusStep;
      };

      nodeContent.append('circle')
        .attr('class', 'node-dot')
        .attr('r', (d) => getObsidianRadius(d))
        .attr('fill', obsidianStyle.nodeFill)
        .attr('stroke', obsidianStyle.showAccentRings ? 'rgba(255,255,255,0.2)' : 'transparent')
        .attr('stroke-width', obsidianStyle.showAccentRings ? 0.6 : 0);

      if (obsidianStyle.showAccentRings) {
        nodeContent.append('circle')
          .attr('class', 'node-ring')
          .attr('r', (d) => getObsidianRadius(d) + 1.6)
          .attr('fill', 'none')
          .attr('stroke', 'transparent')
          .attr('stroke-width', 1);
      }

      nodeContent.append('text')
        .text((d) => d.id)
        .attr('class', 'node-label')
        .attr('dx', (d) => getObsidianRadius(d) + 6)
        .attr('dy', 3)
        .attr('fill', 'rgba(255,255,255,0.9)')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .style('opacity', 0)
        .style('pointer-events', 'none');
    } else {
      nodeContent.append('circle')
        .attr('class', 'node-glow')
        .attr('r', (d) => d.val + 10)
        .attr('fill', (d) => `url(#glow-grad-${d.group % 6})`);
      nodeContent.append('circle')
        .attr('class', 'node-core')
        .attr('r', (d) => d.val + 2)
        .attr('fill', (d) => getColor(d.group))
        .attr('stroke', 'rgba(255,255,255,0.9)')
        .attr('stroke-width', 1.5);
      nodeContent.append('text')
        .text((d) => d.id)
        .attr('dx', (d) => d.val + 10)
        .attr('dy', 4)
        .attr('fill', 'rgba(255,255,255,0.95)')
        .attr('font-size', (d) => `${Math.max(10, 8 + d.val / 2.2)}px`)
        .attr('font-weight', '600')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 4px 8px rgba(0,0,0,0.9)');
    }

    node.on('mouseenter', function (_, d) {
      if (activeNodeRef.current) return;
      setHoveredNode(d);

      const group = d3.select(this);
      group.classed('node-hovered', true);

      if (isObsidianMode && obsidianStyle && obsidianVariant) {
        node.classed('node-hovered', false);
        const neighbors = neighborMap.get(d.id) || new Set();
        node.classed('node-dim', (nodeData) => nodeData.id !== d.id && !neighbors.has(nodeData.id));
        node.classed('node-related', (nodeData) => obsidianStyle.showNeighborLabels && neighbors.has(nodeData.id));

        g.selectAll<SVGLineElement, GraphLink>('.visible-link')
          .attr('stroke', (linkData) => {
            const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
            const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
            const isConnected = sourceId === d.id || targetId === d.id;
            return isConnected ? obsidianStyle.accent : obsidianStyle.linkDim;
          })
          .attr('stroke-width', (linkData) => {
            const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
            const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
            return sourceId === d.id || targetId === d.id ? obsidianStyle.linkHoverWidth : obsidianStyle.linkWidth;
          });

        if (obsidianStyle.showAccentRings) {
          node.select<SVGCircleElement>('.node-ring')
            .attr('stroke', (nodeData) => (nodeData.id === d.id || neighbors.has(nodeData.id) ? obsidianStyle.accent : 'transparent'));
        }

        updateLabels();
        return;
      }

      const content = group.select('.node-inner-content');
      content.select('.node-glow').attr('r', d.val * 4.5);
      content.select('.node-core').attr('r', (d.val + 2) * 1.5);

      g.selectAll<SVGLineElement, GraphLink>('.visible-link')
        .classed('link-hovered', (linkData) => {
          const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
          const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
          return sourceId === d.id || targetId === d.id;
        })
        .style('stroke', (linkData) => {
          const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
          const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
          const sourceNode = nodeMap.get(sourceId);
          return sourceId === d.id || targetId === d.id ? getColor(sourceNode?.group ?? 0) : null;
        })
        .attr('marker-end', (linkData) => {
          const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
          const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
          const sourceNode = nodeMap.get(sourceId);
          return sourceId === d.id || targetId === d.id ? `url(#arrow-colored-${(sourceNode?.group ?? 0) % 6})` : 'url(#arrow)';
        });

      updateLabels();
    });

    node.on('mouseleave', function () {
      if (activeNodeRef.current) return;
      setHoveredNode(null);

      node.classed('node-hovered', false).classed('node-related', false);

      if (isObsidianMode && obsidianStyle) {
        node.classed('node-dim', false);
        g.selectAll<SVGLineElement, GraphLink>('.visible-link')
          .attr('stroke', obsidianStyle.linkBase)
          .attr('stroke-width', obsidianStyle.linkWidth);

        if (obsidianStyle.showAccentRings) {
          node.select<SVGCircleElement>('.node-ring').attr('stroke', 'transparent');
        }

        updateLabels();
        return;
      }

      const group = d3.select(this);
      group.classed('node-hovered', false);

      const content = group.select('.node-inner-content');
      content.select('.node-glow').attr('r', (d) => (d as GraphNode).val + 10);
      content.select('.node-core').attr('r', (d) => (d as GraphNode).val + 2);

      g.selectAll<SVGLineElement, GraphLink>('.visible-link')
        .classed('link-hovered', false)
        .style('stroke', null)
        .attr('marker-end', 'url(#arrow)');

      updateLabels();
    });

    node.on('click', (event, d) => {
      event.stopPropagation();
      setActiveNode(d);
      svg.transition().duration(900).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1.05).translate(-d.x, -d.y)
      );
    });

    node.call(d3.drag<SVGGElement, GraphNode>()
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }));

    const ticker = d3.timer((elapsed) => {
      const time = elapsed / 1000;
      const amp = floatIntensityRef.current;

      node.attr('transform', (d) => {
        const floatY = Math.sin(time * d.floatSpeed + d.floatPhase) * amp;
        d.visualY = d.y + floatY;
        return `translate(${d.x},${d.visualY})`;
      });

      linkHitArea
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).visualY || (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).visualY || (d.target as GraphNode).y || 0);

      link
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).visualY || (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).visualY || (d.target as GraphNode).y || 0);
    });

    return () => {
      ticker.stop();
      simulation.stop();
    };
  }, [isWebglMode, nodes, links, nodeMap, neighborMap, nodeDegreeMap, repulsion, gravity, baseScale, isFullscreen, renderMode]);

  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;

    if (isObsidianMode) {
      const obsidianVariant = getObsidianVariantFromMode(renderMode);
      if (!obsidianVariant) return;
      const obsidianStyle = getObsidianStyle(obsidianVariant);
      const nodeSelection = g.selectAll<SVGGElement, GraphNode>('.node-group');
      const linkSelection = g.selectAll<SVGLineElement, GraphLink>('.visible-link');

      nodeSelection.classed('node-hovered', false).classed('node-related', false);

      if (!activeNode) {
        nodeSelection.classed('node-active', false).classed('node-dim', false);
        nodeSelection.select<SVGCircleElement>('.node-dot').attr('fill', obsidianStyle.nodeFill);
        if (obsidianStyle.showAccentRings) {
          nodeSelection.select<SVGCircleElement>('.node-ring').attr('stroke', 'transparent');
        }
        linkSelection
          .attr('stroke', obsidianStyle.linkBase)
          .attr('stroke-width', obsidianStyle.linkWidth);
        updateLabels();
        return;
      }

      const neighbors = neighborMap.get(activeNode.id) || new Set();

      nodeSelection
        .classed('node-active', (node) => node.id === activeNode.id)
        .classed('node-related', (node) => obsidianStyle.showNeighborLabels && neighbors.has(node.id))
        .classed('node-dim', (node) => node.id !== activeNode.id && !neighbors.has(node.id));

      linkSelection
        .attr('stroke', (linkData) => {
          const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
          const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
          const isConnected = sourceId === activeNode.id || targetId === activeNode.id;
          return isConnected ? obsidianStyle.accent : obsidianStyle.linkDim;
        })
        .attr('stroke-width', (linkData) => {
          const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
          const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
          const isConnected = sourceId === activeNode.id || targetId === activeNode.id;
          return isConnected ? obsidianStyle.linkHoverWidth : obsidianStyle.linkWidth;
        });

      if (obsidianStyle.showAccentRings) {
        nodeSelection.select<SVGCircleElement>('.node-ring')
          .attr('stroke', (node) => (node.id === activeNode.id || neighbors.has(node.id) ? obsidianStyle.accent : 'transparent'));
      }

      updateLabels();
      return;
    }

    g.selectAll('.node-group').style('opacity', null).style('filter', null);
    g.selectAll('.visible-link').style('stroke', null).attr('marker-end', null);

    if (!activeNode) {
      g.classed('in-focus-mode', false);
      g.selectAll('.node-group').classed('node-active', false)
        .select('.node-inner-content').select('.node-glow').attr('r', (d: GraphNode) => d.val + 10);
      g.selectAll('.visible-link').classed('link-active', false).attr('marker-end', 'url(#arrow)');
      return;
    }

    const neighbors = neighborMap.get(activeNode.id) || new Set();
    g.classed('in-focus-mode', true);

    g.selectAll<SVGGElement, GraphNode>('.node-group')
      .classed('node-active', (node) => node.id === activeNode.id || neighbors.has(node.id));

    g.selectAll<SVGLineElement, GraphLink>('.visible-link')
      .classed('link-active', (linkData) => {
        const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
        const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
        return sourceId === activeNode.id || targetId === activeNode.id;
      })
      .style('stroke', (linkData) => {
        const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
        const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
        const sourceNode = nodeMap.get(sourceId);
        return sourceId === activeNode.id || targetId === activeNode.id ? getColor(sourceNode?.group ?? 0) : null;
      })
      .attr('marker-end', (linkData) => {
        const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
        const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
        const sourceNode = nodeMap.get(sourceId);
        return sourceId === activeNode.id || targetId === activeNode.id ? `url(#arrow-colored-${(sourceNode?.group ?? 0) % 6})` : 'url(#arrow)';
      });

    g.selectAll<SVGGElement, GraphNode>('.node-group')
      .filter((node) => node.id === activeNode.id)
      .select('.node-inner-content')
      .select('.node-glow')
      .transition()
      .duration(600)
      .attr('r', activeNode.val * 4.5);
  }, [activeNode, neighborMap, nodeMap, renderMode, isObsidianMode]);

  useEffect(() => {
    if (!isWebglMode || !containerRef.current) return;
    const width = sizeRef.current.width || containerRef.current.clientWidth || 600;
    const height = sizeRef.current.height || containerRef.current.clientHeight || 420;

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(repulsion))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => {
        if (isObsidianMode) {
          const degree = nodeDegreeMap.get(d.id) ?? 1;
          return 6 + Math.min(12, degree) * 0.6;
        }
        return d.val * 2;
      }).iterations(2))
      .force('x', d3.forceX(width / 2).strength(gravity))
      .force('y', d3.forceY(height / 2).strength(gravity));

    simulation.alphaDecay(0.02);
    simulationRef.current = simulation;

    const nextTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
    transformRef.current = nextTransform;
    currentScaleRef.current = nextTransform.k;

    return () => {
      simulation.stop();
    };
  }, [isWebglMode, nodes, links, repulsion, gravity, baseScale, nodeDegreeMap, isObsidianMode]);

  const resetView = () => {
    setActiveNode(null);
    setHoveredNode(null);
    setIsRenderMenuOpen(false);
    if (svgRef.current && zoomRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth || 600;
      const height = containerRef.current.clientHeight || 420;
      const nextTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
      transformRef.current = nextTransform;
      d3.select(svgRef.current)
        .transition()
        .duration(900)
        .call(zoomRef.current.transform, nextTransform);
    }
  };

  const setRenderModeSelection = (mode: RenderMode) => {
    setRenderMode(mode);
    if (mode.endsWith('-webgl')) setIsPanelOpen(false);
    setIsRenderMenuOpen(false);
  };

  const showWebgl = isWebglMode;
  const webglEventSource = eventSource ?? containerRef.current ?? undefined;
  const showSidebar = isFullscreen && !isWebglMode;
  const showDotGrid = renderMode === 'gemini-v1-svg' && !showWebgl;
  const showObsidianBackdrop = isObsidianMode && !showWebgl;
  const renderModeMeta = RENDER_OPTIONS.find((option) => option.id === renderMode);
  const renderModeLabel = renderModeMeta?.label ?? 'Gemini V1';
  const renderModeTag = renderModeMeta?.tag ?? 'SVG';
  const renderModeDetail = renderModeMeta?.detail ?? renderModeMeta?.description ?? '';

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#050505] text-[#F5F5F7] ${isFullscreen ? 'rounded-none' : 'rounded-[1.25rem]'} ${className}`}
    >
      {showDotGrid && <DotGridLayer />}
      {showObsidianBackdrop && (
        <ObsidianBackdrop
          variant={getObsidianVariantFromMode(renderMode) ?? 'obsidian-v1'}
        />
      )}
      <div className="absolute inset-0 z-10" ref={containerRef} onClick={resetView}>
        <div className={`absolute ${isFullscreen ? 'top-8 right-8' : 'top-3 right-3'} z-50 flex gap-3 pointer-events-none`} data-graph-ui>
          {isFullscreen && onExit && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onExit();
              }}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white/80 bg-white/10 border border-white/20 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
            >
              <ArrowLeft size={14} />
              Back to Home
            </button>
          )}
          {isFullscreen && (
            <div
              className="relative pointer-events-auto"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setIsRenderMenuOpen((prev) => !prev);
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-full text-[11px] font-semibold text-white/80 bg-white/10 border border-white/20 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white hover:bg-white/20"
                aria-expanded={isRenderMenuOpen}
                aria-haspopup="listbox"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">Render</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{renderModeLabel}</span>
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/60">
                      {renderModeTag}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-white/50 transition-transform duration-300 ${isRenderMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isRenderMenuOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f0f12]/90 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 space-y-1"
                >
                  {RENDER_OPTIONS.map((option) => {
                    const isSelected = renderMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setRenderModeSelection(option.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                          isSelected ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold">{option.label}</span>
                          <span className="mt-1 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            {option.tag}
                          </span>
                          <span className="mt-1 text-[10px] text-white/35">{option.description}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50">Selected</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div className={`pointer-events-auto flex bg-white/10 backdrop-blur-xl border border-white/15 ${isFullscreen ? 'rounded-2xl p-1.5' : 'rounded-xl p-1'} shadow-2xl`}>
            <button
              onClick={(event) => {
                event.stopPropagation();
                resetView();
              }}
              className={`${isFullscreen ? 'p-3 rounded-xl' : 'p-2 rounded-lg'} hover:bg-white/10 transition-colors text-white/70 hover:text-white`}
              aria-label="Reset view"
            >
              <RotateCcw size={isFullscreen ? 18 : 16} />
            </button>
            {showSidebar && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1 self-center" />
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPanelOpen(true);
                  }}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                  aria-label="Open settings panel"
                >
                  <Settings size={18} />
                </button>
              </>
            )}
          </div>
        </div>
        <div
          className={`absolute ${isFullscreen ? 'top-24 right-8' : 'top-12 right-3'} z-40 pointer-events-none`}
        >
          <div className="rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-xl px-4 py-3 max-w-[240px]">
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/40">Graph Mode</div>
            <div className="mt-1 text-sm font-semibold text-white">{renderModeLabel}</div>
            <span className="mt-2 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60">
              {renderModeTag}
            </span>
            <p className="mt-2 text-[11px] leading-snug text-white/60">{renderModeDetail}</p>
          </div>
        </div>
        {!isWebglMode && (
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />
        )}
        {showWebgl && (
          <FluidGlassLens
            className="absolute inset-0 z-20"
            eventSource={webglEventSource}
            lensProps={{
              scale: 0.25,
              ior: 1.15,
              thickness: 2,
              chromaticAberration: 0.05,
              anisotropy: 0.01,
              transmission: 1,
              roughness: 0,
              clearColor: '#050505',
              clearAlpha: 1
            }}
          >
            <GraphWebGLScene
              nodes={nodes}
              links={links}
              nodeMap={nodeMap}
              neighborMap={neighborMap}
              activeNode={activeNode}
              hoveredNodeRef={hoveredNodeRef}
              getColor={getColor}
              currentScaleRef={currentScaleRef}
              floatIntensityRef={floatIntensityRef}
              sizeRef={sizeRef}
              transformRef={transformRef}
              getNodeVisibilityThreshold={getNodeVisibilityThreshold}
            />
          </FluidGlassLens>
        )}
        <div className={`absolute ${isFullscreen ? 'bottom-8 left-8' : 'bottom-3 left-4'} pointer-events-none opacity-50`}>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
            {isFullscreen ? 'University Graph v5.2' : 'University Graph'}
          </div>
        </div>
      </div>
      {showSidebar && (
        <div
          className={`absolute left-0 top-0 h-full z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col ${isPanelOpen ? 'w-[400px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}`}
        >
          <div className="flex-1 m-6 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Network size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight">Curriculum</h1>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mt-0.5">Interactive Graph</p>
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPanelOpen(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <ChevronRight size={20} className="rotate-180 text-white/50" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Comp Sci', color: 'bg-[#30D158]' },
                  { label: 'Math', color: 'bg-[#0A84FF]' },
                  { label: 'AI/ML', color: 'bg-[#BF5AF2]' },
                  { label: 'Business', color: 'bg-[#FF9F0A]' }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default"
                  >
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`} />
                    <span className="text-[11px] font-semibold text-white/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 px-6 overflow-y-auto custom-scrollbar relative space-y-6 pb-6">
              {activeNode ? (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Selected Topic</span>
                    <h2 className="text-4xl font-bold tracking-tighter text-white">{activeNode.id}</h2>
                    <div className="flex gap-2 mt-4">
                      <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase text-white/70">
                        {activeNode.type}
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase text-white/70">
                        Credits: {activeNode.val}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 leading-relaxed text-sm text-white/60 font-medium">
                    Detailed breakdown of {activeNode.id}. This node serves as a critical junction in the{' '}
                    {activeNode.group === 1 ? 'Computer Science' : 'AI'} curriculum structure.
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      resetView();
                    }}
                    className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    <Focus size={18} /> Reset Focus
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div>
                    <p className="px-1 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Physics Engine</p>
                    <div className="space-y-6">
                      <ControlSlider label="Repulsion" value={repulsion} set={setRepulsion} min={-1500} max={-200} step={20} />
                      <ControlSlider label="Float Intensity" value={floatIntensity} set={setFloatIntensity} min={0} max={20} step={1} />
                      <ControlSlider label="Gravity" value={gravity} set={setGravity} min={0} max={0.3} step={0.01} />
                    </div>
                  </div>
                  <div>
                    <p className="px-1 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Visuals</p>
                    <div className="space-y-6">
                      <ControlSlider label="Label Visibility Factor" value={labelThreshold} set={setLabelThreshold} min={0.5} max={2.0} step={0.1} />
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <div className="flex gap-3">
                      <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-200/70 leading-relaxed font-medium">
                        <strong className="text-blue-100">Synchronized Physics:</strong> Nodes and links now float together in a unified JavaScript render loop.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ControlSliderProps {
  label: string;
  value: number;
  set: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, set, min, max, step }) => (
  <div className="group space-y-3">
    <div className="flex justify-between items-end">
      <span className="text-xs font-bold text-white/40 tracking-tight group-hover:text-white/60 transition-colors">{label}</span>
      <span className="text-xs font-mono font-bold text-blue-400 tabular-nums">{value}</span>
    </div>
    <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => set(Number(event.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div
        className="absolute h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-300"
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
      />
    </div>
  </div>
);

interface GraphWebGLSceneProps {
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  neighborMap: Map<string, Set<string>>;
  activeNode: GraphNode | null;
  hoveredNodeRef: React.MutableRefObject<GraphNode | null>;
  getColor: (group: number) => string;
  currentScaleRef: React.MutableRefObject<number>;
  floatIntensityRef: React.MutableRefObject<number>;
  sizeRef: React.MutableRefObject<{ width: number; height: number }>;
  transformRef: React.MutableRefObject<d3.ZoomTransform>;
  getNodeVisibilityThreshold: (node: GraphNode) => number;
}

const GraphWebGLScene: React.FC<GraphWebGLSceneProps> = ({
  nodes,
  links,
  nodeMap,
  neighborMap,
  activeNode,
  hoveredNodeRef,
  getColor,
  currentScaleRef,
  floatIntensityRef,
  sizeRef,
  transformRef,
  getNodeVisibilityThreshold
}) => {
  const palette = useMemo(() => GRAPH_COLORS.map((color) => new THREE.Color(color)), []);
  const neutralColor = useMemo(() => new THREE.Color('#ffffff'), []);

  return (
    <>
      <GraphBackdrop />
      <GraphTransform sizeRef={sizeRef} transformRef={transformRef}>
        <GraphLinks
          links={links}
          nodeMap={nodeMap}
          activeNode={activeNode}
          hoveredNodeRef={hoveredNodeRef}
          palette={palette}
          neutralColor={neutralColor}
          floatIntensityRef={floatIntensityRef}
        />
        {nodes.map((node) => (
          <GraphNodeMesh
            key={node.id}
            node={node}
            activeNode={activeNode}
            neighborMap={neighborMap}
            hoveredNodeRef={hoveredNodeRef}
            color={getColor(node.group)}
            currentScaleRef={currentScaleRef}
            floatIntensityRef={floatIntensityRef}
            getNodeVisibilityThreshold={getNodeVisibilityThreshold}
          />
        ))}
      </GraphTransform>
    </>
  );
};

const GraphBackdrop: React.FC = () => {
  const { viewport } = useThree();
  const texture = useMemo(() => {
    const size = 512;
    const step = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 0; x <= size; x += step) {
        for (let y = 0; y <= size; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 900; i += 1) {
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
    }
    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(4, 4);
    gridTexture.colorSpace = THREE.SRGBColorSpace;
    return gridTexture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0, -2]} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent opacity={0.55} />
    </mesh>
  );
};

interface GraphTransformProps {
  sizeRef: React.MutableRefObject<{ width: number; height: number }>;
  transformRef: React.MutableRefObject<d3.ZoomTransform>;
  children: React.ReactNode;
}

const GraphTransform: React.FC<GraphTransformProps> = ({ sizeRef, transformRef, children }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const scale = viewport.width / width;
    const transform = transformRef.current;
    groupRef.current.scale.set(scale * transform.k, -scale * transform.k, 1);
    groupRef.current.position.set(
      -viewport.width / 2 + transform.x * scale,
      viewport.height / 2 - transform.y * scale,
      0
    );
  });

  return <group ref={groupRef}>{children}</group>;
};

interface GraphLinksProps {
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  activeNode: GraphNode | null;
  hoveredNodeRef: React.MutableRefObject<GraphNode | null>;
  palette: THREE.Color[];
  neutralColor: THREE.Color;
  floatIntensityRef: React.MutableRefObject<number>;
}

const GraphLinks: React.FC<GraphLinksProps> = ({
  links,
  nodeMap,
  activeNode,
  hoveredNodeRef,
  palette,
  neutralColor,
  floatIntensityRef
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(links.length * 6), [links.length]);
  const colors = useMemo(() => new Float32Array(links.length * 6), [links.length]);

  useFrame(({ clock }) => {
    if (!geometryRef.current) return;
    const time = clock.getElapsedTime();
    const amp = floatIntensityRef.current;
    const activeId = activeNode?.id;
    const hoveredId = activeId ? null : hoveredNodeRef.current?.id;

    links.forEach((link, index) => {
      const source = typeof link.source === 'object' ? link.source : nodeMap.get(link.source);
      const target = typeof link.target === 'object' ? link.target : nodeMap.get(link.target);
      if (!source || !target) return;

      const sourceY = (source.y ?? 0) + Math.sin(time * source.floatSpeed + source.floatPhase) * amp;
      const targetY = (target.y ?? 0) + Math.sin(time * target.floatSpeed + target.floatPhase) * amp;

      const positionIndex = index * 6;
      positions[positionIndex] = source.x ?? 0;
      positions[positionIndex + 1] = sourceY;
      positions[positionIndex + 2] = 0;
      positions[positionIndex + 3] = target.x ?? 0;
      positions[positionIndex + 4] = targetY;
      positions[positionIndex + 5] = 0;

      const isHighlighted = activeId
        ? source.id === activeId || target.id === activeId
        : hoveredId
          ? source.id === hoveredId || target.id === hoveredId
          : false;
      const baseColor = isHighlighted ? palette[source.group % palette.length] : neutralColor;
      const intensity = isHighlighted ? 0.7 : activeId ? 0.08 : 0.18;
      colors[positionIndex] = baseColor.r * intensity;
      colors[positionIndex + 1] = baseColor.g * intensity;
      colors[positionIndex + 2] = baseColor.b * intensity;
      colors[positionIndex + 3] = baseColor.r * intensity;
      colors[positionIndex + 4] = baseColor.g * intensity;
      colors[positionIndex + 5] = baseColor.b * intensity;
    });

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;
  });

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.9} />
    </lineSegments>
  );
};

interface GraphNodeMeshProps {
  node: GraphNode;
  activeNode: GraphNode | null;
  neighborMap: Map<string, Set<string>>;
  hoveredNodeRef: React.MutableRefObject<GraphNode | null>;
  color: string;
  currentScaleRef: React.MutableRefObject<number>;
  floatIntensityRef: React.MutableRefObject<number>;
  getNodeVisibilityThreshold: (node: GraphNode) => number;
}

const GraphNodeMesh: React.FC<GraphNodeMeshProps> = ({
  node,
  activeNode,
  neighborMap,
  hoveredNodeRef,
  color,
  currentScaleRef,
  floatIntensityRef,
  getNodeVisibilityThreshold
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Mesh>(null);
  const glowScaleRef = useRef(1);
  const coreScaleRef = useRef(1);
  const labelMaterialRef = useRef<THREE.Material | null>(null);

  useEffect(() => {
    if (!labelRef.current) return;
    const material = Array.isArray(labelRef.current.material)
      ? labelRef.current.material[0]
      : labelRef.current.material;
    material.transparent = true;
    labelMaterialRef.current = material;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const floatY = Math.sin(time * node.floatSpeed + node.floatPhase) * floatIntensityRef.current;
    groupRef.current.position.set(node.x ?? 0, (node.y ?? 0) + floatY, 0);

    const activeId = activeNode?.id;
    const neighborSet = activeId ? neighborMap.get(activeId) : null;
    const isActive = activeId === node.id;
    const isNeighbor = neighborSet?.has(node.id);
    const isHovered = !activeId && hoveredNodeRef.current?.id === node.id;
    const inFocus = activeId ? isActive || isNeighbor : true;

    const targetGlow = isActive ? 3.6 : isHovered ? 2.4 : 1;
    const targetCore = isActive ? 1.4 : isHovered ? 1.2 : 1;
    glowScaleRef.current += (targetGlow - glowScaleRef.current) * 0.18;
    coreScaleRef.current += (targetCore - coreScaleRef.current) * 0.18;
    glowRef.current?.scale.setScalar(glowScaleRef.current);
    coreRef.current?.scale.setScalar(coreScaleRef.current);
    ringRef.current?.scale.setScalar(coreScaleRef.current);

    const dimOpacity = inFocus ? 1 : 0.22;
    const glowMaterial = glowRef.current?.material;
    if (glowMaterial && !Array.isArray(glowMaterial)) {
      glowMaterial.opacity = dimOpacity * (isActive ? 0.55 : isHovered ? 0.4 : 0.22);
    }
    const coreMaterial = coreRef.current?.material;
    if (coreMaterial && !Array.isArray(coreMaterial)) {
      coreMaterial.opacity = dimOpacity;
    }
    const ringMaterial = ringRef.current?.material;
    if (ringMaterial && !Array.isArray(ringMaterial)) {
      ringMaterial.opacity = dimOpacity * 0.75;
    }

    const threshold = getNodeVisibilityThreshold(node);
    const showLabel = isActive || isHovered || currentScaleRef.current >= threshold;
    if (labelMaterialRef.current && labelRef.current) {
      labelRef.current.visible = showLabel;
      labelMaterialRef.current.opacity = showLabel ? 0.85 : 0;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={glowRef}>
        <circleGeometry args={[node.val + 10, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      <mesh ref={coreRef}>
        <circleGeometry args={[node.val + 2, 64]} />
        <meshBasicMaterial color={color} transparent opacity={1} />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[node.val + 2.6, node.val + 3.6, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.7} />
      </mesh>
      <Text
        ref={labelRef}
        position={[node.val + 12, 0, 0.1]}
        fontSize={Math.max(10, 8 + node.val / 2.2)}
        fontWeight={600}
        color="white"
        anchorX="left"
        anchorY="middle"
      >
        {node.id}
      </Text>
    </group>
  );
};
