import React from 'react';
import { Brain } from 'lucide-react';
import { WidgetContainer } from '../WidgetContainer';
import { KnowledgeGraphScene } from '../graphs/KnowledgeGraphScene';

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

  return (
    <WidgetContainer
      {...props}
      title="Knowledge Graph"
      subtitle="Curriculum map"
      icon={<Brain size={18} />}
      isEditable={isEditable}
      noPadding
    >
      <div className="flex-1 min-h-0 p-2">
        <KnowledgeGraphScene />
      </div>
    </WidgetContainer>
  );
};
