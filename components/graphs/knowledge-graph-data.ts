import { CourseTreeCourse, GraphLink, GraphNode, QuizDetail, QuizStatus, RenderMode } from './knowledge-graph-types';

export const GRAPH_COLORS = ['#FF3B30', '#30D158', '#0A84FF', '#BF5AF2', '#FF9F0A', '#64D2FF'];
export const OBSIDIAN_ACCENT = '#3DDC84';

export const QUIZ_STATUS_STYLES: Record<QuizStatus, { label: string; color: string; textClass: string }> = {
  passed: { label: 'Passed', color: '#30D158', textClass: 'text-emerald-200' },
  upcoming: { label: 'Upcoming', color: '#FF9F0A', textClass: 'text-amber-200' },
  failed: { label: 'Failed', color: '#FF453A', textClass: 'text-rose-200' }
};

export const QUIZ_DETAILS: Record<string, QuizDetail> = {
  'math-quiz-1': {
    id: 'math-quiz-1',
    title: 'Quiz 1',
    subject: 'Math',
    status: 'passed',
    percent: 94,
    score: '94 / 100',
    date: 'Sep 3, 2025',
    topics: ['Vectors', 'Limits', 'Derivatives'],
    professors: ['Dr. Aisha Noor', 'Prof. Kareem Saleh'],
    place: 'Room A3',
    duration: '45 min'
  },
  'math-quiz-2': {
    id: 'math-quiz-2',
    title: 'Quiz 2',
    subject: 'Math',
    status: 'failed',
    percent: 42,
    score: '42 / 100',
    date: 'Aug 28, 2025',
    topics: ['Integrals', 'Series', 'Convergence'],
    professors: ['Dr. Aisha Noor'],
    place: 'Room B1',
    duration: '50 min'
  },
  'ai-quiz-1': {
    id: 'ai-quiz-1',
    title: 'Quiz 1',
    subject: 'Intro to AI',
    status: 'passed',
    percent: 88,
    score: '88 / 100',
    date: 'Aug 30, 2025',
    topics: ['Search', 'Knowledge graphs', 'Ethics'],
    professors: ['Prof. Lina Haddad'],
    place: 'Innovation Lab 2',
    duration: '40 min'
  },
  'python-quiz-1': {
    id: 'python-quiz-1',
    title: 'Quiz 1',
    subject: 'Python',
    status: 'upcoming',
    percent: 0,
    score: 'TBD',
    date: 'Sep 6, 2025',
    topics: ['Syntax', 'Data structures', 'Functions'],
    professors: ['Dr. Omar Faris'],
    place: 'Lab C2',
    duration: '35 min'
  },
  'econ-quiz-1': {
    id: 'econ-quiz-1',
    title: 'Quiz 1',
    subject: 'Economics',
    status: 'upcoming',
    percent: 0,
    score: 'TBD',
    date: 'Sep 8, 2025',
    topics: ['Supply & demand', 'Elasticity'],
    professors: ['Prof. Maya Chen'],
    place: 'Room D5',
    duration: '30 min'
  },
  'comms-quiz-1': {
    id: 'comms-quiz-1',
    title: 'Quiz 1',
    subject: 'Communication',
    status: 'upcoming',
    percent: 0,
    score: 'TBD',
    date: 'Sep 4, 2025',
    topics: ['Presentation flow', 'Storytelling'],
    professors: ['Dr. Rami Jaber'],
    place: 'Room B4',
    duration: '25 min'
  }
};

export const COURSE_TREE: CourseTreeCourse[] = [
  {
    id: 'python',
    label: 'Python',
    group: 1,
    sections: [
      {
        id: 'lectures',
        label: 'Lectures',
        items: [
          { id: 'python-lec-1', label: 'Lecture 1', type: 'lecture', date: '18/08/25' },
          { id: 'python-lec-2', label: 'Lecture 2', type: 'lecture', date: '20/08/25' }
        ]
      },
      {
        id: 'assignments',
        label: 'Assignments',
        items: [
          { id: 'python-assignment-1', label: 'Assignment 1', type: 'assignment', date: '22/08/25' },
          { id: 'python-assignment-2', label: 'Assignment 2', type: 'assignment', date: '28/08/25' }
        ]
      },
      {
        id: 'quizzes',
        label: 'Quizzes',
        items: [
          { id: 'python-quiz-1', label: 'Quiz 1', type: 'quiz', status: 'upcoming', percent: 0, nodeId: 'python-quiz-1' }
        ]
      }
    ]
  },
  {
    id: 'math',
    label: 'Math',
    group: 2,
    sections: [
      {
        id: 'lectures',
        label: 'Lectures',
        items: [
          { id: 'math-lecture-1', label: 'Lecture 1', type: 'lecture', date: '18/08/25' },
          { id: 'math-lecture-2', label: 'Lecture 2', type: 'lecture', date: '20/08/25' },
          { id: 'math-lecture-3', label: 'Lecture 3', type: 'lecture', date: '25/08/25' },
          { id: 'math-lecture-4', label: 'Lecture 4', type: 'lecture', date: '27/08/25' },
          { id: 'math-lecture-5', label: 'Lecture 5', type: 'lecture', date: '01/09/25' }
        ]
      },
      {
        id: 'assignments',
        label: 'Assignments',
        items: [
          { id: 'math-assignment-1', label: 'Assignment 1', type: 'assignment', date: '24/08/25' },
          { id: 'math-assignment-2', label: 'Assignment 2', type: 'assignment', date: '30/08/25' },
          { id: 'math-assignment-3', label: 'Assignment 3', type: 'assignment', date: '02/09/25' }
        ]
      },
      {
        id: 'quizzes',
        label: 'Quizzes',
        items: [
          { id: 'math-quiz-1', label: 'Quiz 1', type: 'quiz', status: 'passed', percent: 94, nodeId: 'math-quiz-1' },
          { id: 'math-quiz-2', label: 'Quiz 2', type: 'quiz', status: 'failed', percent: 42, nodeId: 'math-quiz-2' }
        ]
      }
    ]
  },
  {
    id: 'economics',
    label: 'Economics',
    group: 4,
    sections: [
      {
        id: 'lectures',
        label: 'Lectures',
        items: [
          { id: 'econ-lecture-1', label: 'Lecture 1', type: 'lecture', date: '19/08/25' },
          { id: 'econ-lecture-2', label: 'Lecture 2', type: 'lecture', date: '23/08/25' }
        ]
      },
      {
        id: 'assignments',
        label: 'Assignments',
        items: [
          { id: 'econ-assignment-1', label: 'Assignment 1', type: 'assignment', date: '29/08/25' }
        ]
      },
      {
        id: 'quizzes',
        label: 'Quizzes',
        items: [
          { id: 'econ-quiz-1', label: 'Quiz 1', type: 'quiz', status: 'upcoming', percent: 0, nodeId: 'econ-quiz-1' }
        ]
      }
    ]
  },
  {
    id: 'communication',
    label: 'Communication',
    group: 4,
    sections: [
      {
        id: 'lectures',
        label: 'Lectures',
        items: [
          { id: 'comms-lecture-1', label: 'Lecture 1', type: 'lecture', date: '21/08/25' },
          { id: 'comms-lecture-2', label: 'Lecture 2', type: 'lecture', date: '26/08/25' }
        ]
      },
      {
        id: 'assignments',
        label: 'Assignments',
        items: [
          { id: 'comms-assignment-1', label: 'Assignment 1', type: 'assignment', date: '03/09/25' }
        ]
      },
      {
        id: 'quizzes',
        label: 'Quizzes',
        items: [
          { id: 'comms-quiz-1', label: 'Quiz 1', type: 'quiz', status: 'upcoming', percent: 0, nodeId: 'comms-quiz-1' }
        ]
      }
    ]
  },
  {
    id: 'intro-ai',
    label: 'Intro to AI',
    group: 3,
    sections: [
      {
        id: 'lectures',
        label: 'Lectures',
        items: [
          { id: 'ai-lecture-1', label: 'Lecture 1', type: 'lecture', date: '17/08/25' },
          { id: 'ai-lecture-2', label: 'Lecture 2', type: 'lecture', date: '22/08/25' },
          { id: 'ai-lecture-3', label: 'Lecture 3', type: 'lecture', date: '29/08/25' }
        ]
      },
      {
        id: 'assignments',
        label: 'Assignments',
        items: [
          { id: 'ai-assignment-1', label: 'Assignment 1', type: 'assignment', date: '25/08/25' },
          { id: 'ai-assignment-2', label: 'Assignment 2', type: 'assignment', date: '05/09/25' }
        ]
      },
      {
        id: 'quizzes',
        label: 'Quizzes',
        items: [
          { id: 'ai-quiz-1', label: 'Quiz 1', type: 'quiz', status: 'passed', percent: 88, nodeId: 'ai-quiz-1' }
        ]
      }
    ]
  }
];

export const DEFAULT_COURSE_ID = 'math';
export const COURSE_GRAPH_ROOTS: Record<string, string> = {
  python: 'CompSci Major',
  math: 'Applied Math',
  economics: 'Business Minor',
  communication: 'Business Minor',
  'intro-ai': 'AI Specialization'
};

export const RENDER_OPTIONS: Array<{
  id: RenderMode;
  label: string;
  tag: string;
  description: string;
  detail: string;
}> = [
  {
    id: 'gemini-v1-svg',
    label: 'Gemini V1',
    tag: 'SVG',
    description: 'Original Gemini graph',
    detail: 'Full labels, colored clusters, soft glow nodes.'
  },
  {
    id: 'gemini-v1-webgl',
    label: 'Gemini V1 (webgl)',
    tag: 'WEBGL',
    description: 'Lens refraction render',
    detail: 'WebGL refraction with the fluid glass lens.'
  },
  {
    id: 'obsidian-v1-svg',
    label: 'Obsidian V1',
    tag: 'SVG',
    description: 'Muted mono layout',
    detail: 'Single-color dots, strict highlight on hover.'
  },
  {
    id: 'obsidian-v1-webgl',
    label: 'Obsidian V1 (webgl)',
    tag: 'WEBGL',
    description: 'Obsidian mono lens',
    detail: 'WebGL lens with the Obsidian mono palette.'
  },
  {
    id: 'obsidian-v2-svg',
    label: 'Obsidian V2',
    tag: 'SVG',
    description: 'Accent highlight layout',
    detail: 'Green accents and neighbor label hints.'
  },
  {
    id: 'obsidian-v2-webgl',
    label: 'Obsidian V2 (webgl)',
    tag: 'WEBGL',
    description: 'Accent lens layout',
    detail: 'WebGL refraction with accent rings and hover glow.'
  },
  {
    id: 'obsidian-v3-svg',
    label: 'Obsidian V3',
    tag: 'SVG',
    description: 'Sparse layout',
    detail: 'Softer links, minimal labels, calmer density.'
  },
  {
    id: 'obsidian-v3-webgl',
    label: 'Obsidian V3 (webgl)',
    tag: 'WEBGL',
    description: 'Sparse lens layout',
    detail: 'Muted WebGL scene with lower contrast links.'
  }
];

const enrichNode = (node: Omit<GraphNode, 'floatPhase' | 'floatSpeed'>): GraphNode => ({
  ...node,
  floatPhase: Math.random() * Math.PI * 2,
  floatSpeed: 0.5 + Math.random() * 0.5
});

const createGraphData = () => {
  const baseNodes = [
    { id: 'CompSci Major', type: 'hub', group: 1, val: 30 },
    { id: 'Web Development', type: 'course', group: 1, val: 15 },
    { id: 'React Frameworks', type: 'concept', group: 1, val: 5 },
    { id: 'Backend Systems', type: 'concept', group: 1, val: 5 },
    { id: 'Cloud Computing', type: 'course', group: 1, val: 12 },
    { id: 'Cybersecurity', type: 'course', group: 1, val: 12 },
    { id: 'Software Engineering', type: 'course', group: 1, val: 12 },
    { id: 'Databases', type: 'course', group: 1, val: 12 },
    { id: 'Applied Math', type: 'hub', group: 2, val: 30 },
    { id: 'Calculus', type: 'course', group: 2, val: 15 },
    { id: 'Linear Algebra', type: 'course', group: 2, val: 15 },
    { id: 'Statistics', type: 'course', group: 2, val: 14 },
    { id: 'Probability', type: 'course', group: 2, val: 12 },
    { id: 'Optimization', type: 'course', group: 2, val: 12 },
    { id: 'AI Specialization', type: 'hub', group: 3, val: 35 },
    { id: 'Intro to AI', type: 'course', group: 3, val: 15 },
    { id: 'Machine Learning', type: 'course', group: 3, val: 18 },
    { id: 'Computer Vision', type: 'course', group: 3, val: 14 },
    { id: 'NLP', type: 'course', group: 3, val: 15 },
    { id: 'Deep Learning', type: 'course', group: 3, val: 16 },
    { id: 'Generative AI', type: 'course', group: 3, val: 12 },
    { id: 'Business Minor', type: 'hub', group: 4, val: 25 },
    { id: 'Entrepreneurship', type: 'course', group: 4, val: 12 },
    { id: 'Economics', type: 'course', group: 4, val: 10 },
    { id: 'AI Ethics', type: 'course', group: 4, val: 14 },
    { id: 'Product Strategy', type: 'course', group: 4, val: 11 },
    { id: 'Finance', type: 'course', group: 4, val: 10 }
  ].map(enrichNode);

  const extraConcepts = [
    { id: 'Data Structures', group: 1 },
    { id: 'Algorithms', group: 1 },
    { id: 'Microservices', group: 1 },
    { id: 'Docker & K8s', group: 1 },
    { id: 'Cryptography', group: 1 },
    { id: 'Network Security', group: 1 },
    { id: 'API Design', group: 1 },
    { id: 'System Design', group: 1 },
    { id: 'DevOps', group: 1 },
    { id: 'Gradient Descent', group: 2 },
    { id: 'Matrices', group: 2 },
    { id: 'Bayesian Theorem', group: 2 },
    { id: 'Numerical Methods', group: 2 },
    { id: 'Stochastic Processes', group: 2 },
    { id: 'Neural Networks', group: 3 },
    { id: 'Loss Optimization', group: 3 },
    { id: 'Transformers', group: 3 },
    { id: 'LLMs', group: 3 },
    { id: 'Robotics', group: 3 },
    { id: 'Reinforcement Learning', group: 3 },
    { id: 'Foundation Models', group: 3 },
    { id: 'Edge AI', group: 3 },
    { id: 'Bias & Fairness', group: 4 },
    { id: 'Tech Policy', group: 4 },
    { id: 'Market Analysis', group: 4 },
    { id: 'Venture Capital', group: 4 },
    { id: 'Market Research', group: 4 }
  ].map((node) => enrichNode({ ...node, type: 'concept', val: 4 }));

  const nodes = [...baseNodes, ...extraConcepts];

  const links: GraphLink[] = [
    { source: 'CompSci Major', target: 'Web Development' },
    { source: 'Web Development', target: 'React Frameworks' },
    { source: 'Web Development', target: 'Backend Systems' },
    { source: 'CompSci Major', target: 'Cloud Computing' },
    { source: 'CompSci Major', target: 'Cybersecurity' },
    { source: 'CompSci Major', target: 'Software Engineering' },
    { source: 'CompSci Major', target: 'Databases' },
    { source: 'Databases', target: 'Data Structures' },
    { source: 'Applied Math', target: 'Calculus' },
    { source: 'Applied Math', target: 'Linear Algebra' },
    { source: 'Applied Math', target: 'Statistics' },
    { source: 'Applied Math', target: 'Probability' },
    { source: 'Applied Math', target: 'Optimization' },
    { source: 'Calculus', target: 'Gradient Descent' },
    { source: 'Linear Algebra', target: 'Matrices' },
    { source: 'Statistics', target: 'Bayesian Theorem' },
    { source: 'AI Specialization', target: 'Intro to AI' },
    { source: 'AI Specialization', target: 'Machine Learning' },
    { source: 'Machine Learning', target: 'Neural Networks' },
    { source: 'Machine Learning', target: 'Loss Optimization' },
    { source: 'AI Specialization', target: 'Computer Vision' },
    { source: 'AI Specialization', target: 'NLP' },
    { source: 'AI Specialization', target: 'Deep Learning' },
    { source: 'AI Specialization', target: 'Generative AI' },
    { source: 'Deep Learning', target: 'Generative AI' },
    { source: 'NLP', target: 'Transformers' },
    { source: 'NLP', target: 'LLMs' },
    { source: 'Business Minor', target: 'Entrepreneurship' },
    { source: 'Entrepreneurship', target: 'Economics' },
    { source: 'Business Minor', target: 'AI Ethics' },
    { source: 'Business Minor', target: 'Product Strategy' },
    { source: 'Business Minor', target: 'Finance' },
    { source: 'AI Ethics', target: 'Bias & Fairness' },
    { source: 'AI Ethics', target: 'Tech Policy' },
    { source: 'Gradient Descent', target: 'Loss Optimization', label: 'Math Foundation' },
    { source: 'Statistics', target: 'Machine Learning', label: 'Theory' },
    { source: 'LLMs', target: 'Bias & Fairness', label: 'Safety' }
  ];

  extraConcepts.forEach((node) => {
    if (!links.find((link) => link.target === node.id || link.source === node.id)) {
      let target = 'Business Minor';
      if (node.group === 1) target = 'CompSci Major';
      else if (node.group === 2) target = 'Applied Math';
      else if (node.group === 3) target = 'AI Specialization';
      links.push({ source: target, target: node.id });
    }
  });

  return { nodes, links };
};

const createCourseGraphData = () => {
  const base = createGraphData();
  const quizNodes: GraphNode[] = [];
  const quizLinks: GraphLink[] = [];
  const noteNodes: GraphNode[] = [];
  const noteLinks: GraphLink[] = [];

  COURSE_TREE.forEach((course) => {
    const rootId = COURSE_GRAPH_ROOTS[course.id];
    if (!rootId) return;
    const quizItems = course.sections.flatMap((section) => section.items).filter((item) => item.type === 'quiz' && item.nodeId);
    quizItems.forEach((item, index) => {
      const quizNumber = item.label.match(/\d+/)?.[0] ?? `${index + 1}`;
      const quizNode = enrichNode({
        id: item.nodeId ?? `${course.id}-quiz-${index + 1}`,
        label: item.label,
        shortLabel: `Q${quizNumber}`,
        type: 'quiz',
        group: course.group,
        val: 7,
        courseId: course.id,
        status: item.status ?? 'upcoming'
      });
      quizNodes.push(quizNode);
      quizLinks.push({ source: rootId, target: quizNode.id });
    });
  });

  [
    { id: 'math-note-1', label: 'Office hours recap', courseId: 'math', group: 2 },
    { id: 'ai-note-1', label: 'Project pitch sketch', courseId: 'intro-ai', group: 3 }
  ].forEach((note) => {
    const rootId = COURSE_GRAPH_ROOTS[note.courseId];
    if (!rootId) return;
    const noteNode = enrichNode({
      id: note.id,
      label: note.label,
      shortLabel: 'N',
      type: 'note',
      group: note.group,
      val: 6,
      courseId: note.courseId
    });
    noteNodes.push(noteNode);
    noteLinks.push({ source: rootId, target: noteNode.id });
  });

  return {
    nodes: [...base.nodes, ...quizNodes, ...noteNodes],
    links: [...base.links, ...quizLinks, ...noteLinks]
  };
};

export const BASE_GRAPH_DATA = createGraphData();
export const COURSE_GRAPH_DATA = createCourseGraphData();
