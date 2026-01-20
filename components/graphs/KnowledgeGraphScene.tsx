import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowLeft, ChevronDown, ChevronRight, Network, RotateCcw, Settings, Wand2 } from 'lucide-react';
import { Header } from '../Header';
import { FluidGlassLens } from '../FluidGlass';
import { DotGridLayer, ObsidianBackdrop } from './knowledge-graph-backgrounds';
import {
  BASE_GRAPH_DATA,
  COURSE_GRAPH_DATA,
  COURSE_GRAPH_ROOTS,
  COURSE_TREE,
  DEFAULT_COURSE_ID,
  GRAPH_COLORS,
  QUIZ_DETAILS,
  RENDER_OPTIONS
} from './knowledge-graph-data';
import {
  ControlSlider,
  CourseTreePanel,
  ExperimentalPanel,
  FloatingInfoCardSvg,
  ModeInfoCard,
  ObsidianInfoPanels,
  ObsidianSettingsPanel,
  QuizDetailPanel,
  SidebarOption,
  SidebarSection,
  SidebarSwitch
} from './knowledge-graph-panels';
import { GraphWebGLScene } from './knowledge-graph-webgl';
import { getObsidianStyle, getObsidianVariantFromMode } from './knowledge-graph-utils';
import { useKnowledgeGraphSvg } from './use-knowledge-graph-svg';
import { useKnowledgeGraphWebgl } from './use-knowledge-graph-webgl';
import type { GraphLink, GraphNode, RenderMode } from './knowledge-graph-types';

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
  const baseScale = isFullscreen ? 0.6 : 0.7;
  const [renderMode, setRenderMode] = useState<RenderMode>('gemini-v1-svg');
  const [customNotes, setCustomNotes] = useState<GraphNode[]>([]);
  const graphData = useMemo(() => {
    if (renderMode !== 'gemini-v1-svg' && renderMode !== 'obsidian-v1-svg') {
      return BASE_GRAPH_DATA;
    }
    if (customNotes.length === 0) {
      return COURSE_GRAPH_DATA;
    }
    const noteLinks: GraphLink[] = customNotes.map((note) => ({
      source: COURSE_GRAPH_ROOTS[note.courseId ?? DEFAULT_COURSE_ID] ?? 'CompSci Major',
      target: note.id
    }));
    return {
      nodes: [...COURSE_GRAPH_DATA.nodes, ...customNotes],
      links: [...COURSE_GRAPH_DATA.links, ...noteLinks]
    };
  }, [renderMode, customNotes]);
  const { nodes, links } = graphData;
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isRenderMenuOpen, setIsRenderMenuOpen] = useState(false);
  const [isObsidianSettingsOpen, setIsObsidianSettingsOpen] = useState(true);
  const [isExperimentalOpen, setIsExperimentalOpen] = useState(false);
  const [enableFloatingInfo, setEnableFloatingInfo] = useState(false);
  const [enableWebglHoverPulse, setEnableWebglHoverPulse] = useState(true);
  const [enableWebglHighContrastLinks, setEnableWebglHighContrastLinks] = useState(false);
  const [floatingInfoNodeId, setFloatingInfoNodeId] = useState<string | null>(null);
  const [obsidianShowArrows, setObsidianShowArrows] = useState(false);
  const [obsidianTextFade, setObsidianTextFade] = useState(0.9);
  const [obsidianNodeScale, setObsidianNodeScale] = useState(1.2);
  const [obsidianLinkThickness, setObsidianLinkThickness] = useState(1.2);
  const [obsidianAnimate, setObsidianAnimate] = useState(true);
  const [repulsion, setRepulsion] = useState(-1000);
  const [gravity, setGravity] = useState(0.1);
  const [floatIntensity, setFloatIntensity] = useState(5);
  const [labelThreshold, setLabelThreshold] = useState(0.8);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(DEFAULT_COURSE_ID);
  const [isolateCourse, setIsolateCourse] = useState(false);
  const [viewFilters, setViewFilters] = useState({
    studyNow: true,
    whatsDone: false,
    fullView: true,
    smartFocus: false
  });
  const [leftSectionsOpen, setLeftSectionsOpen] = useState({
    classes: true,
    view: true,
    notes: true,
    controls: false
  });
  const [noteDraft, setNoteDraft] = useState('');
  const [openCourseIds, setOpenCourseIds] = useState<Record<string, boolean>>(() => ({ [DEFAULT_COURSE_ID]: true }));
  const [openSectionIds, setOpenSectionIds] = useState<Record<string, boolean>>(() => ({
    [`${DEFAULT_COURSE_ID}-lectures`]: true,
    [`${DEFAULT_COURSE_ID}-assignments`]: true,
    [`${DEFAULT_COURSE_ID}-quizzes`]: true
  }));
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const activeNodeRef = useRef<GraphNode | null>(null);
  const hoveredNodeRef = useRef<GraphNode | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null>(null);
  const linkSelectionRef = useRef<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null>(null);
  const currentScaleRef = useRef(baseScale);
  const labelThresholdRef = useRef(labelThreshold);
  const floatIntensityRef = useRef(floatIntensity);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const sizeRef = useRef({ width: 0, height: 0 });
  const webglTransformInitializedRef = useRef(false);
  const floatingInfoRef = useRef<HTMLDivElement | null>(null);
  const floatingInfoEnabledRef = useRef(enableFloatingInfo);
  const ignoreClickRef = useRef(false);

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
  const selectedCourse = useMemo(
    () => COURSE_TREE.find((course) => course.id === selectedCourseId) ?? COURSE_TREE[0],
    [selectedCourseId]
  );
  const isolatedNodeIds = useMemo(() => {
    if (!isolateCourse || !selectedCourse) return null;
    const group = selectedCourse.group;
    const ids = new Set<string>();
    nodes.forEach((node) => {
      if (node.group === group || node.courseId === selectedCourse.id) {
        ids.add(node.id);
      }
    });
    return ids;
  }, [isolateCourse, selectedCourse, nodes]);
  const visibleNotes = useMemo(
    () => customNotes.filter((note) => note.courseId === selectedCourseId),
    [customNotes, selectedCourseId]
  );

  const getColor = (group: number) => GRAPH_COLORS[group] || '#8E8E93';
  const isObsidianMode = renderMode.startsWith('obsidian-');
  const isWebglMode = renderMode.endsWith('-webgl');
  const obsidianVariant = getObsidianVariantFromMode(renderMode);
  const obsidianStyle = useMemo(() => {
    if (!obsidianVariant) return null;
    const base = getObsidianStyle(obsidianVariant);
    return {
      ...base,
      nodeRadiusBase: base.nodeRadiusBase * obsidianNodeScale,
      nodeRadiusStep: base.nodeRadiusStep * obsidianNodeScale,
      linkWidth: base.linkWidth * obsidianLinkThickness,
      linkHoverWidth: base.linkHoverWidth * obsidianLinkThickness
    };
  }, [obsidianVariant, obsidianNodeScale, obsidianLinkThickness]);

  const getNodeVisibilityThreshold = (node: GraphNode) => {
    let factor = 1.0;
    if (node.val >= 20) factor = 0.3;
    else if (node.val >= 10) factor = 0.6;
    return labelThresholdRef.current * factor;
  };

  const { triggerObsidianAnimation } = useKnowledgeGraphSvg({
    nodes,
    links,
    nodeMap,
    neighborMap,
    nodeDegreeMap,
    renderMode,
    isObsidianMode,
    obsidianVariant,
    obsidianStyle,
    obsidianShowArrows,
    obsidianAnimate,
    obsidianTextFade,
    labelThreshold,
    repulsion,
    gravity,
    baseScale,
    isFullscreen,
    isWebglMode,
    activeNode,
    isolatedNodeIds,
    getNodeVisibilityThreshold,
    getColor,
    setSelectedCourseId,
    setOpenCourseIds,
    setOpenSectionIds,
    setActiveNode,
    setHoveredNode,
    setFloatingInfoNodeId,
    floatingInfoEnabledRef,
    activeNodeRef,
    hoveredNodeRef,
    labelThresholdRef,
    floatIntensityRef,
    currentScaleRef,
    transformRef,
    sizeRef,
    svgRef,
    containerRef,
    simulationRef,
    zoomRef,
    gRef,
    nodeSelectionRef,
    linkSelectionRef
  });

  useKnowledgeGraphWebgl({
    nodes,
    links,
    nodeMap,
    nodeDegreeMap,
    repulsion,
    gravity,
    baseScale,
    isFullscreen,
    isWebglMode,
    isObsidianMode,
    obsidianStyle,
    enableFloatingInfo,
    floatingInfoNodeId,
    containerRef,
    floatingInfoRef,
    transformRef,
    currentScaleRef,
    simulationRef,
    sizeRef,
    webglTransformInitializedRef,
    hoveredNodeRef,
    ignoreClickRef,
    setActiveNode,
    setFloatingInfoNodeId
  });

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
    if (enableFloatingInfo && activeNode && !floatingInfoNodeId) {
      setFloatingInfoNodeId(activeNode.id);
    }
  }, [enableFloatingInfo, activeNode, floatingInfoNodeId]);

  useEffect(() => {
    if (!containerRef.current) return;
    setEventSource(containerRef.current);
  }, []);


  useEffect(() => {
    if (!isFullscreen) {
      setRenderMode('gemini-v1-svg');
      setIsRenderMenuOpen(false);
      setIsObsidianSettingsOpen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isWebglMode) {
      gRef.current = null;
      zoomRef.current = null;
      nodeSelectionRef.current = null;
      linkSelectionRef.current = null;
    } else {
      webglTransformInitializedRef.current = false;
    }
  }, [isWebglMode]);

  useEffect(() => {
    floatingInfoEnabledRef.current = enableFloatingInfo;
    if (!enableFloatingInfo) {
      setFloatingInfoNodeId(null);
    }
  }, [enableFloatingInfo]);

  useEffect(() => {
    floatIntensityRef.current = floatIntensity;
  }, [floatIntensity]);

  const clearSelection = () => {
    setActiveNode(null);
    setHoveredNode(null);
    setIsRenderMenuOpen(false);
    setFloatingInfoNodeId(null);
  };

  const resetView = () => {
    clearSelection();
    if (isWebglMode && containerRef.current) {
      const width = sizeRef.current.width || containerRef.current.clientWidth || 600;
      const height = sizeRef.current.height || containerRef.current.clientHeight || 420;
      const nextTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
      transformRef.current = nextTransform;
      currentScaleRef.current = nextTransform.k;
      webglTransformInitializedRef.current = true;
      return;
    }
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

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    if (event.target instanceof Element) {
      if (event.target.closest('[data-graph-ui]') || event.target.closest('[data-graph-panel]')) return;
    }
    clearSelection();
  };

  const setRenderModeSelection = (mode: RenderMode) => {
    setRenderMode(mode);
    setFloatingInfoNodeId(null);
    if (mode.endsWith('-webgl')) {
      setIsPanelOpen(false);
      setActiveNode(null);
      setHoveredNode(null);
    }
    if (mode.startsWith('obsidian-')) setIsObsidianSettingsOpen(true);
    setIsRenderMenuOpen(false);
  };

  const showWebgl = isWebglMode;
  const webglEventSource = eventSource ?? containerRef.current ?? undefined;
  const showCourseLayout = isFullscreen && (renderMode === 'gemini-v1-svg' || renderMode === 'obsidian-v1-svg');
  const showCourseSidebar = showCourseLayout;
  const showObsidianPanels = isFullscreen && isObsidianMode && !showCourseLayout;
  const showExperimentalPanel = isFullscreen && !showCourseLayout;
  const showObsidianAnimation = showObsidianPanels && !isWebglMode;
  const showDotGrid = renderMode === 'gemini-v1-svg' && !showWebgl;
  const showObsidianBackdrop = isObsidianMode && !showWebgl;
  const renderModeMeta = RENDER_OPTIONS.find((option) => option.id === renderMode);
  const renderModeLabel = renderModeMeta?.label ?? 'Gemini V1';
  const renderModeTag = renderModeMeta?.tag ?? 'SVG';
  const renderModeDetail = renderModeMeta?.detail ?? renderModeMeta?.description ?? '';
  const floatingInfoNode = floatingInfoNodeId ? nodeMap.get(floatingInfoNodeId) : null;
  const showFloatingInfo = enableFloatingInfo && Boolean(floatingInfoNode);
  const activeQuizDetail = activeNode?.type === 'quiz' ? QUIZ_DETAILS[activeNode.id] ?? null : null;
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date()),
    []
  );
  const topRightControlsPosition = showCourseLayout ? 'top-28 right-[380px]' : isFullscreen ? 'top-8 right-8' : 'top-3 right-3';
  const handleToggleCourse = (courseId: string) => {
    setOpenCourseIds((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };
  const handleToggleSection = (courseId: string, sectionId: string) => {
    const key = `${courseId}-${sectionId}`;
    setOpenSectionIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const handleSelectCourse = (courseId: string, shouldExpand = true) => {
    setSelectedCourseId(courseId);
    if (!shouldExpand) return;
    setOpenCourseIds((prev) => ({ ...prev, [courseId]: true }));
    setOpenSectionIds((prev) => ({
      ...prev,
      [`${courseId}-lectures`]: true,
      [`${courseId}-assignments`]: true,
      [`${courseId}-quizzes`]: true
    }));
  };
  const handleToggleLeftSection = (section: keyof typeof leftSectionsOpen) => {
    setLeftSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const handleToggleViewFilter = (key: keyof typeof viewFilters) => {
    setViewFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const handleAddNote = () => {
    const trimmed = noteDraft.trim();
    if (!trimmed || !selectedCourse) return;
    const rootId = COURSE_GRAPH_ROOTS[selectedCourse.id] ?? COURSE_GRAPH_ROOTS[DEFAULT_COURSE_ID];
    const anchor = rootId ? nodeMap.get(rootId) : null;
    const jitter = 60;
    const noteNode: GraphNode = {
      id: `${selectedCourse.id}-note-${Date.now()}`,
      label: trimmed,
      shortLabel: 'N',
      type: 'note',
      group: selectedCourse.group,
      val: 6,
      courseId: selectedCourse.id,
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.5,
      x: (anchor?.x ?? 0) + (Math.random() - 0.5) * jitter,
      y: (anchor?.y ?? 0) + (Math.random() - 0.5) * jitter
    };
    setCustomNotes((prev) => [...prev, noteNode]);
    setNoteDraft('');
  };
  const handleSelectQuiz = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    if (node.courseId) {
      handleSelectCourse(node.courseId);
    }
    setActiveNode(node);
    if (enableFloatingInfo) {
      setFloatingInfoNodeId(node.id);
    }
    if (!isWebglMode && svgRef.current && zoomRef.current && containerRef.current && node.x != null && node.y != null) {
      const width = containerRef.current.clientWidth || 600;
      const height = containerRef.current.clientHeight || 420;
      d3.select(svgRef.current)
        .transition()
        .duration(900)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(width / 2, height / 2).scale(1.05).translate(-node.x, -node.y)
        );
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#050505] text-[#F5F5F7] ${isFullscreen ? 'rounded-none' : 'rounded-[1.25rem]'} ${className}`}
    >
      {showCourseLayout && (
        <div className="absolute inset-x-0 top-0 z-[60]" data-graph-ui>
          <Header />
        </div>
      )}
      {showDotGrid && <DotGridLayer />}
      {showObsidianBackdrop && (
        <ObsidianBackdrop
          variant={obsidianVariant ?? 'obsidian-v1'}
        />
      )}
      <div className="absolute inset-0 z-10" ref={containerRef} onClick={handleCanvasClick}>
        <div className={`absolute ${topRightControlsPosition} z-50 flex gap-3 pointer-events-none`} data-graph-ui>
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
            {showCourseSidebar && (
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
            {showObsidianPanels && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1 self-center" />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsObsidianSettingsOpen((prev) => !prev);
                    }}
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                    aria-label="Toggle Obsidian settings"
                  >
                    <Settings size={18} />
                  </button>
                  {showObsidianAnimation && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        triggerObsidianAnimation();
                      }}
                      className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                      aria-label="Animate Obsidian graph"
                    >
                      <Wand2 size={18} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {showCourseLayout && (
          <div className="absolute top-20 right-[380px] z-50 pointer-events-none" data-graph-ui>
            <div className="pointer-events-auto rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl px-4 py-2 text-right shadow-lg">
              <div className="text-[9px] uppercase tracking-[0.4em] text-white/50">Today</div>
              <div className="text-sm font-semibold text-white">{todayLabel}</div>
            </div>
          </div>
        )}
        {showExperimentalPanel && (
          <div
            className={`absolute ${isFullscreen ? 'top-24 left-8' : 'top-12 left-3'} z-40 flex flex-col gap-3 pointer-events-none`}
          >
            <div className="pointer-events-auto" data-graph-panel>
              <ExperimentalPanel
                isOpen={isExperimentalOpen}
                onToggleOpen={() => setIsExperimentalOpen((prev) => !prev)}
                enableFloatingInfo={enableFloatingInfo}
                setEnableFloatingInfo={setEnableFloatingInfo}
                enableWebglHoverPulse={enableWebglHoverPulse}
                setEnableWebglHoverPulse={setEnableWebglHoverPulse}
                enableWebglHighContrastLinks={enableWebglHighContrastLinks}
                setEnableWebglHighContrastLinks={setEnableWebglHighContrastLinks}
              />
            </div>
            {showObsidianPanels && (
              <div className="pointer-events-auto" data-graph-panel>
                <ObsidianInfoPanels
                  activeNode={activeNode}
                  neighbors={activeNode ? Array.from(neighborMap.get(activeNode.id) ?? []) : []}
                />
              </div>
            )}
          </div>
        )}
        <div
          className={`absolute ${isFullscreen ? 'top-24 right-8' : 'top-12 right-3'} z-40 flex flex-col gap-3 pointer-events-none`}
        >
          {showObsidianPanels && isObsidianSettingsOpen && (
            <div className="pointer-events-auto" data-graph-panel>
              <ObsidianSettingsPanel
                showArrows={obsidianShowArrows}
                setShowArrows={setObsidianShowArrows}
                textFade={obsidianTextFade}
                setTextFade={setObsidianTextFade}
                nodeScale={obsidianNodeScale}
                setNodeScale={setObsidianNodeScale}
                linkThickness={obsidianLinkThickness}
                setLinkThickness={setObsidianLinkThickness}
                animate={obsidianAnimate}
                setAnimate={setObsidianAnimate}
                onClose={() => setIsObsidianSettingsOpen(false)}
              />
            </div>
          )}
          {!showCourseLayout && (
            <ModeInfoCard
              label={renderModeLabel}
              tag={renderModeTag}
              detail={renderModeDetail}
            />
          )}
        </div>
        {showFloatingInfo && floatingInfoNode && (
          <div
            ref={floatingInfoRef}
            className="absolute z-40 pointer-events-auto w-[240px]"
            data-graph-panel
            style={{ transform: 'translate3d(0px, 0px, 0px)' }}
          >
            <FloatingInfoCardSvg
              node={floatingInfoNode}
              onClose={() => setFloatingInfoNodeId(null)}
            />
          </div>
        )}
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
              nodeDegreeMap={nodeDegreeMap}
              neighborMap={neighborMap}
              activeNode={activeNode}
              hoveredNodeRef={hoveredNodeRef}
              getColor={getColor}
              currentScaleRef={currentScaleRef}
              floatIntensityRef={floatIntensityRef}
              obsidianVariant={obsidianVariant}
              obsidianStyle={obsidianStyle}
              obsidianTextFade={obsidianTextFade}
              obsidianAnimate={obsidianAnimate}
              sizeRef={sizeRef}
              transformRef={transformRef}
              getNodeVisibilityThreshold={getNodeVisibilityThreshold}
              enableWebglHoverPulse={enableWebglHoverPulse}
              enableWebglHighContrastLinks={enableWebglHighContrastLinks}
            />
          </FluidGlassLens>
        )}
        <div className={`absolute ${isFullscreen ? 'bottom-8 left-8' : 'bottom-3 left-4'} pointer-events-none opacity-50`}>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
            {isFullscreen ? 'University Graph v5.2' : 'University Graph'}
          </div>
        </div>
      </div>
      {showCourseSidebar && (
        <div
          className={`absolute left-0 top-0 h-full z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col ${isPanelOpen ? 'w-[340px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}`}
          data-graph-panel
        >
          <div className="flex-1 mx-6 mb-6 mt-20 rounded-[28px] bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Network size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">My Map</h1>
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest leading-none mt-0.5">Course Navigator</p>
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

            <div className="flex-1 px-6 py-6 overflow-y-auto custom-scrollbar space-y-6">
              <SidebarSection
                title="Class Selection"
                isOpen={leftSectionsOpen.classes}
                onToggle={() => handleToggleLeftSection('classes')}
              >
                <div className="space-y-2">
                  {COURSE_TREE.map((course) => {
                    const isActive = selectedCourseId === course.id;
                    const accent = GRAPH_COLORS[course.group] || '#8E8E93';
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => handleSelectCourse(course.id)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
                          <span>{course.label}</span>
                        </div>
                        <ChevronRight size={16} className={`text-white/40 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </SidebarSection>

              <SidebarSection
                title="View Options"
                isOpen={leftSectionsOpen.view}
                onToggle={() => handleToggleLeftSection('view')}
              >
                <div className="space-y-2">
                  <SidebarOption label="Study now" active={viewFilters.studyNow} onClick={() => handleToggleViewFilter('studyNow')} />
                  <SidebarOption label="What's done" active={viewFilters.whatsDone} onClick={() => handleToggleViewFilter('whatsDone')} />
                  <SidebarOption label="Full view" active={viewFilters.fullView} onClick={() => handleToggleViewFilter('fullView')} />
                  <SidebarOption label="Smart focus" active={viewFilters.smartFocus} onClick={() => handleToggleViewFilter('smartFocus')} />
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <SidebarSwitch label="Isolate course" checked={isolateCourse} onChange={setIsolateCourse} />
                    <SidebarSwitch label="Floating quiz card (exp)" checked={enableFloatingInfo} onChange={setEnableFloatingInfo} />
                  </div>
                </div>
              </SidebarSection>

              <SidebarSection
                title="Notes"
                isOpen={leftSectionsOpen.notes}
                onToggle={() => handleToggleLeftSection('notes')}
              >
                <div className="space-y-3">
                  <p className="text-xs text-white/50">Drop a quick note and pin it to the graph for this course.</p>
                  <div className="flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="New note..."
                      className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!noteDraft.trim()}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        noteDraft.trim()
                          ? 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'
                          : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                  {visibleNotes.length > 0 ? (
                    <div className="space-y-2">
                      {visibleNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70"
                        >
                          {note.label}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-white/35">No notes pinned yet.</div>
                  )}
                </div>
              </SidebarSection>

              <SidebarSection
                title="Graph Controls"
                isOpen={leftSectionsOpen.controls}
                onToggle={() => handleToggleLeftSection('controls')}
              >
                <div className="space-y-4">
                  <ControlSlider label="Repulsion" value={repulsion} set={setRepulsion} min={-1500} max={-200} step={20} />
                  <ControlSlider label="Float Intensity" value={floatIntensity} set={setFloatIntensity} min={0} max={20} step={1} />
                  <ControlSlider label="Gravity" value={gravity} set={setGravity} min={0} max={0.3} step={0.01} />
                  <ControlSlider label="Label Visibility Factor" value={labelThreshold} set={setLabelThreshold} min={0.3} max={2.8} step={0.1} />
                </div>
              </SidebarSection>
            </div>
          </div>
        </div>
      )}
      {showCourseLayout && (
        <div className="absolute right-0 top-0 h-full z-20 w-[360px] pointer-events-none">
          <div className="pointer-events-auto h-full flex flex-col gap-4" data-graph-panel>
            <CourseTreePanel
              className="mt-20 mx-6 flex-1"
              courses={COURSE_TREE}
              activeCourseId={selectedCourseId}
              openCourseIds={openCourseIds}
              openSectionIds={openSectionIds}
              onToggleCourse={handleToggleCourse}
              onToggleSection={handleToggleSection}
              onSelectCourse={(courseId) => handleSelectCourse(courseId, false)}
              onSelectQuiz={handleSelectQuiz}
            />
            {!enableFloatingInfo && (
              <div className="mx-6 mb-6">
                <QuizDetailPanel detail={activeQuizDetail} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
