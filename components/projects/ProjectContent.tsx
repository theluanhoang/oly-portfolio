import React from 'react';

interface ProjectContentProps {
  content?: string;
}

export default function ProjectContent({ content }: ProjectContentProps) {
  if (!content) {
    return null;
  }

  return (
    <section className="relative bg-background py-20 px-8 md:px-12 lg:px-24">
      {/* Background texture effect */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
      
      <div className="relative max-w-4xl mx-auto">
        <div 
          className="project-content prose prose-lg max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

