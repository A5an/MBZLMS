import * as d3 from 'd3';

export interface Course {
  id: string;
  name: string;
  code: string;
  progress: number;
  color: string;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  urgent: boolean;
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  date: string;
}

export interface Event {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'meeting' | 'class' | 'social';
}

export interface GradeData {
  subject: string;
  A: number;
  fullMark: number;
}

// Graph Types
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}