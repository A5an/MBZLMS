import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import * as d3 from 'd3';
import { GRAPH_COLORS, QUIZ_STATUS_STYLES } from './knowledge-graph-data';
import type { GraphLink, GraphNode, ObsidianStyle, ObsidianVariant, RenderMode } from './knowledge-graph-types';

interface UseKnowledgeGraphSvgParams {
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  neighborMap: Map<string, Set<string>>;
  nodeDegreeMap: Map<string, number>;
  renderMode: RenderMode;
  isObsidianMode: boolean;
  obsidianVariant: ObsidianVariant | null;
  obsidianStyle: ObsidianStyle | null;
  obsidianShowArrows: boolean;
  obsidianAnimate: boolean;
  obsidianTextFade: number;
  labelThreshold: number;
  repulsion: number;
  gravity: number;
  baseScale: number;
  isFullscreen: boolean;
  isWebglMode: boolean;
  activeNode: GraphNode | null;
  isolatedNodeIds: Set<string> | null;
  getNodeVisibilityThreshold: (node: GraphNode) => number;
  getColor: (group: number) => string;
  setSelectedCourseId: Dispatch<SetStateAction<string>>;
  setOpenCourseIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  setOpenSectionIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  setActiveNode: Dispatch<SetStateAction<GraphNode | null>>;
  setHoveredNode: Dispatch<SetStateAction<GraphNode | null>>;
  setFloatingInfoNodeId: Dispatch<SetStateAction<string | null>>;
  floatingInfoEnabledRef: MutableRefObject<boolean>;
  activeNodeRef: MutableRefObject<GraphNode | null>;
  hoveredNodeRef: MutableRefObject<GraphNode | null>;
  labelThresholdRef: MutableRefObject<number>;
  floatIntensityRef: MutableRefObject<number>;
  currentScaleRef: MutableRefObject<number>;
  transformRef: MutableRefObject<d3.ZoomTransform>;
  sizeRef: MutableRefObject<{ width: number; height: number }>;
  svgRef: RefObject<SVGSVGElement>;
  containerRef: RefObject<HTMLDivElement>;
  simulationRef: MutableRefObject<d3.Simulation<GraphNode, undefined> | null>;
  zoomRef: MutableRefObject<d3.ZoomBehavior<Element, unknown> | null>;
  gRef: MutableRefObject<d3.Selection<SVGGElement, unknown, null, undefined> | null>;
  nodeSelectionRef: MutableRefObject<d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null>;
  linkSelectionRef: MutableRefObject<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null>;
}

export const useKnowledgeGraphSvg = ({
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
}: UseKnowledgeGraphSvgParams) => {
  const obsidianAnimationTimeoutRef = useRef<number[]>([]);

  const updateLabels = () => {
    if (!gRef.current) return;
    const labels = gRef.current.selectAll<SVGTextElement, GraphNode>('text.node-label');
    const nextOpacity = function (this: SVGTextElement, d: GraphNode) {
      const parent = d3.select(this.parentNode as SVGGElement);
      if (parent.classed('node-outside')) return 0;
      if (parent.classed('node-hovered') || parent.classed('node-active') || parent.classed('node-related')) return 1;
      if (isObsidianMode) {
        if (!obsidianStyle) return 0;
        return currentScaleRef.current >= obsidianTextFade ? obsidianStyle.labelOpacity : 0;
      }
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
    return () => {
      obsidianAnimationTimeoutRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      obsidianAnimationTimeoutRef.current = [];
    };
  }, []);

  useEffect(() => {
    labelThresholdRef.current = labelThreshold;
    if (gRef.current) updateLabels();
  }, [labelThreshold]);

  useEffect(() => {
    if (gRef.current) updateLabels();
  }, [renderMode]);

  useEffect(() => {
    if (gRef.current) updateLabels();
  }, [obsidianTextFade, obsidianStyle]);

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
    const useCourseGlyphs = renderMode === 'gemini-v1-svg' || renderMode === 'obsidian-v1-svg';
    const geminiSizeScale = 0.75;
    const getGeminiCoreRadius = (value: number) => 2 + value * geminiSizeScale;
    const getGeminiGlowRadius = (value: number) => getGeminiCoreRadius(value) + 8;
    const getGeminiHitRadius = (value: number) => getGeminiCoreRadius(value) + 12;
    const getGeminiLabelOffset = (value: number) => getGeminiCoreRadius(value) + 12;
    const getGeminiHoverGlow = (value: number) => getGeminiCoreRadius(value) * 2.9;
    const getGeminiHoverCore = (value: number) => getGeminiCoreRadius(value) * 1.35;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

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

    if (isObsidianMode && obsidianShowArrows) {
      defs
        .append('marker')
        .attr('id', 'obsidian-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 12)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'rgba(255,255,255,0.6)');
    }

    if (useCourseGlyphs) {
      Object.entries(QUIZ_STATUS_STYLES).forEach(([status, style]) => {
        const filter = defs.append('filter')
          .attr('id', `quiz-glow-${status}`)
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%');
        filter.append('feDropShadow')
          .attr('dx', 0)
          .attr('dy', 0)
          .attr('stdDeviation', 4)
          .attr('flood-color', style.color)
          .attr('flood-opacity', 0.7);
      });
      const noteGlow = defs.append('filter')
        .attr('id', 'note-glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
      noteGlow.append('feDropShadow')
        .attr('dx', 0)
        .attr('dy', 0)
        .attr('stdDeviation', 6)
        .attr('flood-color', 'rgba(255,255,255,0.6)')
        .attr('flood-opacity', 0.7);
    }

    const g = svg.append('g').attr('class', 'graph-container');
    gRef.current = g as d3.Selection<SVGGElement, unknown, null, undefined>;

    if (!isObsidianMode) {
      svg.append('style').text(`
        .graph-container.in-focus-mode .node-group:not(.node-active) { opacity: 0.35; filter: blur(1.5px); transition: opacity 0.5s, filter 0.5s; }
        .graph-container.in-focus-mode .visible-link:not(.link-active) { stroke-opacity: 0.08; transition: stroke-opacity 0.5s; }
        .node-group.node-active, .node-group.node-hovered { opacity: 1; filter: url(#drop-shadow); }
        .visible-link.link-active, .visible-link.link-hovered { stroke-opacity: 1; stroke-width: 2.4px; }
        .node-glow { transition: r 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .node-core { transition: r 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `);
    }

    const zoom = d3.zoom<Element, unknown>()
      .scaleExtent([isFullscreen ? 0.4 : 0.5, isFullscreen ? 3.5 : 2.5])
      .on('zoom', (event) => {
        const transform = event.transform;
        transformRef.current = transform;
        currentScaleRef.current = transform.k;
        g.attr('transform', transform.toString());
        if (floatingInfoEnabledRef.current) updateLabels();
      });

    zoomRef.current = zoom;

    svg.call(zoom as d3.ZoomBehavior<SVGSVGElement, unknown>);

    const nextTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(baseScale);
    svg.call(zoom.transform, nextTransform);
    transformRef.current = nextTransform;
    currentScaleRef.current = nextTransform.k;

    const linkHitArea = g.append('g').attr('class', 'link-hit-area');
    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const visibleNodes = nodes.filter((node) => {
      if (!isolatedNodeIds) return true;
      return isolatedNodeIds.has(node.id);
    });

    const visibleLinks = links.filter((link) => {
      if (!isolatedNodeIds) return true;
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return isolatedNodeIds.has(sourceId) && isolatedNodeIds.has(targetId);
    });

    const linkHit = linkHitArea
      .selectAll('line')
      .data(visibleLinks)
      .enter()
      .append('line')
      .attr('class', 'link-hit')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 16)
      .style('cursor', 'pointer');

    const link = linkGroup
      .selectAll('line')
      .data(visibleLinks)
      .enter()
      .append('line')
      .attr('class', 'visible-link')
      .attr('stroke', (d) => {
        if (isObsidianMode) return obsidianStyle?.linkBase ?? 'rgba(255,255,255,0.2)';
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const sourceNode = nodeMap.get(sourceId);
        return GRAPH_COLORS[sourceNode?.group ?? 0] ?? '#8E8E93';
      })
      .attr('stroke-width', () => (isObsidianMode ? obsidianStyle?.linkWidth ?? 1.5 : 2.0))
      .attr('stroke-opacity', () => (isObsidianMode ? 0.6 : 0.4))
      .attr('marker-end', () => {
        if (isObsidianMode) return obsidianShowArrows ? 'url(#obsidian-arrow)' : null;
        return 'url(#arrow)';
      });

    linkSelectionRef.current = link as d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>;

    const node = nodeGroup
      .selectAll<SVGGElement, GraphNode>('.node-group')
      .data(visibleNodes)
      .enter()
      .append('g')
      .attr('class', (d) => `node-group node-${d.type}`)
      .style('cursor', 'pointer');

    nodeSelectionRef.current = node as d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>;

    const nodeCore = node.append('g').attr('class', 'node-inner-content');

    if (isObsidianMode) {
      nodeCore.append('circle')
        .attr('class', 'node-dot')
        .attr('r', (d) => {
          const degree = nodeDegreeMap.get(d.id) ?? 1;
          const base = obsidianStyle?.nodeRadiusBase ?? 3.2;
          const step = obsidianStyle?.nodeRadiusStep ?? 0.22;
          return base + Math.min(8, degree) * step;
        })
        .attr('fill', obsidianStyle?.nodeFill ?? '#d4d4d4');

      nodeCore.append('circle')
        .attr('class', 'node-ring')
        .attr('r', (d) => {
          const degree = nodeDegreeMap.get(d.id) ?? 1;
          const base = obsidianStyle?.nodeRadiusBase ?? 3.2;
          const step = obsidianStyle?.nodeRadiusStep ?? 0.22;
          return base + Math.min(8, degree) * step + 2;
        })
        .attr('fill', 'transparent')
        .attr('stroke', obsidianStyle?.showAccentRings ? obsidianStyle?.accent ?? '#3DDC84' : 'transparent')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.8);
    } else {
      nodeCore.append('circle')
        .attr('class', 'node-hit')
        .attr('r', (d) => getGeminiHitRadius(d.val))
        .attr('fill', 'transparent')
        .style('pointer-events', 'all');

      nodeCore.append('circle')
        .attr('class', 'node-glow')
        .attr('r', (d) => getGeminiGlowRadius(d.val))
        .attr('fill', (d) => GRAPH_COLORS[d.group] ?? '#8E8E93')
        .attr('filter', 'url(#drop-shadow)')
        .attr('opacity', 0.2);

      nodeCore.append('circle')
        .attr('class', 'node-core')
        .attr('r', (d) => getGeminiCoreRadius(d.val))
        .attr('fill', (d) => GRAPH_COLORS[d.group] ?? '#8E8E93')
        .attr('opacity', 0.95);
    }

    const labelGroup = node.append('g').attr('class', 'node-label-group');
    labelGroup.append('text')
      .attr('class', 'node-label')
      .attr('x', (d) => (isObsidianMode ? 8 : getGeminiLabelOffset(d.val)))
      .attr('y', 4)
      .text((d) => d.id)
      .attr('fill', 'white')
      .attr('font-size', isObsidianMode ? 11 : 12)
      .attr('opacity', isObsidianMode ? obsidianStyle?.labelOpacity ?? 0.9 : 0.8)
      .attr('font-weight', 600);

    if (useCourseGlyphs) {
      const quizNodes = node.filter((d) => d.type === 'quiz');
      const quizContent = quizNodes.select('.node-inner-content');
      quizContent.select('.node-hit').remove();
      quizContent.select('.node-glow').remove();
      quizContent.select('.node-core').remove();

      quizContent.append('circle')
        .attr('class', 'node-hit')
        .attr('r', 18)
        .attr('fill', 'transparent')
        .style('pointer-events', 'all');
      quizContent.append('circle')
        .attr('class', 'quiz-ring')
        .attr('r', 14)
        .attr('fill', 'transparent')
        .attr('stroke', (d) => QUIZ_STATUS_STYLES[d.status ?? 'upcoming'].color)
        .attr('stroke-width', 2.4)
        .attr('filter', (d) => `url(#quiz-glow-${d.status ?? 'upcoming'})`);
      quizContent.append('text')
        .text((d) => d.shortLabel ?? 'Q')
        .attr('text-anchor', 'middle')
        .attr('dy', 6)
        .attr('font-size', 20)
        .attr('font-weight', '800')
        .attr('fill', (d) => QUIZ_STATUS_STYLES[d.status ?? 'upcoming'].color)
        .attr('filter', (d) => `url(#quiz-glow-${d.status ?? 'upcoming'})`)
        .style('letter-spacing', '0.08em');

      const noteNodes = node.filter((d) => d.type === 'note');
      const noteContent = noteNodes.select('.node-inner-content');
      noteContent.select('.node-hit').remove();
      noteContent.select('.node-glow').remove();
      noteContent.select('.node-core').remove();

      noteContent.append('circle')
        .attr('class', 'node-hit')
        .attr('r', 18)
        .attr('fill', 'transparent')
        .style('pointer-events', 'all');
      noteContent.append('rect')
        .attr('x', -11)
        .attr('y', -13)
        .attr('width', 22)
        .attr('height', 26)
        .attr('rx', 4)
        .attr('fill', 'rgba(255,255,255,0.18)')
        .attr('stroke', 'rgba(255,255,255,0.4)')
        .attr('stroke-width', 0.6)
        .attr('filter', 'url(#note-glow)');
      noteContent.append('path')
        .attr('d', 'M2,-13 L11,-13 L11,-5 Z')
        .attr('fill', 'rgba(255,255,255,0.45)');
      noteContent.append('text')
        .text((d) => d.shortLabel ?? 'N')
        .attr('class', 'note-label')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('font-size', 11)
        .attr('font-weight', '700')
        .attr('fill', 'rgba(255,255,255,0.9)');
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
      content.select('.node-glow').attr('r', getGeminiHoverGlow(d.val));
      content.select('.node-core').attr('r', getGeminiHoverCore(d.val));

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
      content.select('.node-glow').attr('r', (d) => getGeminiGlowRadius((d as GraphNode).val));
      content.select('.node-core').attr('r', (d) => getGeminiCoreRadius((d as GraphNode).val));

      g.selectAll<SVGLineElement, GraphLink>('.visible-link')
        .classed('link-hovered', false)
        .style('stroke', null)
        .attr('marker-end', 'url(#arrow)');

      updateLabels();
    });

    node.on('click', (event, d) => {
      event.stopPropagation();
      if (d.courseId) {
        setSelectedCourseId(d.courseId);
        setOpenCourseIds((prev) => ({ ...prev, [d.courseId!]: true }));
        setOpenSectionIds((prev) => ({
          ...prev,
          [`${d.courseId}-lectures`]: true,
          [`${d.courseId}-assignments`]: true,
          [`${d.courseId}-quizzes`]: true
        }));
      }
      setActiveNode(d);
      if (floatingInfoEnabledRef.current) {
        setFloatingInfoNodeId(d.id);
      }
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
      const amp = isObsidianMode && !obsidianAnimate ? 0 : floatIntensityRef.current;

      node.attr('transform', (d) => {
        const floatY = Math.sin(time * d.floatSpeed + d.floatPhase) * amp;
        d.visualY = d.y + floatY;
        return `translate(${d.x},${d.visualY})`;
      });

      linkHit
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
      nodeSelectionRef.current = null;
      linkSelectionRef.current = null;
    };
  }, [
    isWebglMode,
    nodes,
    links,
    nodeMap,
    neighborMap,
    nodeDegreeMap,
    repulsion,
    gravity,
    baseScale,
    isFullscreen,
    renderMode,
    obsidianShowArrows,
    obsidianStyle,
    obsidianAnimate
  ]);

  useEffect(() => {
    if (isWebglMode || !gRef.current) return;
    const g = gRef.current;

    if (!isolatedNodeIds) {
      g.classed('in-isolate-mode', false);
      g.selectAll<SVGGElement, GraphNode>('.node-group').classed('node-outside', false);
      g.selectAll<SVGLineElement, GraphLink>('.visible-link').classed('link-outside', false);
      return;
    }

    g.classed('in-isolate-mode', true);
    g.selectAll<SVGGElement, GraphNode>('.node-group')
      .classed('node-outside', (node) => !isolatedNodeIds.has(node.id));
    g.selectAll<SVGLineElement, GraphLink>('.visible-link')
      .classed('link-outside', (linkData) => {
        const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
        const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
        return !isolatedNodeIds.has(sourceId) || !isolatedNodeIds.has(targetId);
      });
  }, [isolatedNodeIds, isWebglMode]);

  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;

    if (isObsidianMode) {
      if (!obsidianVariant || !obsidianStyle) return;
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
  }, [activeNode, neighborMap, nodeMap, renderMode, isObsidianMode, obsidianStyle, obsidianVariant]);

  const triggerObsidianAnimation = () => {
    if (!isObsidianMode || isWebglMode) return;
    if (!simulationRef.current || !nodeSelectionRef.current || !linkSelectionRef.current) return;

    obsidianAnimationTimeoutRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    obsidianAnimationTimeoutRef.current = [];

    const { width, height } = sizeRef.current;
    const centerX = (width || 600) / 2;
    const centerY = (height || 420) / 2;
    const batchSize = Math.max(2, Math.round(nodes.length / 30));
    const totalSlots = Math.ceil(nodes.length / batchSize);
    const baseDelay = Math.max(180, Math.min(320, 10000 / Math.max(1, totalSlots)));
    const releaseHold = Math.max(240, baseDelay * 1.1);
    const spread = Math.min(width || 600, height || 420) * 0.22;
    const impulse = Math.min(width || 600, height || 420) * 0.012;

    const orderedNodes: GraphNode[] = [];
    const visited = new Set<string>();
    const nodesByDegree = [...nodes].sort((a, b) => (nodeDegreeMap.get(b.id) ?? 0) - (nodeDegreeMap.get(a.id) ?? 0));
    const queue: GraphNode[] = [];
    if (nodesByDegree[0]) queue.push(nodesByDegree[0]);

    while (queue.length) {
      const node = queue.shift();
      if (!node || visited.has(node.id)) continue;
      visited.add(node.id);
      orderedNodes.push(node);
      const neighbors = Array.from(neighborMap.get(node.id) ?? [])
        .map((id) => nodeMap.get(id))
        .filter((neighbor): neighbor is GraphNode => Boolean(neighbor))
        .sort((a, b) => (nodeDegreeMap.get(b.id) ?? 0) - (nodeDegreeMap.get(a.id) ?? 0));
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor.id)) queue.push(neighbor);
      });
    }

    nodes.forEach((node) => {
      if (!visited.has(node.id)) orderedNodes.push(node);
    });

    const orderIndex = new Map<string, number>();
    orderedNodes.forEach((node, index) => orderIndex.set(node.id, index));

    nodes.forEach((node) => {
      node.x = centerX + (Math.random() - 0.5) * spread;
      node.y = centerY + (Math.random() - 0.5) * spread;
      node.vx = 0;
      node.vy = 0;
      node.fx = node.x;
      node.fy = node.y;
    });

    setActiveNode(null);
    setHoveredNode(null);

    nodeSelectionRef.current
      .interrupt()
      .style('opacity', 0)
      .transition()
      .delay((d) => Math.floor((orderIndex.get(d.id) ?? 0) / batchSize) * baseDelay)
      .duration(280)
      .style('opacity', 1);

    linkSelectionRef.current
      .interrupt()
      .style('opacity', 0)
      .transition()
      .delay((d) => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        const sourceIndex = orderIndex.get(sourceId) ?? 0;
        const targetIndex = orderIndex.get(targetId) ?? 0;
        const maxIndex = Math.max(sourceIndex, targetIndex);
        return Math.floor(maxIndex / batchSize) * baseDelay + baseDelay * 0.5;
      })
      .duration(320)
      .style('opacity', 1);

    const originalDecay = simulationRef.current.alphaDecay();
    simulationRef.current.alphaDecay(0.015);
    simulationRef.current.alpha(1).alphaTarget(0.2).restart();

    const releaseTimeout = window.setTimeout(() => {
      nodes.forEach((node) => {
        if (!node.fx || !node.fy) return;
        const jitterX = (Math.random() - 0.5) * impulse;
        const jitterY = (Math.random() - 0.5) * impulse;
        node.fx += jitterX;
        node.fy += jitterY;
      });
      simulationRef.current?.alpha(0.4).restart();
    }, releaseHold);

    const settleTimeout = window.setTimeout(() => {
      nodes.forEach((node) => {
        node.fx = null;
        node.fy = null;
      });
      simulationRef.current?.alphaDecay(originalDecay);
      simulationRef.current?.alphaTarget(0);
    }, releaseHold + 720);

    obsidianAnimationTimeoutRef.current.push(releaseTimeout, settleTimeout);
  };

  return { triggerObsidianAnimation };
};
