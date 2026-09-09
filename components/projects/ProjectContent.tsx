'use client';

import React from 'react';
import { VisualContentRenderer } from './VisualContentRenderer';

const VISUAL_PREFIX = '__VISUAL_v1__';

interface ProjectContentProps {
  content?: string;
}

export default function ProjectContent({ content }: ProjectContentProps) {
  if (!content) return null;

  // Visual Editor V3 format
  if (content.startsWith(VISUAL_PREFIX)) {
    return (
      <div className="project-visual-content">
        <VisualContentRenderer content={content} fluid={true} />
      </div>
    );
  }

  // Classic TiptapEditor HTML format
  return (
    <div className="project-content max-w-none text-foreground">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
