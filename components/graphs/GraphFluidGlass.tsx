import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FluidGlassLens } from '../FluidGlass';

interface GraphFluidGlassProps {
  svgRef: React.RefObject<SVGSVGElement>;
  eventSource?: HTMLElement | null;
  className?: string;
}

const GraphTexturePlane: React.FC<{ svgRef: React.RefObject<SVGSVGElement> }> = ({ svgRef }) => {
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const texture = useMemo(() => {
    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.generateMipmaps = false;
    nextTexture.flipY = false;
    return nextTexture;
  }, [canvas]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pendingRef = useRef(false);
  const lastFrameRef = useRef(0);
  const { viewport } = useThree();

  useEffect(() => {
    ctxRef.current = canvas.getContext('2d');
    return () => {
      texture.dispose();
    };
  }, [canvas, texture]);

  useFrame(({ clock }) => {
    const svg = svgRef.current;
    const ctx = ctxRef.current;
    if (!svg || !ctx || pendingRef.current) return;

    const elapsed = clock.getElapsedTime();
    if (elapsed - lastFrameRef.current < 1 / 20) return;
    lastFrameRef.current = elapsed;

    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const bounds = svg.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    if (width === 0 || height === 0) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = imageRef.current ?? new Image();
    imageRef.current = img;
    pendingRef.current = true;

    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      texture.needsUpdate = true;
      pendingRef.current = false;
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      pendingRef.current = false;
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};

export const GraphFluidGlass: React.FC<GraphFluidGlassProps> = ({ svgRef, eventSource, className }) => (
  <FluidGlassLens className={className} eventSource={eventSource}>
    <GraphTexturePlane svgRef={svgRef} />
  </FluidGlassLens>
);
