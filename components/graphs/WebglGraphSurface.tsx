import React from 'react';
import * as d3 from 'd3';
import { FluidGlassLens } from '../FluidGlass';
import { GraphWebGLScene } from './knowledge-graph-webgl';
import type { GraphLink, GraphNode, ObsidianStyle, ObsidianVariant } from './knowledge-graph-types';

interface WebglGraphSurfaceProps {
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  nodeDegreeMap: Map<string, number>;
  neighborMap: Map<string, Set<string>>;
  graphColors: string[];
  activeNode: GraphNode | null;
  hoveredNodeRef: React.MutableRefObject<GraphNode | null>;
  getColor: (group: number) => string;
  currentScaleRef: React.MutableRefObject<number>;
  floatIntensityRef: React.MutableRefObject<number>;
  obsidianVariant: ObsidianVariant | null;
  obsidianStyle: ObsidianStyle | null;
  obsidianTextFade: number;
  obsidianAnimate: boolean;
  geminiSizeScale: number;
  hoverBounceStrength: number;
  sizeRef: React.MutableRefObject<{ width: number; height: number }>;
  transformRef: React.MutableRefObject<d3.ZoomTransform>;
  getNodeVisibilityThreshold: (node: GraphNode) => number;
  enableWebglHoverPulse: boolean;
  enableWebglHighContrastLinks: boolean;
  eventSource?: HTMLElement | null;
}

export const WebglGraphSurface: React.FC<WebglGraphSurfaceProps> = ({
  nodes,
  links,
  nodeMap,
  nodeDegreeMap,
  neighborMap,
  graphColors,
  activeNode,
  hoveredNodeRef,
  getColor,
  currentScaleRef,
  floatIntensityRef,
  obsidianVariant,
  obsidianStyle,
  obsidianTextFade,
  obsidianAnimate,
  geminiSizeScale,
  hoverBounceStrength,
  sizeRef,
  transformRef,
  getNodeVisibilityThreshold,
  enableWebglHoverPulse,
  enableWebglHighContrastLinks,
  eventSource
}) => (
  <FluidGlassLens
    className="absolute inset-0 z-20"
    eventSource={eventSource ?? undefined}
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
);
