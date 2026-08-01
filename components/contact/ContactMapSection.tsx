'use client';

import dynamicImport from 'next/dynamic';
import { DefaultLoading } from '@/lib/performance/dynamic-imports';

const GoogleMap = dynamicImport(
  () => import('./GoogleMap'),
  {
    loading: DefaultLoading,
    ssr: false,
  }
);

export default function ContactMapSection() {
  return (
    <div className="w-full lg:flex-1">
      <div className="h-[500px] lg:h-[663px] lg:mt-8 mb-[73px]">
        <GoogleMap className="w-full h-full rounded-sm" />
      </div>
    </div>
  );
}

