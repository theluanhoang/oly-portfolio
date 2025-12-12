import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export default function StepIndicator({ 
  currentStep, 
  totalSteps,
  className = '' 
}: StepIndicatorProps) {
  return (
    <div className={`mb-8 flex items-center gap-4 ${className}`}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-1 ${
            currentStep >= i + 1 ? 'bg-[#333]' : 'bg-[#e0e0e0]'
          }`}
        />
      ))}
    </div>
  );
}

