import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  text = 'Đang tải...', 
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-background text-foreground ${className}`}>
      <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mb-4"></div>
      {text && (
        <p className="text-foreground tracking-[2px] uppercase text-sm">{text}</p>
      )}
    </div>
  );
}

