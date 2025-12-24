'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from '@/components/ui/Link';
import { Link as LocaleLink } from '@/i18n/routing';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import Menu from './Menu';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  isFixed?: boolean;
}

export default function Header({ isFixed = false }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('Common');
  const tNav = useTranslations('Navigation');
  const isAdminPage = pathname?.includes('/admin') && !pathname?.includes('/admin/login');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const positionClasses = isFixed 
    ? "fixed top-0 left-0 right-0 z-50" 
    : "relative z-50";

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: `/${locale}/admin/login` });
  };

  const handleSettings = () => {
    setIsDropdownOpen(false);
    router.push(`/${locale}/admin/settings`);
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const LogoLink = isAdminPage ? Link : LocaleLink;
  
  return (
    <header className={`bg-background ${positionClasses}`} style={{ paddingTop: '18px', paddingBottom: '18px' }}>
      <div className="wrapper h-12  flex items-center justify-between">
        {isAdminPage ? (
          <>
            <div className="flex items-center">
              <LogoLink href={"/"} className="flex items-center">
                <img
                  src="/assets/logo.svg"
                  alt="OLY Logo"
                  className="min-[320px]:h-auto h-8"
                />
              </LogoLink>
            </div>

            <nav className="flex items-center justify-center flex-1 gap-8">
              <Link href="/admin/projects" className="text-[12px] font-normal leading-normal text-black">
                {tNav('projects')}
              </Link>
              <Link href="/admin/products" className="text-[12px] font-normal leading-normal text-black">
                {tNav('products')}
              </Link>
              <Link href="/admin/users" className="text-[12px] font-normal leading-normal text-black">
                {tNav('users')}
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {session && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                    aria-label="User menu"
                    aria-expanded={isDropdownOpen}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white text-sm font-semibold shadow-sm">
                      {getUserInitials(session.user?.name)}
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {session.user?.name || t('admin')}
                      </span>
                      <span className="text-xs text-gray-500">Admin</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 transition-all duration-200 ease-out">
                      <button
                        type="button"
                        onClick={handleSettings}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={16} className="text-gray-500" />
                        <span>{t('settings')}</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="text-red-500" />
                        <span>{t('signOut')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <LanguageSwitcher />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center min-[1366px]:w-1/2 w-auto">
              <LogoLink href={"/"} className="flex items-center">
                <img
                  src="/assets/logo.svg"
                  alt="OLY Logo"
                  className="min-[320px]:h-auto h-8"
                />
              </LogoLink>
            </div>

            <div className="flex items-center min-[468px]:w-5/6 min-[1072px]:w-1/2 min-[844px]:w-2/3 w-auto justify-between">
              <Menu className="flex items-center sm:gap-15 min-[468px]:gap-7 gap-5 sm:justify-between justify-around" />
              <button
                type="button"
                aria-label={tNav('search')}
                className="text-foreground hover:text-[#666] transition-colors min-[468px]:block hidden"
              >
                <img src="/assets/icons/search.svg" alt={tNav('search')} className="h-5 w-5" />
              </button>

              <LanguageSwitcher />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

