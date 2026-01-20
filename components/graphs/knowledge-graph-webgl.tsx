import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { GRAPH_COLORS, OBSIDIAN_ACCENT } from './knowledge-graph-data';
import { GraphLink, GraphNode, ObsidianStyle, ObsidianVariant } from './knowledge-graph-types';

interface GraphWebGLSceneProps {
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  nodeDegreeMap: Map<string, number>;
  neighborMap: Map<string, Set<string>>;
  activeNode: GraphNode | null;
  hoveredNodeRef: React.MutableRefObject<GraphNode | null>;
  getColor: (group: number) => string;
  currentScaleRef: React.MutableRefObject<number>;
  floatIntensityRef: React.MutableRefObject<number>;
  obsidianVariant: ObsidianVariant | null;
  obsidianStyle: ObsidianStyle | null;
  obsidianTextFade: number;
  obsidianAnimate: boolean;
  sizeRef: React.MutableRefObject<{ width: number; height: number }>;
  transformRef: React.MutableRefObject<d3.ZoomTransform>;
  getNodeVisibilityThreshold: (node: GraphNode) => number;
  enableWebglHoverPulse: boolean;
  enableWebglHighContrastLinks: boolean;
}

export const GraphWebGLScene: React.FC<GraphWebGLSceneProps> = ({
  nodes,
  links,
  nodeMap,
  nodeDegreeMap,
  neighborMap,
  activeNode,
  hoveredNodeRef,
  getColor,
  currentScaleRef,
  floatIntensityRef,
  obsidianVariant,
  obsidianStyle,
  obsidianTextFade,
  obsidianAnimate,
  sizeRef,
  transformRef,
  getNodeVisibilityThreshold,
  enableWebglHoverPulse,
  enableWebglHighContrastLinks
}) => {
  const palette = useMemo(() => GRAPH_COLORS.map((color) => new THREE.Color(color)), []);
  const neutralColor = useMemo(() => new THREE.Color('#ffffff'), []);
  const isObsidian = Boolean(obsidianStyle);
  const floatEnabled = !isObsidian || obsidianAnimate;

  return (
    <>
      <GraphBackdrop variant={obsidianVariant} isObsidian={isObsidian} />
      <GraphTransform sizeRef={sizeRef} transformRef={transformRef}>
        <GraphLinks
          links={links}
          nodeMap={nodeMap}
          activeNode={activeNode}
          hoveredNodeRef={hoveredNodeRef}
          palette={palette}
          neutralColor={neutralColor}
          floatIntensityRef={floatIntensityRef}
          obsidianStyle={obsidianStyle}
          floatEnabled={floatEnabled}
          highContrast={enableWebglHighContrastLinks}
        />
        {nodes.map((node) => (
          <GraphNodeMesh
            key={node.id}
            node={node}
            activeNode={activeNode}
            neighborMap={neighborMap}
            nodeDegreeMap={nodeDegreeMap}
            hoveredNodeRef={hoveredNodeRef}
            color={getColor(node.group)}
            currentScaleRef={currentScaleRef}
            floatIntensityRef={floatIntensityRef}
            getNodeVisibilityThreshold={getNodeVisibilityThreshold}
            obsidianStyle={obsidianStyle}
            obsidianTextFade={obsidianTextFade}
            floatEnabled={floatEnabled}
            hoverPulse={enableWebglHoverPulse}
          />
        ))}
      </GraphTransform>
    </>
  );
};

interface GraphBackdropProps {
  variant: ObsidianVariant | null;
  isObsidian: boolean;
}

const GraphBackdrop: React.FC<GraphBackdropProps> = ({ variant, isObsidian }) => {
  const { viewport } = useThree();
  const texture = useMemo(() => {
    const size = 512;
    const step = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isObsidian) {
        const base = variant === 'obsidian-v3' ? '#111111' : '#141414';
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
        const glow = ctx.createRadialGradient(size * 0.5, size * 0.35, size * 0.1, size * 0.5, size * 0.35, size * 0.8);
        glow.addColorStop(0, 'rgba(255,255,255,0.08)');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, size, size);
        const noiseAlpha = variant === 'obsidian-v3' ? 0.06 : variant === 'obsidian-v2' ? 0.08 : 0.1;
        ctx.fillStyle = `rgba(255,255,255,${noiseAlpha})`;
        for (let i = 0; i < 700; i += 1) {
          ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }
      } else {
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
    }
    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(isObsidian ? 1 : 4, isObsidian ? 1 : 4);
    gridTexture.colorSpace = THREE.SRGBColorSpace;
    return gridTexture;
  }, [isObsidian, variant]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0, -2]} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent opacity={isObsidian ? 1 : 0.55} />
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
  obsidianStyle: ObsidianStyle | null;
  floatEnabled: boolean;
  highContrast: boolean;
}

const parseAlpha = (value: string, fallback: number) => {
  const match = value.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([0-9.]+))?\s*\)/i);
  if (!match) return fallback;
  const alpha = match[1];
  return alpha ? Number(alpha) : 1;
};

const GraphLinks: React.FC<GraphLinksProps> = ({
  links,
  nodeMap,
  activeNode,
  hoveredNodeRef,
  palette,
  neutralColor,
  floatIntensityRef,
  obsidianStyle,
  floatEnabled,
  highContrast
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(links.length * 6), [links.length]);
  const colors = useMemo(() => new Float32Array(links.length * 6), [links.length]);
  const obsidianBaseColor = useMemo(() => new THREE.Color(obsidianStyle?.linkBase ?? '#ffffff'), [obsidianStyle]);
  const obsidianAccentColor = useMemo(() => new THREE.Color(obsidianStyle?.accent ?? OBSIDIAN_ACCENT), [obsidianStyle]);
  const obsidianBaseIntensity = useMemo(() => (obsidianStyle ? parseAlpha(obsidianStyle.linkBase, 0.16) : 0), [obsidianStyle]);
  const obsidianDimIntensity = useMemo(() => (obsidianStyle ? parseAlpha(obsidianStyle.linkDim, 0.04) : 0), [obsidianStyle]);
  const contrastBoost = highContrast ? 1.35 : 1;

  useFrame(({ clock }) => {
    if (!geometryRef.current) return;
    const time = clock.getElapsedTime();
    const amp = floatEnabled ? floatIntensityRef.current : 0;
    const activeId = activeNode?.id;
    const hoveredId = activeId ? null : hoveredNodeRef.current?.id;
    const focusId = activeId ?? hoveredId;

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

      const isHighlighted = focusId ? source.id === focusId || target.id === focusId : false;
      let baseColor = neutralColor;
      let intensity = activeId ? 0.08 : 0.18;

      if (obsidianStyle) {
        baseColor = isHighlighted ? obsidianAccentColor : obsidianBaseColor;
        intensity = focusId ? (isHighlighted ? 0.9 : obsidianDimIntensity) : obsidianBaseIntensity;
      } else if (isHighlighted) {
        baseColor = palette[source.group % palette.length];
        intensity = 0.7;
      }

      intensity = Math.min(1, intensity * contrastBoost);
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
      <lineBasicMaterial vertexColors transparent opacity={0.95} />
    </lineSegments>
  );
};

interface GraphNodeMeshProps {
  node: GraphNode;
  activeNode: GraphNode | null;
  neighborMap: Map<string, Set<string>>;
  nodeDegreeMap: Map<string, number>;
  hoveredNodeRef: React.MutableRefObject<GraphNode | null>;
  color: string;
  currentScaleRef: React.MutableRefObject<number>;
  floatIntensityRef: React.MutableRefObject<number>;
  getNodeVisibilityThreshold: (node: GraphNode) => number;
  obsidianStyle: ObsidianStyle | null;
  obsidianTextFade: number;
  floatEnabled: boolean;
  hoverPulse: boolean;
}

const GraphNodeMesh: React.FC<GraphNodeMeshProps> = ({
  node,
  activeNode,
  neighborMap,
  nodeDegreeMap,
  hoveredNodeRef,
  color,
  currentScaleRef,
  floatIntensityRef,
  getNodeVisibilityThreshold,
  obsidianStyle,
  obsidianTextFade,
  floatEnabled,
  hoverPulse
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Mesh>(null);
  const glowScaleRef = useRef(1);
  const coreScaleRef = useRef(1);
  const labelMaterialRef = useRef<THREE.Material | null>(null);
  const degree = nodeDegreeMap.get(node.id) ?? 1;
  const obsidianRadius = obsidianStyle
    ? obsidianStyle.nodeRadiusBase + Math.min(8, degree) * obsidianStyle.nodeRadiusStep
    : 0;
  const geminiCoreRadius = 2 + node.val * 0.75;
  const geminiGlowRadius = geminiCoreRadius + 8;
  const glowRadius = obsidianStyle ? obsidianRadius * 2.4 : geminiGlowRadius;
  const coreRadius = obsidianStyle ? obsidianRadius : geminiCoreRadius;
  const ringInner = obsidianStyle ? obsidianRadius + 0.6 : geminiCoreRadius + 0.6;
  const ringOuter = obsidianStyle ? obsidianRadius + 1.2 : geminiCoreRadius + 1.6;
  const labelOffset = obsidianStyle ? obsidianRadius + 6 : geminiCoreRadius + 12;
  const labelSize = obsidianStyle ? Math.max(8, 7 + degree * 0.35) : Math.max(10, 8 + node.val / 3);

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
    const floatY = Math.sin(time * node.floatSpeed + node.floatPhase) * (floatEnabled ? floatIntensityRef.current : 0);
    groupRef.current.position.set(node.x ?? 0, (node.y ?? 0) + floatY, 0);

    const activeId = activeNode?.id;
    const hoveredId = hoveredNodeRef.current?.id;
    const focusId = activeId ?? hoveredId;
    const neighborSet = focusId ? neighborMap.get(focusId) : null;
    const isActive = activeId === node.id;
    const isHovered = !activeId && hoveredId === node.id;
    const isNeighbor = neighborSet?.has(node.id);
    const obsidianInFocus = !focusId || focusId === node.id || isNeighbor;
    const inFocus = activeId ? isActive || isNeighbor : true;

    const rawGlow = obsidianStyle
      ? isActive
        ? 1.8
        : isHovered
          ? 1.4
          : 1
      : isActive
        ? 3.6
        : isHovered
          ? 2.4
          : 1;
    const rawCore = obsidianStyle
      ? isActive
        ? 1.2
        : isHovered
          ? 1.1
          : 1
      : isActive
        ? 1.4
        : isHovered
          ? 1.2
          : 1;
    const pulseDamp = hoverPulse ? 1 : 0.55;
    const targetGlow = 1 + (rawGlow - 1) * pulseDamp;
    const targetCore = 1 + (rawCore - 1) * pulseDamp;
    glowScaleRef.current += (targetGlow - glowScaleRef.current) * 0.18;
    coreScaleRef.current += (targetCore - coreScaleRef.current) * 0.18;
    glowRef.current?.scale.setScalar(glowScaleRef.current);
    coreRef.current?.scale.setScalar(coreScaleRef.current);
    ringRef.current?.scale.setScalar(coreScaleRef.current);

    const dimOpacity = obsidianStyle
      ? obsidianInFocus
        ? 1
        : obsidianStyle.nodeDimOpacity
      : inFocus
        ? 1
        : 0.22;
    const glowMaterial = glowRef.current?.material;
    if (glowMaterial && !Array.isArray(glowMaterial)) {
      glowMaterial.opacity = obsidianStyle
        ? dimOpacity * (isActive || isHovered ? 0.18 : 0.08)
        : dimOpacity * (isActive ? 0.55 : isHovered ? 0.4 : 0.22);
      if (obsidianStyle) {
        glowMaterial.color.set(obsidianStyle.accent);
      }
    }
    const coreMaterial = coreRef.current?.material;
    if (coreMaterial && !Array.isArray(coreMaterial)) {
      coreMaterial.opacity = dimOpacity;
      if (obsidianStyle) {
        coreMaterial.color.set(isActive || isHovered ? obsidianStyle.accent : obsidianStyle.nodeFill);
      }
    }
    const ringMaterial = ringRef.current?.material;
    if (ringMaterial && !Array.isArray(ringMaterial)) {
      ringMaterial.opacity = obsidianStyle
        ? isActive || isHovered || isNeighbor
          ? dimOpacity * 0.85
          : 0
        : dimOpacity * 0.75;
      if (obsidianStyle) {
        ringMaterial.color.set(obsidianStyle.accent);
      }
    }
    if (ringRef.current) {
      ringRef.current.visible = !obsidianStyle || obsidianStyle.showAccentRings;
    }

    const showNeighborLabel = Boolean(
      obsidianStyle?.showNeighborLabels && focusId && neighborSet?.has(node.id)
    );
    const zoomAllowsLabel = obsidianStyle
      ? currentScaleRef.current >= obsidianTextFade
      : currentScaleRef.current >= getNodeVisibilityThreshold(node);
    const showLabel = isActive || isHovered || showNeighborLabel || zoomAllowsLabel;
    if (labelMaterialRef.current && labelRef.current) {
      labelRef.current.visible = showLabel;
      labelMaterialRef.current.opacity = showLabel
        ? obsidianStyle
          ? obsidianStyle.labelOpacity
          : 0.85
        : 0;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={glowRef}>
        <circleGeometry args={[glowRadius, 64]} />
        <meshBasicMaterial color={obsidianStyle ? obsidianStyle.accent : color} transparent opacity={0.25} />
      </mesh>
      <mesh ref={coreRef}>
        <circleGeometry args={[coreRadius, 64]} />
        <meshBasicMaterial color={obsidianStyle ? obsidianStyle.nodeFill : color} transparent opacity={1} />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[ringInner, ringOuter, 64]} />
        <meshBasicMaterial color={obsidianStyle ? obsidianStyle.accent : 'white'} transparent opacity={0.7} />
      </mesh>
      <Text
        ref={labelRef}
        position={[labelOffset, 0, 0.1]}
        fontSize={labelSize}
        fontWeight={600}
        color="white"
        anchorX="left"
        anchorY="middle"
        scale={[1, -1, 1]}
      >
        {node.id}
      </Text>
    </group>
  );
};
