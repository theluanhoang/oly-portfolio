'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface ConvergeTextProps {
  text: string;
  isConverged: boolean;
  side: 'left' | 'right';
  distanceFromCenter: number;
  isCenterWord: boolean;
  viewportWidth: number;
}

function ConvergeText({
  text,
  isConverged,
  side,
  distanceFromCenter: wordOffset,
  isCenterWord,
  viewportWidth,
}: ConvergeTextProps) {
  const chars = text.split('');
  const effectiveWidth = viewportWidth || 1440;
  const spreadBase = effectiveWidth * 0.65;
  const spreadStep = effectiveWidth * 0.08;
  const delayStep = 40;
  const baseDuration = 1000;

  return (
    <div className="flex">
      {chars.map((char, index) => {
        let charDistanceFromCenter: number;
        
        if (side === 'left') {
          if (isCenterWord) {
            charDistanceFromCenter = text.length - 1 - index;
          } else {
            charDistanceFromCenter = wordOffset + (text.length - 1 - index);
          }
        } else {
          if (isCenterWord) {
            charDistanceFromCenter = index;
          } else {
            charDistanceFromCenter = wordOffset + index;
          }
        }
        
        const offsetByIndex = spreadBase + charDistanceFromCenter * spreadStep;
        const initialOffset = side === 'left' ? -offsetByIndex : offsetByIndex;
        
        const translateX = isConverged ? 0 : initialOffset;
        const delay = charDistanceFromCenter * delayStep;

        return (
          <span
            key={index}
            className="text-white uppercase text-base font-normal leading-normal transition-all inline-block opacity-100"
            style={{ 
              transform: `translateX(${translateX}px)`,
              transitionDelay: `${delay}ms`,
              transitionDuration: `${baseDuration}ms`,
              transitionTimingFunction: 'ease-in-out',
              letterSpacing: '2.08px',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </div>
  );
}

interface ConvergeTextSplitProps {
  text: string;
  isConverged: boolean;
  viewportWidth: number;
}

function ConvergeTextSplit({
  text,
  isConverged,
  viewportWidth,
}: ConvergeTextSplitProps) {
  const chars = text.split('');
  const midPoint = Math.floor(chars.length / 2);
  const leftHalf = chars.slice(0, midPoint);
  const rightHalf = chars.slice(midPoint);

  const effectiveWidth = viewportWidth || 1512;
  const spreadBase = effectiveWidth * 0.55;
  const spreadStep = effectiveWidth * 0.06;
  const delayStep = 35;
  const baseDuration = 900;

  return (
    <div className="flex">
      {leftHalf.map((char, index) => {
        const distanceFromCenter = leftHalf.length - 1 - index;
        const offsetByIndex = spreadBase + distanceFromCenter * spreadStep;
        const initialOffset = -offsetByIndex;
        const translateX = isConverged ? 0 : initialOffset;
        const delay = distanceFromCenter * delayStep;

        return (
          <span
            key={`left-${index}`}
            className="text-white uppercase text-base font-normal leading-normal transition-all inline-block opacity-100"
            style={{ 
              transform: `translateX(${translateX}px)`,
              transitionDelay: `${delay}ms`,
              transitionDuration: `${baseDuration}ms`,
              transitionTimingFunction: 'ease-in-out',
              letterSpacing: '2.08px',
              fontFamily: 'var(--font-gayathri), sans-serif'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
      {rightHalf.map((char, index) => {
        const distanceFromCenter = index;
        const offsetByIndex = spreadBase + distanceFromCenter * spreadStep;
        const initialOffset = offsetByIndex;
        const translateX = isConverged ? 0 : initialOffset;
        const delay = distanceFromCenter * delayStep;

        return (
          <span
            key={`right-${index}`}
            className="text-white uppercase text-base font-normal leading-normal transition-all inline-block opacity-100"
            style={{ 
              transform: `translateX(${translateX}px)`,
              transitionDelay: `${delay}ms`,
              transitionDuration: `${baseDuration}ms`,
              transitionTimingFunction: 'ease-in-out',
              letterSpacing: '2.08px',
              fontFamily: 'var(--font-gayathri), sans-serif'
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
  const t = useTranslations('HomePage');
  const [isConverged, setIsConverged] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMdUp, setIsMdUp] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const convergeTimer = setTimeout(() => {
      setIsConverged(true);
    }, 500);

    const fadeOutTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 3500); 

    const redirectTimer = setTimeout(() => {
      router.push('/projects');
    }, 4000);

    return () => {
      clearTimeout(convergeTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsMdUp(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth || 0);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const architecture = t('architecture');
  const construction = t('construction');
  const interior = t('interior');
  const furniture = t('furniture');

  return (
    <div 
      className={`fixed inset-0 bg-dark flex items-center justify-center overflow-hidden transition-opacity duration-500 ease-in-out ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div 
        className={`relative w-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between md:gap-8 transition-transform duration-500 ease-in-out ${
          isTransitioning ? 'scale-95' : 'scale-100'
        }`}
      >
        {isMdUp ? (
          <>
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-8 order-2 md:order-1 mt-[60px] md:mt-0">
              <ConvergeText 
                text={architecture} 
                isConverged={isConverged} 
                side="left"
                distanceFromCenter={construction.length}
                isCenterWord={false}
                viewportWidth={viewportWidth}
              />
              <ConvergeText 
                text={construction} 
                isConverged={isConverged} 
                side="left"
                distanceFromCenter={0}
                isCenterWord={true}
                viewportWidth={viewportWidth}
              />
            </div>

            <div className="shrink-0 order-1 md:order-2">
              <img
                src="/assets/logo-home.svg"
                alt="OLY Logo"
                className="h-auto transition-all duration-800 brightness-0 invert scale-100 opacity-100"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-8 order-3 mt-[40px] md:mt-0">
              <ConvergeText 
                text={interior} 
                isConverged={isConverged} 
                side="right"
                distanceFromCenter={0}
                isCenterWord={true}
                viewportWidth={viewportWidth}
              />
              <ConvergeText 
                text={furniture} 
                isConverged={isConverged} 
                side="right"
                distanceFromCenter={interior.length}
                isCenterWord={false}
                viewportWidth={viewportWidth}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-10 order-2 mt-[60px]">
              <ConvergeTextSplit 
                text={architecture} 
                isConverged={isConverged} 
                viewportWidth={viewportWidth}
              />
              <ConvergeTextSplit 
                text={construction} 
                isConverged={isConverged} 
                viewportWidth={viewportWidth}
              />
            </div>

            <div className="shrink-0 order-1">
              <img
                src="/assets/logo-home.svg"
                alt="OLY Logo"
                className="h-auto transition-all duration-800 brightness-0 invert scale-100 opacity-100"
              />
            </div>

            <div className="flex flex-col items-center gap-10 order-3 mt-[40px]">
              <ConvergeTextSplit 
                text={interior} 
                isConverged={isConverged} 
                viewportWidth={viewportWidth}
              />
              <ConvergeTextSplit 
                text={furniture} 
                isConverged={isConverged} 
                viewportWidth={viewportWidth}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

