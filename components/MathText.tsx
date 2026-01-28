import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type MathTextProps = {
  text?: string;
  latex?: string;
  className?: string;
};

type Segment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string };

// Split content into text + math fragments supporting $, $$, \( \), \[ \], and \begin{...}...\end{...}
const splitMathSegments = (content: string): Segment[] => {
  const pattern =
    /(\\\[([\s\S]+?)\\\]|\\\((.+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$]+)\$|\\begin\{[^}]+\}[\s\S]+?\\end\{[^}]+\})/g;

  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }

    const token = match[0];

    if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({ type: 'block', value: token.slice(2, -2).trim() });
    } else if (token.startsWith('$')) {
      segments.push({ type: 'inline', value: token.slice(1, -1).trim() });
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      segments.push({ type: 'block', value: token.slice(2, -2).trim() });
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      segments.push({ type: 'inline', value: token.slice(2, -2).trim() });
    } else if (token.startsWith('\\begin')) {
      segments.push({ type: 'block', value: token.trim() });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return segments;
};

// Lightweight renderer that supports an explicit LaTeX block via `latex`,
// or inline TeX wrapped in $...$ inside the `text`.
export const MathText: React.FC<MathTextProps> = ({ text, latex, className }) => {
  if (latex && latex.trim()) {
    return (
      <div className={className}>
        <BlockMath math={latex} errorColor="#ef4444" />
      </div>
    );
  }

  const content = text ?? '';
  const segments = splitMathSegments(content);

  if (!segments.length) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <span key={`t-${idx}`}>{seg.value}</span>;
        }
        if (seg.type === 'inline') {
          return <InlineMath key={`i-${idx}`} math={seg.value} errorColor="#ef4444" />;
        }
        return <BlockMath key={`b-${idx}`} math={seg.value} errorColor="#ef4444" />;
      })}
    </div>
  );
};
