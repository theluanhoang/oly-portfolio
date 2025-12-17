'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface AnimatedTextProps {
  text: string;
  isExpanded: boolean;
  baseDelay?: number;
  animationMode: 'centerSpread' | 'directionalSpread';
  direction?: 'left' | 'right';
}

function AnimatedText({
  text,
  isExpanded,
  baseDelay = 0,
  animationMode,
  direction = 'left',
}: AnimatedTextProps) {
  const chars = text.split('');
  const totalChars = chars.length;
  const spreadAmount = 300;

  return (
    <div className="flex">
      {chars.map((char, index) => {
        const midPoint = (totalChars - 1) / 2;
        const safeMidPoint = midPoint === 0 ? 1 : midPoint;
        const distanceFromCenter = Math.abs(index - midPoint);
        const delayStep = 30;
        const position = index / (totalChars - 1 || 1);

        let translateX = 0;
        if (animationMode === 'centerSpread') {
          const normalized = (index - midPoint) / safeMidPoint;
          translateX = normalized * (spreadAmount / 2);
        } else {
          translateX =
            direction === 'left'
              ? -(1 - position) * spreadAmount
              : position * spreadAmount;
        }

        const delayFromChar =
          animationMode === 'centerSpread'
            ? distanceFromCenter * delayStep
            : direction === 'left'
              ? (totalChars - 1 - index) * delayStep
              : index * delayStep;

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
              transitionDelay: `${baseDelay + delayFromChar}ms`,
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
  const t = useTranslations('HomePage');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMdUp, setIsMdUp] = useState(false);

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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsMdUp(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const animationTiming = useMemo(() => {
    const words = [
      t('architecture'),
      t('construction'),
      t('interior'),
      t('furniture'),
    ];
    const charDelay = 30;
    const endPadding = 150;
    const pairOverlap = 120; 
    const earlyCharOffset = charDelay * 2; 

    const durations = words.map(
      (w) => (w.length - 1) * charDelay + endPadding
    );

    const outerPairDuration = Math.max(durations[0], durations[3]);
    const innerPairStart = Math.max(0, outerPairDuration - pairOverlap - earlyCharOffset);
    const mdDelays = [
      0,
      innerPairStart,
      innerPairStart,
      0,
    ];

    return { durations, mdDelays, charDelay };
  }, [t]);

  return (
    <div className="fixed inset-0 bg-dark flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between md:gap-8">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-8 order-2 md:order-1 mt-[60px] md:mt-0">
          <AnimatedText 
            text={t('architecture')} 
            isExpanded={isExpanded} 
            baseDelay={isMdUp ? animationTiming.mdDelays[0] : 0}
            animationMode={isMdUp ? 'directionalSpread' : 'centerSpread'}
            direction="left"
          />
          <AnimatedText 
            text={t('construction')} 
            isExpanded={isExpanded} 
            baseDelay={isMdUp ? animationTiming.mdDelays[1] : 100}
            animationMode={isMdUp ? 'directionalSpread' : 'centerSpread'}
            direction="left"
          />
        </div>

        <div className="shrink-0 order-1 md:order-2">
          <img
            src="/assets/logo-home.svg"
            alt="OLY Logo"
            className={`h-auto transition-all duration-800 brightness-0 invert ${
              isExpanded ? 'scale-110 opacity-80' : 'scale-100 opacity-100'
            }`}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-8 order-3 mt-[40px] md:mt-0">
          <AnimatedText 
            text={t('interior')} 
            isExpanded={isExpanded} 
            baseDelay={isMdUp ? animationTiming.mdDelays[2] : 0}
            animationMode={isMdUp ? 'directionalSpread' : 'centerSpread'}
            direction="right"
          />
          <AnimatedText 
            text={t('furniture')} 
            isExpanded={isExpanded} 
            baseDelay={isMdUp ? animationTiming.mdDelays[3] : 100}
            animationMode={isMdUp ? 'directionalSpread' : 'centerSpread'}
            direction="right"
          />
        </div>
      </div>
    </div>
  );
}

