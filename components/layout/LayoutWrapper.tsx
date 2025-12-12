"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { useResponsive } from "@/hooks/useResponsive";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isProjectsPage = pathname === "/projects";
  const isAdminLoginPage = pathname === "/admin/login";
  const headerHeight = useHeaderHeight();
  const { isMobile } = useResponsive();

  if (isHomePage || isAdminLoginPage) {
    return <>{children}</>;
  }
  
  const shouldFixFooter = isProjectsPage && !isMobile;
  
  return (
    <>
      <Header isFixed={true} />
      {isProjectsPage ? (
        <div className="wrapper">
          {children}
        </div>
      ) : (
        <div className="wrapper" style={{ paddingTop: `${headerHeight}px` }}>
          {children}
        </div>
      )}
      <Footer isFixed={shouldFixFooter} />
    </>
  );
}
