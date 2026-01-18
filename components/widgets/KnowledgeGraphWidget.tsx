import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { WidgetContainer } from '../WidgetContainer';
import { Brain, Search, Sparkles } from 'lucide-react';
import { generateKnowledgeGraph } from '../../services/geminiService';
import { GraphData, GraphNode, GraphLink } from '../../types';

interface WidgetProps {
  isEditable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const KnowledgeGraphWidget: React.FC<WidgetProps> = (props) => {
  const { isEditable } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [data, setData] = useState<GraphData>({
    nodes: [
      { id: "AI", group: 1 },
      { id: "Machine Learning", group: 2 },
      { id: "Deep Learning", group: 2 },
      { id: "Neural Networks", group: 3 },
      { id: "Computer Vision", group: 2 }
    ],
    links: [
      { source: "AI", target: "Machine Learning" },
      { source: "Machine Learning", target: "Deep Learning" },
      { source: "Deep Learning", target: "Neural Networks" },
      { source: "AI", target: "Computer Vision" }
    ]
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    const result = await generateKnowledgeGraph(searchTerm);
    setLoading(false);
    if (result && result.nodes.length > 0) {
      setData(result);
    }
  };

  // Resize Observer to handle RGL resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || dimensions.width === 0) return;

    const { width, height } = dimensions;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Re-initialize simulation with new center
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d) => d.group === 1 ? 12 : 8)
      .attr("fill", (d) => d.group === 1 ? "#3b82f6" : d.group === 2 ? "#8b5cf6" : "#ec4899")
      .call(drag(simulation) as any);

    node.append("title").text((d) => d.id);

    const labels = svg.append("g")
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .text((d) => d.id)
        .attr("font-size", "10px")
        .attr("dx", 12)
        .attr("dy", 4)
        .attr("fill", "#4b5563")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

  }, [data, dimensions]);

  return (
    <WidgetContainer 
        {...props}
        title="AI Knowledge Graph"
        icon={<Brain size={18} />}
        headerAction={
             <form onSubmit={handleSearch} className="flex bg-gray-100 rounded-lg px-2 py-1 items-center w-40 md:w-48" onMouseDown={e => e.stopPropagation()}>
                <Search size={14} className="text-gray-400 mr-2" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Explore topic..."
                    className="bg-transparent text-xs w-full outline-none text-gray-700 placeholder-gray-400"
                />
             </form>
        }
        isEditable={isEditable}
    >
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {loading && (
             <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="animate-spin text-indigo-500" />
             </div>
        )}
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </WidgetContainer>
  );
};