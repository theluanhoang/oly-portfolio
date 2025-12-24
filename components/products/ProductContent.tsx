interface ProductContentProps {
  content?: string;
}

export default function ProductContent({ content }: ProductContentProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="project-content prose prose-lg max-w-none text-foreground">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}


