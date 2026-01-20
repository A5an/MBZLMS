import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import * as d3 from 'd3';
import type { GraphLink, GraphNode, ObsidianStyle } from './knowledge-graph-types';
import { getNodeCentroid } from './knowledge-graph-utils';

interface UseKnowledgeGraphWebglParams {
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  nodeDegreeMap: Map<string, number>;
  repulsion: number;
  gravity: number;
  baseScale: number;
  isFullscreen: boolean;
  isWebglMode: boolean;
  isObsidianMode: boolean;
  obsidianStyle: ObsidianStyle | null;
  enableFloatingInfo: boolean;
  floatingInfoNodeId: string | null;
  containerRef: RefObject<HTMLDivElement>;
  floatingInfoRef: RefObject<HTMLDivElement>;
  transformRef: MutableRefObject<d3.ZoomTransform>;
  currentScaleRef: MutableRefObject<number>;
  simulationRef: MutableRefObject<d3.Simulation<GraphNode, undefined> | null>;
  sizeRef: MutableRefObject<{ width: number; height: number }>;
  webglTransformInitializedRef: MutableRefObject<boolean>;
  hoveredNodeRef: MutableRefObject<GraphNode | null>;
  ignoreClickRef: MutableRefObject<boolean>;
  setActiveNode: Dispatch<SetStateAction<GraphNode | null>>;
  setFloatingInfoNodeId: Dispatch<SetStateAction<string | null>>;
}

export const useKnowledgeGraphWebgl = ({
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
}: UseKnowledgeGraphWebglParams) => {
  const webglInteractionRef = useRef<{
    mode: 'idle' | 'pan' | 'drag';
    pointerId: number | null;
    node: GraphNode | null;
    lastX: number;
    lastY: number;
    downX: number;
    downY: number;
    moved: boolean;
  }>({
    mode: 'idle',
    pointerId: null,
    node: null,
    lastX: 0,
    lastY: 0,
    downX: 0,
    downY: 0,
    moved: false
  });

  useEffect(() => {
    if (!isWebglMode || !containerRef.current) return;
    const container = containerRef.current;
    const interaction = webglInteractionRef.current;
    const minZoom = isFullscreen ? 0.2 : 0.3;
    const maxZoom = isFullscreen ? 4.5 : 3.5;

    const isUiEvent = (event: PointerEvent | WheelEvent) =>
      event.target instanceof Element &&
      Boolean(event.target.closest('[data-graph-ui]') || event.target.closest('[data-graph-panel]'));

    const getGraphPoint = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const transform = transformRef.current;
      return {
        x: (localX - transform.x) / transform.k,
        y: (localY - transform.y) / transform.k,
        localX,
        localY
      };
    };

    const getNodeHit = (graphX: number, graphY: number) => {
      let closest: GraphNode | null = null;
      let closestDistance = Infinity;
      for (const node of nodes) {
        const dx = (node.x ?? 0) - graphX;
        const dy = (node.y ?? 0) - graphY;
        const distance = Math.hypot(dx, dy);
        const degree = nodeDegreeMap.get(node.id) ?? 1;
        const nodeRadius = obsidianStyle
          ? obsidianStyle.nodeRadiusBase + Math.min(10, degree) * obsidianStyle.nodeRadiusStep
          : node.val + 8;
        const hitRadius = obsidianStyle ? nodeRadius * 1.8 : nodeRadius * 1.4;
        if (distance < hitRadius && distance < closestDistance) {
          closest = node;
          closestDistance = distance;
        }
      }
      return closest;
    };

    const moveThreshold = 3;
    const markMoved = (event: PointerEvent) => {
      if (interaction.moved) return;
      const dx = event.clientX - interaction.downX;
      const dy = event.clientY - interaction.downY;
      if (Math.hypot(dx, dy) > moveThreshold) {
        interaction.moved = true;
        ignoreClickRef.current = true;
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isUiEvent(event)) return;
      container.setPointerCapture(event.pointerId);
      interaction.pointerId = event.pointerId;
      interaction.downX = event.clientX;
      interaction.downY = event.clientY;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      interaction.moved = false;
      ignoreClickRef.current = false;

      const point = getGraphPoint(event.clientX, event.clientY);
      const hitNode = getNodeHit(point.x, point.y);

      if (hitNode) {
        interaction.mode = 'drag';
        interaction.node = hitNode;
        hoveredNodeRef.current = hitNode;
        hitNode.fx = point.x;
        hitNode.fy = point.y;
        simulationRef.current?.alphaTarget(0.3).restart();
      } else {
        interaction.mode = 'pan';
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isUiEvent(event)) return;
      if (interaction.mode === 'drag' && interaction.node) {
        markMoved(event);
        const point = getGraphPoint(event.clientX, event.clientY);
        interaction.node.fx = point.x;
        interaction.node.fy = point.y;
        hoveredNodeRef.current = interaction.node;
        return;
      }
      if (interaction.mode === 'pan') {
        markMoved(event);
        const dx = event.clientX - interaction.lastX;
        const dy = event.clientY - interaction.lastY;
        interaction.lastX = event.clientX;
        interaction.lastY = event.clientY;
        const transform = transformRef.current;
        transformRef.current = d3.zoomIdentity.translate(transform.x + dx, transform.y + dy).scale(transform.k);
        currentScaleRef.current = transformRef.current.k;
        return;
      }

      const point = getGraphPoint(event.clientX, event.clientY);
      hoveredNodeRef.current = getNodeHit(point.x, point.y);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (interaction.pointerId !== event.pointerId) return;
      const clickedNode = interaction.node;
      const wasMoved = interaction.moved;
      if (interaction.mode === 'drag' && interaction.node) {
        interaction.node.fx = null;
        interaction.node.fy = null;
        simulationRef.current?.alphaTarget(0);
      }
      if (clickedNode && !wasMoved) {
        setActiveNode(clickedNode);
        if (enableFloatingInfo) {
          setFloatingInfoNodeId(clickedNode.id);
        }
        ignoreClickRef.current = true;
      }
      if (wasMoved) {
        ignoreClickRef.current = true;
      }
      interaction.mode = 'idle';
      interaction.node = null;
      interaction.pointerId = null;
      container.releasePointerCapture(event.pointerId);
    };

    const handlePointerLeave = () => {
      if (interaction.mode === 'idle') hoveredNodeRef.current = null;
    };

    const handleWheel = (event: WheelEvent) => {
      if (isUiEvent(event)) return;
      event.preventDefault();
      const transform = transformRef.current;
      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const zoomFactor = Math.exp(-event.deltaY * 0.001);
      const nextK = Math.max(minZoom, Math.min(maxZoom, transform.k * zoomFactor));
      const scaleRatio = nextK / transform.k;
      const nextX = localX - (localX - transform.x) * scaleRatio;
      const nextY = localY - (localY - transform.y) * scaleRatio;
      transformRef.current = d3.zoomIdentity.translate(nextX, nextY).scale(nextK);
      currentScaleRef.current = nextK;
    };

    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.style.touchAction = '';
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isWebglMode, isFullscreen, nodes, nodeDegreeMap, obsidianStyle, enableFloatingInfo]);

  useEffect(() => {
    if (!enableFloatingInfo || !floatingInfoNodeId) return;
    let frameId = 0;

    const update = () => {
      const panel = floatingInfoRef.current;
      const container = containerRef.current;
      const node = nodeMap.get(floatingInfoNodeId);
      if (!panel || !container || !node) {
        frameId = window.requestAnimationFrame(update);
        return;
      }

      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      const panelWidth = panel.offsetWidth || 1;
      const panelHeight = panel.offsetHeight || 1;
      const transform = transformRef.current;
      const nodeX = (node.x ?? 0) * transform.k + transform.x;
      const nodeY = (node.y ?? 0) * transform.k + transform.y;
      const pad = 12;
      let left = nodeX + 18;
      let top = nodeY - panelHeight * 0.5;

      if (left + panelWidth + pad > width) {
        left = nodeX - panelWidth - 18;
      }
      if (top + panelHeight + pad > height) {
        top = height - panelHeight - pad;
      }
      if (top < pad) top = pad;
      if (left < pad) left = pad;

      panel.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [enableFloatingInfo, floatingInfoNodeId, nodeMap]);

  useEffect(() => {
    if (!isWebglMode || !containerRef.current) return;
    const width = sizeRef.current.width || containerRef.current.clientWidth || 600;
    const height = sizeRef.current.height || containerRef.current.clientHeight || 420;

    const linkDistance = isObsidianMode ? 62 : 80;
    const chargeStrength = isObsidianMode ? repulsion * 0.7 : repulsion;
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => {
        if (isObsidianMode) {
          const degree = nodeDegreeMap.get(d.id) ?? 1;
          return 8 + Math.min(12, degree) * 0.65;
        }
        return d.val * 2;
      }).iterations(2))
      .force('x', d3.forceX(width / 2).strength(gravity))
      .force('y', d3.forceY(height / 2).strength(gravity));

    simulation.alphaDecay(0.02);
    simulationRef.current = simulation;
    simulation.alpha(0.6).alphaTarget(0);

    if (!webglTransformInitializedRef.current) {
      const centroid = getNodeCentroid(nodes);
      const nextTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(baseScale)
        .translate(-centroid.x, -centroid.y);
      transformRef.current = nextTransform;
      currentScaleRef.current = nextTransform.k;
      webglTransformInitializedRef.current = true;
    }

    return () => {
      simulation.stop();
    };
  }, [isWebglMode, nodes, links, repulsion, gravity, baseScale, nodeDegreeMap, isObsidianMode]);
};
