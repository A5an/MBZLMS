import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowLeft, ChevronRight, Focus, Info, Network, RotateCcw, Settings } from 'lucide-react';
import { GraphFluidGlass } from './GraphFluidGlass';

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
    { id: 'Applied Math', type: 'hub', group: 2, val: 30 },
    { id: 'Calculus', type: 'course', group: 2, val: 15 },
    { id: 'Linear Algebra', type: 'course', group: 2, val: 15 },
    { id: 'Statistics', type: 'course', group: 2, val: 14 },
    { id: 'AI Specialization', type: 'hub', group: 3, val: 35 },
    { id: 'Intro to AI', type: 'course', group: 3, val: 15 },
    { id: 'Machine Learning', type: 'course', group: 3, val: 18 },
    { id: 'Computer Vision', type: 'course', group: 3, val: 14 },
    { id: 'NLP', type: 'course', group: 3, val: 15 },
    { id: 'Business Minor', type: 'hub', group: 4, val: 25 },
    { id: 'Entrepreneurship', type: 'course', group: 4, val: 12 },
    { id: 'Economics', type: 'course', group: 4, val: 10 },
    { id: 'AI Ethics', type: 'course', group: 4, val: 14 }
  ].map(enrich);

  const extraConcepts = [
    { id: 'Data Structures', group: 1 },
    { id: 'Algorithms', group: 1 },
    { id: 'Microservices', group: 1 },
    { id: 'Docker & K8s', group: 1 },
    { id: 'Cryptography', group: 1 },
    { id: 'Network Security', group: 1 },
    { id: 'Gradient Descent', group: 2 },
    { id: 'Matrices', group: 2 },
    { id: 'Bayesian Theorem', group: 2 },
    { id: 'Neural Networks', group: 3 },
    { id: 'Loss Optimization', group: 3 },
    { id: 'Transformers', group: 3 },
    { id: 'LLMs', group: 3 },
    { id: 'Robotics', group: 3 },
    { id: 'Reinforcement Learning', group: 3 },
    { id: 'Bias & Fairness', group: 4 },
    { id: 'Tech Policy', group: 4 },
    { id: 'Market Analysis', group: 4 }
  ].map((node) => enrich({ ...node, type: 'concept', val: 4 }));

  const nodes = [...baseNodes, ...extraConcepts];

  const links: GraphLink[] = [
    { source: 'CompSci Major', target: 'Web Development' },
    { source: 'Web Development', target: 'React Frameworks' },
    { source: 'Web Development', target: 'Backend Systems' },
    { source: 'CompSci Major', target: 'Cloud Computing' },
    { source: 'CompSci Major', target: 'Cybersecurity' },
    { source: 'Applied Math', target: 'Calculus' },
    { source: 'Applied Math', target: 'Linear Algebra' },
    { source: 'Applied Math', target: 'Statistics' },
    { source: 'Calculus', target: 'Gradient Descent' },
    { source: 'Linear Algebra', target: 'Matrices' },
    { source: 'Statistics', target: 'Bayesian Theorem' },
    { source: 'AI Specialization', target: 'Intro to AI' },
    { source: 'AI Specialization', target: 'Machine Learning' },
    { source: 'Machine Learning', target: 'Neural Networks' },
    { source: 'Machine Learning', target: 'Loss Optimization' },
    { source: 'AI Specialization', target: 'Computer Vision' },
    { source: 'AI Specialization', target: 'NLP' },
    { source: 'NLP', target: 'Transformers' },
    { source: 'NLP', target: 'LLMs' },
    { source: 'Business Minor', target: 'Entrepreneurship' },
    { source: 'Entrepreneurship', target: 'Economics' },
    { source: 'Business Minor', target: 'AI Ethics' },
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
  const { nodes, links } = useMemo(createGraphData, []);
  const baseScale = isFullscreen ? 0.6 : 0.7;
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [repulsion, setRepulsion] = useState(-1000);
  const [gravity, setGravity] = useState(0.1);
  const [floatIntensity, setFloatIntensity] = useState(5);
  const [labelThreshold, setLabelThreshold] = useState(1.0);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const [isFluidReady, setIsFluidReady] = useState(false);
  const activeNodeRef = useRef<GraphNode | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const currentScaleRef = useRef(baseScale);
  const labelThresholdRef = useRef(labelThreshold);
  const floatIntensityRef = useRef(floatIntensity);

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

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const COLORS = ['#FF3B30', '#30D158', '#0A84FF', '#BF5AF2', '#FF9F0A', '#64D2FF'];
  const getColor = (group: number) => COLORS[group] || '#8E8E93';

  const getNodeVisibilityThreshold = (node: GraphNode) => {
    let factor = 1.0;
    if (node.val >= 20) factor = 0.3;
    else if (node.val >= 10) factor = 0.6;
    return labelThresholdRef.current * factor;
  };

  const updateLabels = () => {
    if (!gRef.current) return;
    gRef.current
      .selectAll<SVGTextElement, GraphNode>('text')
      .transition()
      .duration(200)
      .style('opacity', function (d) {
        const parent = d3.select(this.parentNode as SVGGElement);
        if (parent.classed('node-hovered') || parent.classed('node-active')) return 1;
        const threshold = getNodeVisibilityThreshold(d);
        return currentScaleRef.current < threshold ? 0 : 0.8;
      });
  };

  useEffect(() => {
    activeNodeRef.current = activeNode;
  }, [activeNode]);

  useEffect(() => {
    if (!containerRef.current) return;
    setEventSource(containerRef.current);
  }, []);

  useEffect(() => {
    if (!isFullscreen) setIsFluidReady(false);
  }, [isFullscreen]);

  useEffect(() => {
    labelThresholdRef.current = labelThreshold;
    if (gRef.current) updateLabels();
  }, [labelThreshold]);

  useEffect(() => {
    floatIntensityRef.current = floatIntensity;
  }, [floatIntensity]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
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
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 420;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
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

    COLORS.forEach((color, index) => {
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

    const g = svg.append('g').attr('class', 'graph-container');
    gRef.current = g;

    svg.append('style').text(`
      .graph-container { transition: opacity 0.5s ease; }
      .graph-container.in-focus-mode .node-group:not(.node-active) { opacity: 0.2; filter: blur(3px); transition: opacity 0.5s, filter 0.5s; }
      .graph-container.in-focus-mode .visible-link:not(.link-active) { stroke-opacity: 0.05; transition: stroke-opacity 0.5s; }
      .node-group.node-active, .node-group.node-hovered { opacity: 1; filter: url(#drop-shadow); }
      .visible-link.link-active, .visible-link.link-hovered { stroke-opacity: 1; stroke-width: 2px; }
      .node-glow { transition: r 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .node-core { transition: r 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
    `);

    const zoomScaleExtent: [number, number] = isFullscreen ? [0.1, 4] : [0.3, 3];
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(zoomScaleExtent)
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        currentScaleRef.current = event.transform.k;
        updateLabels();
      });
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale));
    zoomRef.current = zoom;

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(repulsion))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.val * 2).iterations(2))
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
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrow)');

    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    const nodeContent = node.append('g').attr('class', 'node-inner-content');

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

    node.on('mouseenter', function (_, d) {
      if (activeNodeRef.current) return;

      const group = d3.select(this);
      group.classed('node-hovered', true);

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

    node.on('mouseleave', function (_, d) {
      if (activeNodeRef.current) return;

      const group = d3.select(this);
      group.classed('node-hovered', false);

      const content = group.select('.node-inner-content');
      content.select('.node-glow').attr('r', d.val + 10);
      content.select('.node-core').attr('r', d.val + 2);

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
  }, [nodes, links, nodeMap, repulsion, gravity, baseScale, isFullscreen]);

  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;

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
  }, [activeNode, neighborMap, nodeMap]);

  const resetView = () => {
    setActiveNode(null);
    if (svgRef.current && zoomRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth || 600;
      const height = containerRef.current.clientHeight || 420;
      d3.select(svgRef.current)
        .transition()
        .duration(900)
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale));
    }
  };

  const showFluidGlass = isFullscreen;
  const hideSvg = showFluidGlass && isFluidReady;

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#050505] text-[#F5F5F7] ${isFullscreen ? 'rounded-none' : 'rounded-[1.25rem]'} ${className}`}
    >
      <DotGridLayer />
      <div className="absolute inset-0 z-10" ref={containerRef} onClick={resetView}>
        <div className={`absolute ${isFullscreen ? 'top-8 right-8' : 'top-3 right-3'} z-50 flex gap-3 pointer-events-none`}>
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
            {isFullscreen && (
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
        <svg
          ref={svgRef}
          className={`w-full h-full cursor-grab active:cursor-grabbing ${hideSvg ? 'opacity-0' : ''}`}
        />
        {showFluidGlass && eventSource && (
          <GraphFluidGlass
            svgRef={svgRef}
            eventSource={eventSource}
            className="absolute inset-0 z-20 pointer-events-none"
            onReady={() => setIsFluidReady(true)}
          />
        )}
        <div className={`absolute ${isFullscreen ? 'bottom-8 left-8' : 'bottom-3 left-4'} pointer-events-none opacity-50`}>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
            {isFullscreen ? 'University Graph v5.2' : 'University Graph'}
          </div>
        </div>
      </div>
      {isFullscreen && (
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
