import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ChevronDown, ChevronRight, Network, RotateCcw, Settings, Wand2 } from 'lucide-react';
import { Header } from '../Header';
import { useTheme } from '../theme';
import { FluidGlassLens } from '../FluidGlass';
import { DotGridLayer, ObsidianBackdrop } from './knowledge-graph-backgrounds';
import {
  BASE_GRAPH_DATA,
  COURSE_GRAPH_DATA,
  COURSE_GRAPH_ROOTS,
  COURSE_TREE,
  DEFAULT_COURSE_ID,
  GRAPH_COLORS,
  OBSIDIAN_ACCENT,
  QUIZ_DETAILS,
  RENDER_OPTIONS
} from './knowledge-graph-data';
import {
  ColorPicker,
  ControlSlider,
  CourseTreePanel,
  ExperimentalPanel,
  FloatingInfoCardSvg,
  ModeInfoCard,
  NodeDetailPanel,
  ObsidianInfoPanels,
  ObsidianSettingsPanel,
  QuizDetailPanel,
  SidebarOption,
  SidebarSection,
  SidebarSwitch
} from './knowledge-graph-panels';
import { GraphWebGLScene } from './knowledge-graph-webgl';
import { getNodeCentroid, getObsidianStyle, getObsidianVariantFromMode } from './knowledge-graph-utils';
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
  const { theme } = useTheme();
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
  const [enableFloatingInfo, setEnableFloatingInfo] = useState(true);
  const [enableWebglHoverPulse, setEnableWebglHoverPulse] = useState(true);
  const [enableWebglHighContrastLinks, setEnableWebglHighContrastLinks] = useState(false);
  const [enableShapeVariants, setEnableShapeVariants] = useState(false);
  const [enableQuizRings, setEnableQuizRings] = useState(false);
  const [disablePanelBlur, setDisablePanelBlur] = useState(false);
  const [hoverBounceStrength, setHoverBounceStrength] = useState(1.45);
  const [dotReturnSpeed, setDotReturnSpeed] = useState(0.5);
  const [dotSize, setDotSize] = useState(1.9);
  const [dotSpacing, setDotSpacing] = useState(28);
  const [dotProximity, setDotProximity] = useState(120);
  const [dotDisplaceStrength, setDotDisplaceStrength] = useState(0.5);
  const [dotDamping, setDotDamping] = useState(0.75);
  const [dotBaseOpacity, setDotBaseOpacity] = useState(0.7);
  const [dotActiveOpacity, setDotActiveOpacity] = useState(0.38);
  const [floatingInfoNodeId, setFloatingInfoNodeId] = useState<string | null>(null);
  const [graphColors, setGraphColors] = useState<string[]>(() => [...GRAPH_COLORS]);
  const [labelColor, setLabelColor] = useState('#0f172a');
  const [obsidianShowArrows, setObsidianShowArrows] = useState(false);
  const [obsidianTextFade, setObsidianTextFade] = useState(0.9);
  const [obsidianNodeScale, setObsidianNodeScale] = useState(1.2);
  const [obsidianLinkThickness, setObsidianLinkThickness] = useState(1.2);
  const [obsidianAnimate, setObsidianAnimate] = useState(true);
  const [obsidianAccentColor, setObsidianAccentColor] = useState(OBSIDIAN_ACCENT);
  const [obsidianNodeFill, setObsidianNodeFill] = useState('#cfcfcf');
  const [repulsion, setRepulsion] = useState(-1000);
  const [gravity, setGravity] = useState(0.1);
  const [floatIntensity, setFloatIntensity] = useState(5);
  const [linkDistance, setLinkDistance] = useState(80);
  const [collisionScale, setCollisionScale] = useState(1.7);
  const [alphaDecay, setAlphaDecay] = useState(0.02);
  const [labelThreshold, setLabelThreshold] = useState(0.8);
  const [labelScale, setLabelScale] = useState(1);
  const [geminiSizeScale, setGeminiSizeScale] = useState(0.75);
  const [geminiLinkWidth, setGeminiLinkWidth] = useState(2);
  const [geminiLinkOpacity, setGeminiLinkOpacity] = useState(0.28);
  const [geminiGlowOpacity, setGeminiGlowOpacity] = useState(0.16);
  const [geminiGlowSize, setGeminiGlowSize] = useState(1);
  const [geminiGlowBlur, setGeminiGlowBlur] = useState(10);
  const [geminiDimOpacity, setGeminiDimOpacity] = useState(0.25);
  const [geminiDimBlur, setGeminiDimBlur] = useState(1.5);
  const [geminiDimLinkOpacity, setGeminiDimLinkOpacity] = useState(0.05);
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
    experimental: false,
    classes: true,
    view: true,
    notes: true,
    colors: true,
    simulation: true,
    visuals: false,
    interactiveBackground: false,
    focus: false,
    obsidian: false
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
  const floatingInfoDismissedIdRef = useRef<string | null>(null);
  const isolatePositionCacheRef = useRef(new Map<string, { x: number; y: number; vx: number; vy: number }>());
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
  const courseByRootId = useMemo(() => {
    const map = new Map<string, (typeof COURSE_TREE)[number]>();
    COURSE_TREE.forEach((course) => {
      const rootId = COURSE_GRAPH_ROOTS[course.id];
      if (rootId) map.set(rootId, course);
    });
    return map;
  }, []);
  const isolatedNodeIds = useMemo(() => {
    if (!isolateCourse) return null;
    const anchorId = activeNode?.id ?? COURSE_GRAPH_ROOTS[selectedCourseId] ?? selectedCourse?.id;
    if (!anchorId) return null;
    const ids = new Set<string>();
    const queue = [anchorId];
    ids.add(anchorId);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const neighbors = neighborMap.get(current);
      if (!neighbors) continue;
      neighbors.forEach((neighbor) => {
        if (!ids.has(neighbor)) {
          ids.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    return ids;
  }, [isolateCourse, activeNode, selectedCourseId, selectedCourse, neighborMap]);
  const renderNodes = useMemo(
    () => (isolatedNodeIds ? nodes.filter((node) => isolatedNodeIds.has(node.id)) : nodes),
    [nodes, isolatedNodeIds]
  );
  const renderLinks = useMemo(() => {
    if (!isolatedNodeIds) return links;
    return links.filter((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return isolatedNodeIds.has(sourceId) && isolatedNodeIds.has(targetId);
    });
  }, [links, isolatedNodeIds]);
  const visibleNotes = useMemo(
    () => customNotes.filter((note) => note.courseId === selectedCourseId),
    [customNotes, selectedCourseId]
  );

  const isolateAccent = useMemo(() => {
    const anchorCourseId = activeNode?.courseId ?? selectedCourseId;
    const anchorCourse = COURSE_TREE.find((course) => course.id === anchorCourseId) ?? selectedCourse;
    return graphColors[anchorCourse?.group ?? 0] || '#8E8E93';
  }, [activeNode, selectedCourseId, selectedCourse, graphColors]);
  const getColor = (group: number) => (isolateCourse ? isolateAccent : graphColors[group] || '#8E8E93');
  const isObsidianMode = renderMode.startsWith('obsidian-');
  const isWebglMode = renderMode.endsWith('-webgl');
  const isLightTheme = theme === 'light';
  const panelTone = isLightTheme ? 'light' : 'dark';
  const obsidianVariant = getObsidianVariantFromMode(renderMode);
  const obsidianStyle = useMemo(() => {
    if (!obsidianVariant) return null;
    const base = getObsidianStyle(obsidianVariant);
    const toneOverrides =
      renderMode === 'obsidian-v1-svg'
        ? {
            linkBase: 'rgba(15,23,42,0.18)',
            linkDim: 'rgba(15,23,42,0.06)',
            labelOpacity: 0.82
          }
        : {};
    return {
      ...base,
      ...toneOverrides,
      accent: obsidianAccentColor,
      nodeFill: obsidianNodeFill,
      nodeRadiusBase: base.nodeRadiusBase * obsidianNodeScale,
      nodeRadiusStep: base.nodeRadiusStep * obsidianNodeScale,
      linkWidth: base.linkWidth * obsidianLinkThickness,
      linkHoverWidth: base.linkHoverWidth * obsidianLinkThickness
    };
  }, [obsidianVariant, obsidianNodeScale, obsidianLinkThickness, obsidianAccentColor, obsidianNodeFill, renderMode]);

  useEffect(() => {
    if (isLightTheme) {
      if (labelColor === '#ffffff') setLabelColor('#0f172a');
      if (renderMode === 'obsidian-v1-svg' && obsidianNodeFill === '#cfcfcf') {
        setObsidianNodeFill('rgba(15,23,42,0.85)');
      }
      return;
    }

    if (labelColor === '#0f172a') setLabelColor('#ffffff');
    if (obsidianNodeFill === 'rgba(15,23,42,0.85)') {
      setObsidianNodeFill('#cfcfcf');
    }
  }, [isLightTheme, renderMode, labelColor, obsidianNodeFill]);

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
    graphColors,
    renderMode,
    isObsidianMode,
    isLightTheme,
    obsidianVariant,
    obsidianStyle,
    obsidianShowArrows,
    obsidianAnimate,
    obsidianTextFade,
    enableShapeVariants,
    enableQuizRings,
    enableHoverBounce: enableWebglHoverPulse,
    hoverBounceStrength,
    labelThreshold,
    labelScale,
    labelColor,
    geminiSizeScale,
    geminiLinkWidth,
    geminiLinkOpacity,
    geminiGlowOpacity,
    geminiGlowSize,
    geminiGlowBlur,
    geminiDimOpacity,
    geminiDimBlur,
    geminiDimLinkOpacity,
    repulsion,
    gravity,
    linkDistance,
    collisionScale,
    alphaDecay,
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
    nodes: renderNodes,
    links: renderLinks,
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
    if (enableFloatingInfo && activeNode && !floatingInfoNodeId && floatingInfoDismissedIdRef.current !== activeNode.id) {
      setFloatingInfoNodeId(activeNode.id);
    }
  }, [enableFloatingInfo, activeNode, floatingInfoNodeId]);

  useEffect(() => {
    if (!enableFloatingInfo) {
      floatingInfoDismissedIdRef.current = null;
      return;
    }
    if (activeNode && floatingInfoDismissedIdRef.current && activeNode.id !== floatingInfoDismissedIdRef.current) {
      floatingInfoDismissedIdRef.current = null;
    }
  }, [enableFloatingInfo, activeNode]);

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
      floatingInfoDismissedIdRef.current = null;
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
    floatingInfoDismissedIdRef.current = null;
    setFloatingInfoNodeId(null);
  };

  const handleCloseFloatingInfo = () => {
    if (floatingInfoNodeId) {
      floatingInfoDismissedIdRef.current = floatingInfoNodeId;
    }
    setFloatingInfoNodeId(null);
  };

  const resetView = () => {
    clearSelection();
    if (isWebglMode && containerRef.current) {
      const width = sizeRef.current.width || containerRef.current.clientWidth || 600;
      const height = sizeRef.current.height || containerRef.current.clientHeight || 420;
      const centroid = getNodeCentroid(renderNodes);
      const nextTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(baseScale)
        .translate(-centroid.x, -centroid.y);
      transformRef.current = nextTransform;
      currentScaleRef.current = nextTransform.k;
      webglTransformInitializedRef.current = true;
      return;
    }
    if (svgRef.current && zoomRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth || 600;
      const height = containerRef.current.clientHeight || 420;
      const centroid = getNodeCentroid(renderNodes);
      const nextTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(baseScale)
        .translate(-centroid.x, -centroid.y);
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
  const showHeader = isFullscreen;
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
  const activeNodeCourse = useMemo(() => {
    if (!activeNode) return null;
    if (activeNode.courseId) {
      return COURSE_TREE.find((course) => course.id === activeNode.courseId) ?? null;
    }
    return courseByRootId.get(activeNode.id) ?? null;
  }, [activeNode, courseByRootId]);
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date()),
    []
  );
  const topRightControlsPosition = showCourseLayout ? 'top-20 right-[380px]' : isFullscreen ? 'top-20 right-8' : 'top-3 right-3';
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
  const handleGraphColorChange = (index: number, value: string) => {
    setGraphColors((prev) => prev.map((color, idx) => (idx === index ? value : color)));
  };
  const handleToggleViewFilter = (key: keyof typeof viewFilters) => {
    setViewFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const handleToggleIsolate = () => {
    if (!isolateCourse) {
      const cache = new Map<string, { x: number; y: number; vx: number; vy: number }>();
      nodes.forEach((node) => {
        if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
          cache.set(node.id, {
            x: node.x ?? 0,
            y: node.y ?? 0,
            vx: node.vx ?? 0,
            vy: node.vy ?? 0
          });
        }
      });
      isolatePositionCacheRef.current = cache;
      setIsolateCourse(true);
      return;
    }

    isolatePositionCacheRef.current.forEach((position, nodeId) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      node.x = position.x;
      node.y = position.y;
      node.vx = position.vx;
      node.vy = position.vy;
    });
    isolatePositionCacheRef.current = new Map();
    setIsolateCourse(false);
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
      className={`relative w-full h-full overflow-hidden ${
        isLightTheme ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900' : 'bg-[#050505] text-[#F5F5F7]'
      } ${isFullscreen ? 'rounded-none' : 'rounded-[1.25rem]'} ${className}`}
    >
      {showHeader && (
        <div className="absolute inset-x-0 top-0 z-[60]" data-graph-ui>
          <Header mode="graph" onNavigateHome={onExit} dateLabel={todayLabel} />
        </div>
      )}
      {showDotGrid && (
        <DotGridLayer
          tone={isLightTheme ? 'light' : 'dark'}
          returnSpeed={dotReturnSpeed}
          dotSize={dotSize}
          dotSpacing={dotSpacing}
          proximity={dotProximity}
          displaceStrength={dotDisplaceStrength}
          damping={dotDamping}
          baseOpacity={dotBaseOpacity}
          activeOpacity={dotActiveOpacity}
        />
      )}
      {showObsidianBackdrop && (
        <ObsidianBackdrop
          variant={obsidianVariant ?? 'obsidian-v1'}
          tone={isLightTheme ? 'light' : 'dark'}
        />
      )}
      <div className="absolute inset-0 z-10" ref={containerRef} onClick={handleCanvasClick}>
        <div className={`absolute ${topRightControlsPosition} z-50 flex gap-3 pointer-events-none`} data-graph-ui>
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
                className={`flex items-center gap-3 px-4 py-2 rounded-full text-[11px] font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isLightTheme
                    ? 'text-slate-700 bg-white/90 border border-slate-200 shadow-lg hover:text-slate-900 hover:bg-slate-100'
                    : 'text-white/80 bg-white/10 border border-white/20 shadow-sm hover:text-white hover:bg-white/20'
                }`}
                aria-expanded={isRenderMenuOpen}
                aria-haspopup="listbox"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className={isLightTheme ? 'text-[9px] uppercase tracking-[0.3em] text-slate-400' : 'text-[9px] uppercase tracking-[0.3em] text-white/40'}>Render</span>
                  <div className="flex items-center gap-2">
                    <span className={isLightTheme ? 'text-xs font-semibold text-slate-900' : 'text-xs font-semibold text-white'}>{renderModeLabel}</span>
                    <span className={isLightTheme ? 'inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500' : 'inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/60'}>
                      {renderModeTag}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`${isLightTheme ? 'text-slate-400' : 'text-white/50'} transition-transform duration-300 ${isRenderMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isRenderMenuOpen && (
                <div
                  role="listbox"
                  className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 space-y-1 ${
                    isLightTheme ? 'bg-white/90 backdrop-blur-2xl border-slate-200' : 'bg-[#0f0f12]/90 backdrop-blur-2xl border-white/10'
                  }`}
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
                          isSelected
                            ? isLightTheme
                              ? 'bg-slate-100 text-slate-900'
                              : 'bg-white/10 text-white'
                            : isLightTheme
                              ? 'text-slate-600 hover:bg-slate-100/70'
                              : 'text-white/70 hover:bg-white/5'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold">{option.label}</span>
                          <span className={isLightTheme ? 'mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500' : 'mt-1 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/60'}>
                            {option.tag}
                          </span>
                          <span className={isLightTheme ? 'mt-1 text-[10px] text-slate-400' : 'mt-1 text-[10px] text-white/35'}>{option.description}</span>
                        </div>
                        {isSelected && (
                          <span className={isLightTheme ? 'text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400' : 'text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50'}>Selected</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div
            className={`pointer-events-auto flex backdrop-blur-xl ${
              isLightTheme ? 'bg-white/90 border border-slate-200 shadow-lg' : 'bg-white/10 border border-white/15 shadow-2xl'
            } ${isFullscreen ? 'rounded-2xl p-1.5' : 'rounded-xl p-1'}`}
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                resetView();
              }}
              className={`${isFullscreen ? 'p-3 rounded-xl' : 'p-2 rounded-lg'} ${
                isLightTheme ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900' : 'hover:bg-white/10 text-white/70 hover:text-white'
              } transition-colors`}
              aria-label="Reset view"
            >
              <RotateCcw size={isFullscreen ? 18 : 16} />
            </button>
            {showCourseSidebar && (
              <>
                <div className={`w-px h-6 mx-1 self-center ${isLightTheme ? 'bg-slate-200' : 'bg-white/10'}`} />
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPanelOpen(true);
                  }}
                  className={`p-3 rounded-xl transition-colors ${
                    isLightTheme ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900' : 'hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                  aria-label="Open settings panel"
                >
                  <Settings size={18} />
                </button>
              </>
            )}
            {showObsidianPanels && (
              <>
                <div className={`w-px h-6 mx-1 self-center ${isLightTheme ? 'bg-slate-200' : 'bg-white/10'}`} />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsObsidianSettingsOpen((prev) => !prev);
                    }}
                    className={`p-3 rounded-xl transition-colors ${
                      isLightTheme ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900' : 'hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
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
                      className={`p-3 rounded-xl transition-colors ${
                        isLightTheme ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
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
                enableShapeVariants={enableShapeVariants}
                setEnableShapeVariants={setEnableShapeVariants}
                enableQuizRings={enableQuizRings}
                setEnableQuizRings={setEnableQuizRings}
                disablePanelBlur={disablePanelBlur}
                setDisablePanelBlur={setDisablePanelBlur}
                enableWebglHighContrastLinks={enableWebglHighContrastLinks}
                setEnableWebglHighContrastLinks={setEnableWebglHighContrastLinks}
                solid={disablePanelBlur}
                tone={panelTone}
              />
            </div>
            {showObsidianPanels && (
              <div className="pointer-events-auto" data-graph-panel>
                <ObsidianInfoPanels
                  activeNode={activeNode}
                  neighbors={activeNode ? Array.from(neighborMap.get(activeNode.id) ?? []) : []}
                  solid={disablePanelBlur}
                  tone={panelTone}
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
                solid={disablePanelBlur}
                tone={panelTone}
              />
            </div>
          )}
          {!showCourseLayout && (
            <ModeInfoCard
              label={renderModeLabel}
              tag={renderModeTag}
              detail={renderModeDetail}
              solid={disablePanelBlur}
              tone={panelTone}
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
              onClose={handleCloseFloatingInfo}
              solid={disablePanelBlur}
              tone={panelTone}
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
              nodes={renderNodes}
              links={renderLinks}
              nodeMap={nodeMap}
              nodeDegreeMap={nodeDegreeMap}
              neighborMap={neighborMap}
              graphColors={graphColors}
              activeNode={activeNode}
              hoveredNodeRef={hoveredNodeRef}
              getColor={getColor}
              currentScaleRef={currentScaleRef}
              floatIntensityRef={floatIntensityRef}
              obsidianVariant={obsidianVariant}
              obsidianStyle={obsidianStyle}
              obsidianTextFade={obsidianTextFade}
              obsidianAnimate={obsidianAnimate}
              geminiSizeScale={geminiSizeScale}
              hoverBounceStrength={hoverBounceStrength}
              sizeRef={sizeRef}
              transformRef={transformRef}
              getNodeVisibilityThreshold={getNodeVisibilityThreshold}
              enableWebglHoverPulse={enableWebglHoverPulse}
              enableWebglHighContrastLinks={enableWebglHighContrastLinks}
            />
          </FluidGlassLens>
        )}
        <div className={`absolute ${isFullscreen ? 'bottom-8 left-8' : 'bottom-3 left-4'} pointer-events-none ${isLightTheme ? 'opacity-80' : 'opacity-50'}`}>
          <div className={isLightTheme ? 'text-[9px] font-black uppercase tracking-[0.3em] text-slate-500' : 'text-[9px] font-black uppercase tracking-[0.3em] text-white/40'}>
            {isFullscreen ? 'University Graph v5.2' : 'University Graph'}
          </div>
        </div>
      </div>
      {showCourseSidebar && (
        <div
          className={`absolute left-0 top-0 h-full z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col ${isPanelOpen ? 'w-[340px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}`}
          data-graph-panel
        >
          <div
            className={`flex-1 mx-6 mb-6 mt-20 rounded-[28px] shadow-2xl flex flex-col overflow-hidden ${
              isLightTheme
                ? `${disablePanelBlur ? 'bg-white' : 'bg-white/90 backdrop-blur-2xl'} border border-slate-200`
                : `border border-white/[0.12] ${disablePanelBlur ? 'bg-[#101114]' : 'bg-white/[0.06] backdrop-blur-2xl'}`
            }`}
          >
            <div className={`px-6 pt-6 pb-4 flex items-center justify-between ${isLightTheme ? 'border-b border-slate-200' : 'border-b border-white/10'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Network size={20} className="text-white" />
                </div>
                <div>
                  <h1 className={isLightTheme ? 'text-lg font-semibold tracking-tight text-slate-900' : 'text-lg font-semibold tracking-tight'}>My Map</h1>
                  <p className={isLightTheme ? 'text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none mt-0.5' : 'text-[10px] text-white/40 font-semibold uppercase tracking-widest leading-none mt-0.5'}>
                    Course Navigator
                  </p>
                </div>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setIsPanelOpen(false);
                }}
                className={`p-2 rounded-full transition-all ${isLightTheme ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
              >
                <ChevronRight size={20} className={isLightTheme ? 'rotate-180 text-slate-500' : 'rotate-180 text-white/50'} />
              </button>
            </div>

            <div className="flex-1 px-6 py-6 overflow-y-auto custom-scrollbar space-y-6">
              <SidebarSection
                title="Experimental"
                isOpen={leftSectionsOpen.experimental}
                onToggle={() => handleToggleLeftSection('experimental')}
                tone={panelTone}
              >
                <div className="space-y-2">
                  <SidebarSwitch label="Floating course card" checked={enableFloatingInfo} onChange={setEnableFloatingInfo} tone={panelTone} />
                  <SidebarSwitch label="Hover bounce" checked={enableWebglHoverPulse} onChange={setEnableWebglHoverPulse} tone={panelTone} />
                  <SidebarSwitch label="Alternate node shapes" checked={enableShapeVariants} onChange={setEnableShapeVariants} tone={panelTone} />
                  <SidebarSwitch label="Quiz rings" checked={enableQuizRings} onChange={setEnableQuizRings} tone={panelTone} />
                  <SidebarSwitch label="Solid panels (no blur)" checked={disablePanelBlur} onChange={setDisablePanelBlur} tone={panelTone} />
                  <SidebarSwitch
                    label="WebGL high-contrast links"
                    checked={enableWebglHighContrastLinks}
                    onChange={setEnableWebglHighContrastLinks}
                    tone={panelTone}
                  />
                </div>
              </SidebarSection>
              <SidebarSection
                title="Colors & Palette"
                isOpen={leftSectionsOpen.colors}
                onToggle={() => handleToggleLeftSection('colors')}
                tone={panelTone}
              >
                <div className="space-y-3">
                  <div className={isLightTheme ? 'text-[10px] uppercase tracking-[0.2em] text-slate-400' : 'text-[10px] uppercase tracking-[0.2em] text-white/35'}>Clusters</div>
                  <div className="space-y-2">
                    {graphColors.map((color, index) => (
                      <ColorPicker
                        key={`group-color-${index}`}
                        label={`Group ${index + 1}`}
                        value={color}
                        onChange={(value) => handleGraphColorChange(index, value)}
                        tone={panelTone}
                      />
                    ))}
                  </div>
                  <div className={`pt-3 space-y-2 ${isLightTheme ? 'border-t border-slate-200' : 'border-t border-white/10'}`}>
                    <ColorPicker label="Label color" value={labelColor} onChange={setLabelColor} tone={panelTone} />
                  </div>
                </div>
              </SidebarSection>
              <SidebarSection
                title="Class Selection"
                isOpen={leftSectionsOpen.classes}
                onToggle={() => handleToggleLeftSection('classes')}
                tone={panelTone}
              >
                <div className="space-y-2">
                  {COURSE_TREE.map((course) => {
                    const isActive = selectedCourseId === course.id;
                    const accent = graphColors[course.group] || '#8E8E93';
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => handleSelectCourse(course.id)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? isLightTheme
                              ? 'bg-slate-100 text-slate-900'
                              : 'bg-white/10 text-white'
                            : isLightTheme
                              ? 'text-slate-600 hover:bg-slate-100/70'
                              : 'text-white/60 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
                          <span>{course.label}</span>
                        </div>
                        <ChevronRight size={16} className={`${isLightTheme ? 'text-slate-400' : 'text-white/40'} transition-transform ${isActive ? 'rotate-90' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </SidebarSection>

              <SidebarSection
                title="View Options"
                isOpen={leftSectionsOpen.view}
                onToggle={() => handleToggleLeftSection('view')}
                tone={panelTone}
              >
                <div className="space-y-2">
                  <SidebarOption label="Study now" active={viewFilters.studyNow} onClick={() => handleToggleViewFilter('studyNow')} tone={panelTone} />
                  <SidebarOption label="What's done" active={viewFilters.whatsDone} onClick={() => handleToggleViewFilter('whatsDone')} tone={panelTone} />
                  <SidebarOption label="Full view" active={viewFilters.fullView} onClick={() => handleToggleViewFilter('fullView')} tone={panelTone} />
                  <SidebarOption label="Smart focus" active={viewFilters.smartFocus} onClick={() => handleToggleViewFilter('smartFocus')} tone={panelTone} />
                  <div className={`pt-3 space-y-2 ${isLightTheme ? 'border-t border-slate-200' : 'border-t border-white/10'}`}>
                    <button
                      type="button"
                      onClick={handleToggleIsolate}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        isolateCourse
                          ? isLightTheme
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-white/12 text-white'
                          : isLightTheme
                            ? 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <span>{isolateCourse ? 'Show all courses' : 'Isolate course'}</span>
                      <span className={isLightTheme ? 'text-[9px] uppercase tracking-[0.2em] text-slate-400' : 'text-[9px] uppercase tracking-[0.2em] text-white/40'}>
                        {isolateCourse ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>
                </div>
              </SidebarSection>

              <SidebarSection
                title="Notes"
                isOpen={leftSectionsOpen.notes}
                onToggle={() => handleToggleLeftSection('notes')}
                tone={panelTone}
              >
                <div className="space-y-3">
                  <p className={isLightTheme ? 'text-xs text-slate-500' : 'text-xs text-white/50'}>
                    Drop a quick note and pin it to the graph for this course.
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="New note..."
                      className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLightTheme
                          ? 'bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-slate-300'
                          : 'bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:border-white/30'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!noteDraft.trim()}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        noteDraft.trim()
                          ? isLightTheme
                            ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                            : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'
                          : isLightTheme
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
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
                          className={isLightTheme ? 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600' : 'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70'}
                        >
                          {note.label}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={isLightTheme ? 'text-[11px] text-slate-400' : 'text-[11px] text-white/35'}>No notes pinned yet.</div>
                  )}
                </div>
              </SidebarSection>

              <SidebarSection
                title="Simulation"
                isOpen={leftSectionsOpen.simulation}
                onToggle={() => handleToggleLeftSection('simulation')}
                tone={panelTone}
              >
                <div className="space-y-4">
                  <ControlSlider label="Repulsion" value={repulsion} set={setRepulsion} min={-1500} max={-200} step={20} tone={panelTone} />
                  <ControlSlider label="Link Distance" value={linkDistance} set={setLinkDistance} min={40} max={140} step={2} tone={panelTone} />
                  <ControlSlider label="Collision Scale" value={collisionScale} set={setCollisionScale} min={1} max={3} step={0.1} tone={panelTone} />
                  <ControlSlider label="Float Intensity" value={floatIntensity} set={setFloatIntensity} min={0} max={20} step={1} tone={panelTone} />
                  <ControlSlider label="Gravity" value={gravity} set={setGravity} min={0} max={0.3} step={0.01} tone={panelTone} />
                  <ControlSlider label="Alpha Decay" value={alphaDecay} set={setAlphaDecay} min={0.005} max={0.08} step={0.005} tone={panelTone} />
                </div>
              </SidebarSection>

              <SidebarSection
                title="Visuals"
                isOpen={leftSectionsOpen.visuals}
                onToggle={() => handleToggleLeftSection('visuals')}
                tone={panelTone}
              >
                <div className="space-y-4">
                  <ControlSlider label="Node Size Scale" value={geminiSizeScale} set={setGeminiSizeScale} min={0.4} max={1.2} step={0.05} tone={panelTone} />
                  <ControlSlider label="Link Thickness" value={geminiLinkWidth} set={setGeminiLinkWidth} min={1.2} max={3.5} step={0.1} tone={panelTone} />
                  <ControlSlider label="Link Opacity" value={geminiLinkOpacity} set={setGeminiLinkOpacity} min={0.1} max={0.9} step={0.05} tone={panelTone} />
                  <ControlSlider label="Glow Intensity" value={geminiGlowOpacity} set={setGeminiGlowOpacity} min={0.05} max={0.45} step={0.01} tone={panelTone} />
                  <ControlSlider label="Glow Size" value={geminiGlowSize} set={setGeminiGlowSize} min={0.6} max={1.8} step={0.05} tone={panelTone} />
                  <ControlSlider label="Glow Blur" value={geminiGlowBlur} set={setGeminiGlowBlur} min={4} max={20} step={1} tone={panelTone} />
                  <ControlSlider label="Hover Bounce Strength" value={hoverBounceStrength} set={setHoverBounceStrength} min={1} max={2.4} step={0.05} tone={panelTone} />
                </div>
              </SidebarSection>

              <SidebarSection
                title="Interactive Background"
                isOpen={leftSectionsOpen.interactiveBackground}
                onToggle={() => handleToggleLeftSection('interactiveBackground')}
                tone={panelTone}
              >
                <div className="space-y-4">
                  <ControlSlider label="Dot Size" value={dotSize} set={setDotSize} min={1} max={6} step={0.5} tone={panelTone} />
                  <ControlSlider label="Dot Spacing" value={dotSpacing} set={setDotSpacing} min={12} max={40} step={1} tone={panelTone} />
                  <ControlSlider label="Dot Proximity" value={dotProximity} set={setDotProximity} min={40} max={220} step={5} tone={panelTone} />
                  <ControlSlider label="Return Speed" value={dotReturnSpeed} set={setDotReturnSpeed} min={0.05} max={0.9} step={0.01} tone={panelTone} />
                  <ControlSlider label="Displace Strength" value={dotDisplaceStrength} set={setDotDisplaceStrength} min={0.1} max={1.2} step={0.05} tone={panelTone} />
                  <ControlSlider label="Damping" value={dotDamping} set={setDotDamping} min={0.5} max={0.95} step={0.01} tone={panelTone} />
                  <ControlSlider label="Base Opacity" value={dotBaseOpacity} set={setDotBaseOpacity} min={0} max={1} step={0.01} tone={panelTone} />
                  <ControlSlider label="Active Opacity" value={dotActiveOpacity} set={setDotActiveOpacity} min={0.1} max={0.9} step={0.01} tone={panelTone} />
                </div>
              </SidebarSection>

              {renderMode === 'obsidian-v1-svg' && (
                <SidebarSection
                  title="Obsidian V1 Controls"
                  isOpen={leftSectionsOpen.obsidian}
                  onToggle={() => handleToggleLeftSection('obsidian')}
                  tone={panelTone}
                >
                  <div className="space-y-3">
                    <SidebarSwitch label="Animate drift" checked={obsidianAnimate} onChange={setObsidianAnimate} tone={panelTone} />
                    <SidebarSwitch label="Show arrows" checked={obsidianShowArrows} onChange={setObsidianShowArrows} tone={panelTone} />
                    <ControlSlider label="Text fade threshold" value={obsidianTextFade} set={setObsidianTextFade} min={0.4} max={3.2} step={0.1} tone={panelTone} />
                    <ControlSlider label="Node scale" value={obsidianNodeScale} set={setObsidianNodeScale} min={0.8} max={2.4} step={0.1} tone={panelTone} />
                    <ControlSlider label="Link thickness" value={obsidianLinkThickness} set={setObsidianLinkThickness} min={0.8} max={3.0} step={0.1} tone={panelTone} />
                    <div className={`pt-2 space-y-2 ${isLightTheme ? 'border-t border-slate-200' : 'border-t border-white/10'}`}>
                      <ColorPicker label="Accent color" value={obsidianAccentColor} onChange={setObsidianAccentColor} tone={panelTone} />
                      <ColorPicker label="Node fill" value={obsidianNodeFill} onChange={setObsidianNodeFill} tone={panelTone} />
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerObsidianAnimation()}
                      className={`w-full mt-2 rounded-xl text-xs font-semibold py-2 transition-colors ${
                        isLightTheme
                          ? 'bg-slate-900 border border-slate-900 text-white hover:bg-slate-800'
                          : 'bg-white/10 border border-white/15 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      Animate layout
                    </button>
                  </div>
                </SidebarSection>
              )}

              <SidebarSection
                title="Focus & Labels"
                isOpen={leftSectionsOpen.focus}
                onToggle={() => handleToggleLeftSection('focus')}
                tone={panelTone}
              >
                <div className="space-y-4">
                  <ControlSlider label="Dim Opacity" value={geminiDimOpacity} set={setGeminiDimOpacity} min={0.1} max={0.7} step={0.05} tone={panelTone} />
                  <ControlSlider label="Dim Blur" value={geminiDimBlur} set={setGeminiDimBlur} min={0} max={4} step={0.1} tone={panelTone} />
                  <ControlSlider label="Dim Link Opacity" value={geminiDimLinkOpacity} set={setGeminiDimLinkOpacity} min={0.02} max={0.3} step={0.01} tone={panelTone} />
                  <ControlSlider label="Label Visibility Factor" value={labelThreshold} set={setLabelThreshold} min={0.3} max={2.8} step={0.1} tone={panelTone} />
                  <ControlSlider label="Label Size" value={labelScale} set={setLabelScale} min={0.7} max={1.6} step={0.05} tone={panelTone} />
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
              solid={disablePanelBlur}
              graphColors={graphColors}
              tone={panelTone}
            />
            {!enableFloatingInfo && (
              <div className="mx-6 mb-6 space-y-3">
                <QuizDetailPanel detail={activeQuizDetail} solid={disablePanelBlur} tone={panelTone} />
                <NodeDetailPanel
                  node={activeNode?.type === 'quiz' ? null : activeNode}
                  course={activeNodeCourse}
                  solid={disablePanelBlur}
                  tone={panelTone}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
