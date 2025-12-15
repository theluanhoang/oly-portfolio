import { useEffect, useRef, useState, useCallback } from 'react';

interface UseHorizontalScrollReturn {
  galleryRef: (node: HTMLElement | null) => void;
  spacerRef: (node: HTMLElement | null) => void;
  scrollIndicatorRef: React.RefObject<HTMLDivElement | null>;
}

export function useHorizontalScroll(): UseHorizontalScrollReturn {
  const galleryRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLElement | null>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  const setupScrollEffect = useCallback((): (() => void) | undefined => {
    const gallery = galleryRef.current;
    const spacer = spacerRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!gallery || !spacer) {
      return undefined;
    }

    // Store references to avoid null checks in nested functions
    const galleryEl = gallery;
    const spacerEl = spacer;

    function calculateTotalWidth(): number {
      const sections = galleryEl.querySelectorAll('.project-gallery-section');
      if (sections.length === 0) return 0;
      
      const firstSection = sections[0] as HTMLElement;
      const sectionWidth = firstSection.offsetWidth || 610;
      const gap = 10;
      return sections.length * (sectionWidth + gap) - gap;
    }

    function updateSpacerHeight(): void {
      const totalWidth = calculateTotalWidth();
      if (totalWidth === 0) {
        spacerEl.style.height = '100vh';
        return;
      }
      
      const wrapper = galleryEl.parentElement;
      if (!wrapper) {
        spacerEl.style.height = `${totalWidth}px`;
        return;
      }
      
      const wrapperWidth = wrapper.offsetWidth;
      const availableWidth = wrapperWidth;
      
      const scrollDistance = totalWidth - availableWidth;
      
      if (scrollDistance > 0) {
        spacerEl.style.height = `${scrollDistance + window.innerHeight}px`;
      } else {
        spacerEl.style.height = '100vh';
      }
    }

    let ticking = false;

    function updateGalleryPosition(): void {
      const totalWidth = calculateTotalWidth();
      if (totalWidth === 0) {
        galleryEl.style.transform = 'translateX(0px)';
        ticking = false;
        return;
      }

      const scrolled = window.pageYOffset || window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = maxScroll > 0 ? scrolled / maxScroll : 0;
      
      const wrapper = galleryEl.parentElement;
      if (!wrapper) {
        galleryEl.style.transform = 'translateX(0px)';
        ticking = false;
        return;
      }
      
      const wrapperWidth = wrapper.offsetWidth;
      const availableWidth = wrapperWidth;
      const maxTranslate = -(totalWidth - availableWidth);
      
      if (totalWidth <= availableWidth) {
        galleryEl.style.transform = 'translateX(0px)';
      } else {
        const translateX = Math.max(maxTranslate, Math.min(0, maxTranslate * scrollPercentage));
        galleryEl.style.transform = `translateX(${translateX}px)`;
      }
      
      ticking = false;
    }

    function handleScroll(): void {
      if (!ticking) {
        window.requestAnimationFrame(updateGalleryPosition);
        ticking = true;
      }

      if (!hasScrolled && (window.pageYOffset || window.scrollY) > 50) {
        setHasScrolled(true);
        if (scrollIndicator) {
          scrollIndicator.style.opacity = '0';
        }
      }
    }

    function handleResize(): void {
      updateSpacerHeight();
      updateGalleryPosition();
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSpacerHeight();
      updateGalleryPosition();
    });

    resizeObserver.observe(galleryEl);

    const mutationObserver = new MutationObserver(() => {
      updateSpacerHeight();
      updateGalleryPosition();
    });

    mutationObserver.observe(galleryEl, {
      childList: true,
      subtree: true
    });

    updateSpacerHeight();
    updateGalleryPosition();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [hasScrolled]);

  useEffect(() => {
    if (isReady) {
      return setupScrollEffect();
    }
  }, [isReady, setupScrollEffect]);

  const galleryCallbackRef = useCallback((node: HTMLElement | null) => {
    galleryRef.current = node;
    if (node && spacerRef.current) {
      setIsReady(true);
    }
  }, []);

  const spacerCallbackRef = useCallback((node: HTMLElement | null) => {
    spacerRef.current = node;
    if (node && galleryRef.current) {
      setIsReady(true);
    }
  }, []);

  return {
    galleryRef: galleryCallbackRef,
    spacerRef: spacerCallbackRef,
    scrollIndicatorRef
  };
}
