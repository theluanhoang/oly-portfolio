import Link from "next/link";
import React from "react";

interface MenuProps {
  className?: string;
}

function Menu({ className }: MenuProps) {
  return (
    <nav className={`${className}`}>
      <Link
        href="/projects"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        Project
      </Link>
      <Link
        href="#product"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        Product
      </Link>
      <Link
        href="#about"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        About
      </Link>
      <Link
        href="#contact"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        Contact
      </Link>
    </nav>
  );
}

export default Menu;
