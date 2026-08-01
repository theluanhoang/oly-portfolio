'use client';

import { useRef, useEffect } from 'react';
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Button } from "../ui";

interface FooterProps {
  isFixed?: boolean;
}

export default function Footer({ isFixed = false }: FooterProps) {
  const t = useTranslations('Footer');
  const router = useRouter();
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--footer-height', `${height}px`);
      }
    });

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const positionClasses = isFixed
    ? "fixed bottom-0 left-0 right-0 z-10"
    : "relative z-10";
  const { isSm } = useResponsive();

  const handleContactClick = () => {
    router.push('/contact');
  };
  return (
    <footer ref={footerRef} className={`${positionClasses} bg-background`}>
      <div className="wrapper flex items-start justify-between py-10! min-[468px]:pr-10! pr-[6px]!">
        {isSm ? (
          <div className="flex items-start justify-between gap-[10px] w-full">
            <div className="flex flex-col gap-[9px]">
              <p className="text-black max-w-[743px] min-[843px]:text-[16px] text-[10px] font-bold leading-normal tracking-[2.52px]">
                {t('tagline')}
              </p>
              <div className="flex min-[747px]:flex-row flex-col min-[747px]:items-center items-start min-[747px]:gap-[77px] gap-[9px]">
                <a
                  href="mailto:info@olystudio.vn"
                  className="text-black min-[843px]:text-[16px] text-[10px] font-bold leading-normal tracking-[2.52px] underline decoration-skip-ink-none hover:opacity-80 transition-opacity"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  info@olystudio.vn
                </a>
                <a
                  href="tel:0902757525"
                  className="text-black min-[843px]:text-[16px] text-[10px] font-bold leading-normal tracking-[2.52px] underline decoration-skip-ink-none hover:opacity-80 transition-opacity"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('hotlineNumber')}
                </a>
              </div>
            </div>
            <Button
              onClick={handleContactClick}
              className="min-[1455px]:block hidden px-[10px]! py-[5px]! gap-[10px] border-[0.5px] border-black bg-white text-black! text-center text-[10px] font-normal leading-[20px] tracking-[0.5px]! uppercase hover:bg-white"
              style={{ textEdge: "cap", leadingTrim: "both" } as React.CSSProperties}
            >
              {t('contactForConsultation')}
            </Button>
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center justify-between">
                <a
                  href="https://zalo.me/0902757525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('zalo')}
                </a>
                <a
                  href="https://www.facebook.com/olystudio.18"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('facebook')}
                </a>
                <a
                  href="https://www.youtube.com/@olystudio4524?si=odaF8cXrnZojdo2O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('youtube')}
                </a>
              </div>
              <p className="text-black text-[14px] font-normal leading-normal">
                {t('officeAddress')}
              </p>
              <Button
                onClick={handleContactClick}
                className="min-[1455px]:hidden block w-[208px] px-[10px]! py-[5px]! gap-[10px] border-[0.5px] border-black bg-white text-black! text-center text-[10px] font-normal leading-[20px] tracking-[0.5px]! uppercase hover:bg-white"
                style={{ textEdge: "cap", leadingTrim: "both" } as React.CSSProperties}
              >
                {t('contactForConsultation')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[65px]">
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between min-[393px]:gap-6 gap-3">
                <a
                  href="https://zalo.me/0902757525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('zalo')}
                </a>
                <a
                  href="tel:0902757525"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('hotline')}
                </a>
                <a
                  href="https://www.facebook.com/olystudio.18"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('facebook')}
                </a>
                <a
                  href="https://www.youtube.com/@olystudio4524?si=odaF8cXrnZojdo2O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-black text-[12px] font-bold leading-normal hover:underline active:underline decoration-skip-ink-none"
                  style={{ textUnderlinePosition: "from-font" }}
                >
                  {t('youtube')}
                </a>
              </div>
              <p className="text-black min-[843px]:text-[16px] text-[10px] font-bold leading-normal tracking-[2.52px]">
                {t('tagline')}
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-black text-[14px] font-normal leading-normal">
                {t('officeAddress')}
              </p>
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-[12px]">
                  <a
                    href="mailto:info@olystudio.vn"
                    className="text-black min-[843px]:text-[16px] text-[10px] font-bold leading-normal tracking-[2.52px] underline decoration-skip-ink-none hover:opacity-80 transition-opacity"
                    style={{ textUnderlinePosition: "from-font" }}
                  >
                    info@olystudio.vn
                  </a>
                  <a
                    href="tel:0902757525"
                    className="text-black min-[843px]:text-[16px] text-[10px] font-bold leading-normal tracking-[2.52px] underline decoration-skip-ink-none hover:opacity-80 transition-opacity"
                    style={{ textUnderlinePosition: "from-font" }}
                  >
                    {t('hotlineNumber')}
                  </a>
                  <Button
                  onClick={handleContactClick}
                  className="min-[390px]:hidden block min-[464px]:w-[208px] w-auto min-[464px]:px-[10px]! py-[5px]! px-1! gap-[10px] border-[0.5px] border-black bg-white text-black! text-center text-[10px] font-normal leading-[20px] tracking-[0.5px]! uppercase hover:bg-white"
                  style={{ textEdge: "cap", leadingTrim: "both" } as React.CSSProperties}
                >
                  {t('contactForConsultation')}
                </Button>
                </div>
                <Button
                  onClick={handleContactClick}
                  className="min-[390px]:block hidden min-[464px]:w-[208px] w-auto min-[464px]:px-[10px]! py-[5px]! px-1! gap-[10px] border-[0.5px] border-black bg-white text-black! text-center text-[10px] font-normal leading-[20px] tracking-[0.5px]! uppercase hover:bg-white"
                  style={{ textEdge: "cap", leadingTrim: "both" } as React.CSSProperties}
                >
                  {t('contactForConsultation')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
