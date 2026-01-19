import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import { ArrowLeft, ChevronRight, Focus, Info, Network, RotateCcw, Settings } from 'lucide-react';
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
  const [hasSize, setHasSize] = useState(false);
  const activeNodeRef = useRef<GraphNode | null>(null);
  const hoveredNodeRef = useRef<GraphNode | null>(null);
  const dragNodeRef = useRef<GraphNode | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<HTMLElement, unknown> | null>(null);
  const currentScaleRef = useRef(baseScale);
  const labelThresholdRef = useRef(labelThreshold);
  const floatIntensityRef = useRef(floatIntensity);
  const sizeRef = useRef({ width: 0, height: 0 });
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

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

  const getColor = (group: number) => GRAPH_COLORS[group] || '#8E8E93';

  const getNodeVisibilityThreshold = (node: GraphNode) => {
    let factor = 1.0;
    if (node.val >= 20) factor = 0.3;
    else if (node.val >= 10) factor = 0.6;
    return labelThresholdRef.current * factor;
  };

  useEffect(() => {
    activeNodeRef.current = activeNode;
  }, [activeNode]);

  useEffect(() => {
    if (!containerRef.current) return;
    setEventSource(containerRef.current);
  }, []);

  useEffect(() => {
    labelThresholdRef.current = labelThreshold;
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
          sizeRef.current = { width, height };
          setHasSize(true);
          if (simulationRef.current) {
            simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2));
            simulationRef.current.force('x', d3.forceX(width / 2).strength(gravity));
            simulationRef.current.force('y', d3.forceY(height / 2).strength(gravity));
            simulationRef.current.alpha(0.3).restart();
          }
          if (zoomRef.current && containerRef.current) {
            const selection = d3.select(containerRef.current);
            const nextTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(currentScaleRef.current);
            selection.call(zoomRef.current.transform, nextTransform);
            transformRef.current = nextTransform;
          }
        }
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [gravity]);

  useEffect(() => {
    if (!hasSize || !containerRef.current) return;
    const { width, height } = sizeRef.current;
    const zoomScaleExtent: [number, number] = isFullscreen ? [0.1, 4] : [0.3, 3];
    const zoom = d3.zoom<HTMLElement, unknown>()
      .scaleExtent(zoomScaleExtent)
      .filter(() => !dragNodeRef.current && !hoveredNodeRef.current)
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        currentScaleRef.current = event.transform.k;
      });
    const selection = d3.select(containerRef.current);
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
    selection.call(zoom).call(zoom.transform, initialTransform);
    transformRef.current = initialTransform;
    currentScaleRef.current = initialTransform.k;
    zoomRef.current = zoom;
    return () => {
      selection.on('.zoom', null);
    };
  }, [hasSize, isFullscreen, baseScale]);

  useEffect(() => {
    if (!hasSize) return;
    const { width, height } = sizeRef.current;
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(repulsion))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.val * 2).iterations(2))
      .force('x', d3.forceX(width / 2).strength(gravity))
      .force('y', d3.forceY(height / 2).strength(gravity));

    simulation.alphaDecay(0.02);
    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, links, repulsion, gravity, hasSize]);

  useEffect(() => {
    if (!containerRef.current || !hasSize) return;
    const container = containerRef.current;

    const getPointerPosition = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const transform = transformRef.current;
      const simX = (x - transform.x) / transform.k;
      const simY = (y - transform.y) / transform.k;
      return { simX, simY };
    };

    const isUiEvent = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      return Boolean(target?.closest('[data-graph-ui]'));
    };

    const findNearestNode = (simX: number, simY: number) => {
      let closest: GraphNode | null = null;
      let closestDist = Infinity;
      nodes.forEach((node) => {
        if (node.x == null || node.y == null) return;
        const dx = node.x - simX;
        const dy = node.y - simY;
        const dist = Math.hypot(dx, dy);
        const threshold = node.val + 10;
        if (dist < threshold && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      });
      return closest;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isUiEvent(event)) return;
      const { simX, simY } = getPointerPosition(event);
      if (dragNodeRef.current) {
        dragNodeRef.current.fx = simX;
        dragNodeRef.current.fy = simY;
        return;
      }
      if (activeNodeRef.current) {
        hoveredNodeRef.current = null;
        container.style.cursor = 'default';
        return;
      }
      const nearest = findNearestNode(simX, simY);
      hoveredNodeRef.current = nearest;
      container.style.cursor = nearest ? 'pointer' : 'default';
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (isUiEvent(event)) return;
      if (activeNodeRef.current) return;
      const { simX, simY } = getPointerPosition(event);
      const nearest = findNearestNode(simX, simY);
      if (!nearest) return;
      dragNodeRef.current = nearest;
      nearest.fx = nearest.x ?? simX;
      nearest.fy = nearest.y ?? simY;
      simulationRef.current?.alphaTarget(0.3).restart();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (isUiEvent(event)) return;
      if (activeNodeRef.current) {
        resetView();
        return;
      }
      if (dragNodeRef.current) {
        dragNodeRef.current.fx = null;
        dragNodeRef.current.fy = null;
        dragNodeRef.current = null;
        simulationRef.current?.alphaTarget(0);
        return;
      }
      if (hoveredNodeRef.current) {
        setActiveNode(hoveredNodeRef.current);
        return;
      }
      resetView();
    };

    const handlePointerLeave = () => {
      if (dragNodeRef.current) {
        dragNodeRef.current.fx = null;
        dragNodeRef.current.fy = null;
        dragNodeRef.current = null;
        simulationRef.current?.alphaTarget(0);
      }
      hoveredNodeRef.current = null;
      container.style.cursor = 'default';
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('pointercancel', handlePointerLeave);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointercancel', handlePointerLeave);
    };
  }, [hasSize, nodes, baseScale]);

  const resetView = () => {
    setActiveNode(null);
    hoveredNodeRef.current = null;
    if (zoomRef.current && containerRef.current) {
      const width = sizeRef.current.width || containerRef.current.clientWidth || 600;
      const height = sizeRef.current.height || containerRef.current.clientHeight || 420;
      const nextTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
      d3.select(containerRef.current)
        .transition()
        .duration(900)
        .call(zoomRef.current.transform, nextTransform);
      transformRef.current = nextTransform;
      currentScaleRef.current = nextTransform.k;
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#050505] text-[#F5F5F7] ${isFullscreen ? 'rounded-none' : 'rounded-[1.25rem]'} ${className}`}
    >
      <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing" ref={containerRef}>
        <div
          className={`absolute ${isFullscreen ? 'top-8 right-8' : 'top-3 right-3'} z-50 flex gap-3 pointer-events-none`}
          data-graph-ui
        >
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
        {eventSource && (
          <FluidGlassLens
            className="absolute inset-0 z-10"
            eventSource={eventSource}
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
              isFullscreen={isFullscreen}
            />
          </FluidGlassLens>
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
          data-graph-ui
        >
          <div className="flex-1 m-6 rounded-[32px] bg-transparent border border-transparent shadow-none flex flex-col overflow-hidden relative">
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
  isFullscreen: boolean;
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
  getNodeVisibilityThreshold,
  isFullscreen
}) => {
  const palette = useMemo(() => GRAPH_COLORS.map((color) => new THREE.Color(color)), []);
  const neutralColor = useMemo(() => new THREE.Color('#ffffff'), []);

  return (
    <>
      <GraphBackdrop />
      {isFullscreen && <GraphSideGlass />}
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

const buildRoundedRectShape = (width: number, height: number, radius: number) => {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

const GraphSideGlass: React.FC = () => {
  const { viewport } = useThree();
  const panelWidth = viewport.width * 0.36;
  const panelHeight = viewport.height * 0.88;
  const radius = Math.min(panelWidth, panelHeight) * 0.08;
  const panelX = -viewport.width / 2 + panelWidth / 2 + viewport.width * 0.04;

  const geometry = useMemo(() => {
    const shape = buildRoundedRectShape(panelWidth, panelHeight, radius);
    return new THREE.ShapeGeometry(shape, 32);
  }, [panelWidth, panelHeight, radius]);

  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  useEffect(() => () => {
    geometry.dispose();
    edgeGeometry.dispose();
  }, [geometry, edgeGeometry]);

  return (
    <group position={[panelX, 0, -0.6]}>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          transmission={1}
          roughness={0}
          thickness={1.8}
          ior={1.2}
          chromaticAberration={0.02}
          anisotropy={0.01}
          color="#0b1020"
        />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="white" transparent opacity={0.2} />
      </lineSegments>
    </group>
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
