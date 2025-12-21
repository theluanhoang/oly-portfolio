'use client';

import { ReactNode } from 'react';

interface TabButtonProps {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
}

export default function TabButton({ children, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-black text-left text-[22px] min-[1122px]:text-[18px] min-[1392px]:text-[22px] font-bold tracking-[3px] uppercase leading-normal relative z-10 ${
        isActive
          ? 'min-[1123px]:after:content-[""] min-[1123px]:after:absolute min-[1123px]:after:left-0 min-[1123px]:after:-bottom-px min-[1123px]:after:w-full min-[1123px]:after:h-[2px] min-[1123px]:after:bg-black min-[1123px]:after:transition-all min-[1123px]:after:duration-300 min-[1123px]:after:ease-in-out min-[1123px]:after:scale-x-100 min-[1123px]:after:origin-left'
          : 'min-[1123px]:after:content-[""] min-[1123px]:after:absolute min-[1123px]:after:left-0 min-[1123px]:after:-bottom-px min-[1123px]:after:w-full min-[1123px]:after:h-[2px] min-[1123px]:after:bg-black min-[1123px]:after:scale-x-0 min-[1123px]:after:origin-left min-[1123px]:after:transition-all min-[1123px]:after:duration-300 min-[1123px]:after:ease-in-out min-[1123px]:hover:after:scale-x-100'
      }`}
    >
      {children}
    </button>
  );
}

