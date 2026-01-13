const getGridPosition = (isLayout1: boolean, imageIndex: number): string => {
  if (isLayout1) {
    if (imageIndex === 0) return 'row-span-2 col-span-3 row-start-1 col-start-1';
    if (imageIndex === 1) return 'row-span-3 col-span-2 row-start-1 col-start-4';
    if (imageIndex === 2) return 'row-span-3 col-span-3 row-start-3 col-start-1';
    return 'row-span-2 col-span-2 row-start-4 col-start-4';
  } else {
    if (imageIndex === 0) return 'row-span-2 col-span-2 row-start-1 col-start-1';
    if (imageIndex === 1) return 'row-span-3 col-span-3 row-start-1 col-start-3';
    if (imageIndex === 2) return 'row-span-3 col-span-2 row-start-3 col-start-1';
    return 'row-span-2 col-span-3 row-start-4 col-start-3';
  }
};

interface ProjectSectionSkeletonProps {
  sectionIndex: number;
}

export default function ProjectSectionSkeleton({ sectionIndex }: ProjectSectionSkeletonProps) {
  const isLayout1 = sectionIndex % 2 === 0;

  return (
    <div
      className="project-gallery-section w-full h-full aspect-square md:w-[calc((100%-10px)/2)] md:h-[calc((100%-10px)/2)] lg:w-[calc((100%-20px)/3)] lg:h-[calc((100%-20px)/3)] max-w-[calc((1512px-84px-20px)/3)] max-h-[calc((1512px-84px-20px)/3)] min-w-0 relative grid grid-cols-5 grid-rows-5 md:gap-[10px] gap-[5px] shrink-0"
    >
      {Array.from({ length: 4 }).map((_, imageIndex) => (
        <div
          key={imageIndex}
          className={`relative overflow-hidden bg-gray-200 animate-pulse ${getGridPosition(isLayout1, imageIndex)}`}
        >
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200"></div>
        </div>
      ))}
    </div>
  );
}
