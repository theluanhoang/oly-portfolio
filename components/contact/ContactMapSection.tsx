'use client';

import GoogleMap from './GoogleMap';
import ContactInfo from './ContactInfo';

export default function ContactMapSection() {
  return (
    <div className="w-full lg:flex-1">
      <div className="h-[500px] lg:h-[663px] lg:mt-8 mb-[73px]">
        <GoogleMap className="w-full h-full rounded-sm" />
      </div>
      <ContactInfo />
    </div>
  );
}

