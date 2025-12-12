import NextLink from 'next/link';
import React from 'react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  noBaseStyles?: boolean;
  [key: string]: unknown;
}

export default function Link({
  href,
  children,
  className = '',
  external = false,
  noBaseStyles = false,
  ...props
}: LinkProps) {
  const baseStyles = noBaseStyles 
    ? '' 
    : 'text-[#333] text-sm tracking-[2px] uppercase transition-colors hover:text-[#666] no-underline';
  
  const finalClassName = noBaseStyles ? className : `${baseStyles} ${className}`;
  
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={finalClassName}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink
      href={href}
      className={finalClassName}
      {...props}
    >
      {children}
    </NextLink>
  );
}

