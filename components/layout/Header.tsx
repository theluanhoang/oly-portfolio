'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from '@/components/ui/Link';
import Button from '@/components/ui/Button';
import { User } from 'lucide-react';
import Menu from './Menu';

interface HeaderProps {
  isFixed?: boolean;
}

export default function Header({ isFixed = false }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin') && pathname !== '/admin/login';
  
  const positionClasses = isFixed 
    ? "fixed top-0 left-0 right-0 z-50" 
    : "relative z-50";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };
  
  return (
    <header className={`bg-background shadow-md ${positionClasses}`}>
      <div className="wrapper h-12 flex items-center min-[394px]:justify-between justify-around">
        <div className="flex items-center min-[1366px]:w-1/2 w-auto">
          <Link href={"/"} noBaseStyles className="flex items-center">
            <img
              src="/assets/logo.svg"
              alt="OLY Logo"
              className="min-[320px]:h-auto h-8"
            />
          </Link>
        </div>

        <div className="flex items-center min-[468px]:w-5/6 min-[1072px]:w-1/2 min-[844px]:w-2/3 w-auto justify-between">
          {isAdminPage ? (
            <nav className="flex items-center gap-8">
              <Link href="/projects" className="text-[12px] font-normal leading-normal text-black">
                Projects
              </Link>
              {session && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f5] border border-[#e0e0e0] rounded-sm">
                    <User size={14} className="text-[#666]" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium leading-normal text-[#333] tracking-wide">
                      {session.user?.name || 'Admin'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSignOut}
                    className="md:text-xs md:px-4 md:py-1.5"
                  >
                    Đăng Xuất
                  </Button>
                </div>
              )}
            </nav>
          ) : (
            <>
              <Menu className="flex items-center sm:gap-15 min-[468px]:gap-7 gap-5 mt-[5px] sm:justify-between justify-around" />
              <button
                type="button"
                aria-label="Search"
                className="text-foreground hover:text-[#666] transition-colors min-[468px]:block hidden"
              >
                <img src="/assets/icons/search.svg" alt="Search" className="h-5 w-5" />
              </button>

              <button
                type="button"
                className='text-[12px] font-bold leading-normal text-black transition-colors hover:text-[#666] min-[468px]:block hidden'
                 style={{ fontFamily: 'Geeza Pro' }}
              >
                E/V
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

