import { OBSIDIAN_ACCENT } from './knowledge-graph-data';
import { GraphNode, ObsidianStyle, ObsidianVariant, RenderMode } from './knowledge-graph-types';

export const getObsidianStyle = (variant: ObsidianVariant): ObsidianStyle => {
  const base: ObsidianStyle = {
    accent: OBSIDIAN_ACCENT,
    nodeFill: '#CFCFCF',
    nodeDimOpacity: 0.25,
    linkBase: 'rgba(255,255,255,0.22)',
    linkDim: 'rgba(255,255,255,0.06)',
    linkWidth: 1.4,
    linkHoverWidth: 2.4,
    nodeRadiusBase: 3.2,
    nodeRadiusStep: 0.22,
    labelOpacity: 0.95,
    showNeighborLabels: false,
    showAccentRings: false
  };

  if (variant === 'obsidian-v2') {
    return {
      ...base,
      linkBase: 'rgba(255,255,255,0.26)',
      linkDim: 'rgba(255,255,255,0.08)',
      linkHoverWidth: 2.8,
      showNeighborLabels: true,
      showAccentRings: true
    };
  }

  if (variant === 'obsidian-v3') {
    return {
      ...base,
      nodeFill: '#C4C4C4',
      nodeDimOpacity: 0.2,
      linkBase: 'rgba(255,255,255,0.14)',
      linkDim: 'rgba(255,255,255,0.04)',
      linkWidth: 1.1,
      linkHoverWidth: 2.0,
      nodeRadiusBase: 2.8,
      nodeRadiusStep: 0.18,
      labelOpacity: 0.85
    };
  }

  return base;
};

export const getObsidianVariantFromMode = (mode: RenderMode): ObsidianVariant | null => {
  if (!mode.startsWith('obsidian-')) return null;
  if (mode.includes('v1')) return 'obsidian-v1';
  if (mode.includes('v2')) return 'obsidian-v2';
  return 'obsidian-v3';
};

export const getNodeCentroid = (nodes: GraphNode[]) => {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  nodes.forEach((node) => {
    if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
      sumX += node.x ?? 0;
      sumY += node.y ?? 0;
      count += 1;
    }
  });
  if (!count) return { x: 0, y: 0 };
  return { x: sumX / count, y: sumY / count };
};
