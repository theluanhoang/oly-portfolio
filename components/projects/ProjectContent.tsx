import React from 'react';

interface ProjectContentProps {
  content?: string;
}

export default function ProjectContent({ content }: ProjectContentProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="project-content prose prose-lg max-w-none text-foreground">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

