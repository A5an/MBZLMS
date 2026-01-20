import * as d3 from 'd3';

export type QuizStatus = 'upcoming' | 'failed' | 'passed';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  val: number;
  type: string;
  label?: string;
  courseId?: string;
  status?: QuizStatus;
  shortLabel?: string;
  floatPhase: number;
  floatSpeed: number;
  visualY?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

export type CourseItemType = 'lecture' | 'assignment' | 'quiz';

export interface CourseTreeItem {
  id: string;
  label: string;
  type: CourseItemType;
  date?: string;
  status?: QuizStatus;
  percent?: number;
  nodeId?: string;
}

export interface CourseTreeSection {
  id: string;
  label: string;
  items: CourseTreeItem[];
}

export interface CourseTreeCourse {
  id: string;
  label: string;
  group: number;
  sections: CourseTreeSection[];
}

export interface QuizDetail {
  id: string;
  title: string;
  subject: string;
  status: QuizStatus;
  percent: number;
  score: string;
  date: string;
  topics: string[];
  professors: string[];
  place: string;
  duration: string;
}

export type ObsidianVariant = 'obsidian-v1' | 'obsidian-v2' | 'obsidian-v3';

export type RenderMode =
  | 'gemini-v1-svg'
  | 'gemini-v1-webgl'
  | 'obsidian-v1-svg'
  | 'obsidian-v2-svg'
  | 'obsidian-v3-svg'
  | 'obsidian-v1-webgl'
  | 'obsidian-v2-webgl'
  | 'obsidian-v3-webgl';

export interface ObsidianStyle {
  accent: string;
  nodeFill: string;
  nodeDimOpacity: number;
  linkBase: string;
  linkDim: string;
  linkWidth: number;
  linkHoverWidth: number;
  nodeRadiusBase: number;
  nodeRadiusStep: number;
  labelOpacity: number;
  showNeighborLabels: boolean;
  showAccentRings: boolean;
}
