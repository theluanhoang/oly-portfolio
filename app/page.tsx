'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnimatedTextProps {
  text: string;
  isExpanded: boolean;
  direction?: 'left' | 'right';
  baseDelay?: number;
}

function AnimatedText({ text, isExpanded, direction = 'left', baseDelay = 0 }: AnimatedTextProps) {
  const chars = text.split('');
  const totalChars = chars.length;

  return (
    <div className="flex">
      {chars.map((char, index) => {
        const position = index / (totalChars - 1 || 1);
        const spreadAmount = 300;
        
        let translateX = 0;
        if (direction === 'left') {
          translateX = -(1 - position) * spreadAmount;
        } else {
          translateX = position * spreadAmount;
        }

        return (
          <span
            key={index}
            className={`text-white uppercase text-base font-normal leading-normal transition-all duration-800 ease-out inline-block ${
              isExpanded ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ 
              transform: isExpanded 
                ? `translateX(${translateX}px)` 
                : 'translateX(0px)',
              transitionDelay: `${baseDelay + index * 30}ms`,
              letterSpacing: '2.08px',
              fontFamily: 'Gayathri'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 500);

    const redirectTimer = setTimeout(() => {
      router.push('/projects');
    }, 2000);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-dark flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-6xl mx-auto px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <AnimatedText 
            text="ARCHITECTURE" 
            isExpanded={isExpanded} 
            direction="left" 
            baseDelay={0}
          />
          <AnimatedText 
            text="CONSTRUCTION" 
            isExpanded={isExpanded} 
            direction="left" 
            baseDelay={100}
          />
        </div>

        <div className="shrink-0">
          <img
            src="/assets/logo-home.svg"
            alt="OLY Logo"
            className={`h-auto transition-all duration-800 brightness-0 invert ${
              isExpanded ? 'scale-110 opacity-80' : 'scale-100 opacity-100'
            }`}
          />
        </div>

        <div className="flex items-center gap-8">
          <AnimatedText 
            text="INTERIOR" 
            isExpanded={isExpanded} 
            direction="right" 
            baseDelay={0}
          />
          <AnimatedText 
            text="FURNITURE" 
            isExpanded={isExpanded} 
            direction="right" 
            baseDelay={100}
          />
        </div>
      </div>
    </div>
  );
}
