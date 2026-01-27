import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type MathTextProps = {
  text?: string;
  latex?: string;
  className?: string;
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
  const parts: React.ReactNode[] = [];
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`} className={className}>
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }
    parts.push(<InlineMath key={`m-${match.index}`} math={match[1]} errorColor="#ef4444" />);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`t-${lastIndex}`} className={className}>
        {content.slice(lastIndex)}
      </span>
    );
  }

  return <div className={className}>{parts.length ? parts : content}</div>;
};
