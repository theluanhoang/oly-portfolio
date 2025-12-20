'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from '@/components/ui/Link';
import { Link as LocaleLink } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { User } from 'lucide-react';
import Menu from './Menu';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  isFixed?: boolean;
}

export default function Header({ isFixed = false }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Common');
  const tNav = useTranslations('Navigation');
  const isAdminPage = pathname?.includes('/admin') && !pathname?.includes('/admin/login');
  
  const positionClasses = isFixed 
    ? "fixed top-0 left-0 right-0 z-50" 
    : "relative z-50";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/${locale}/admin/login` });
  };

  const LogoLink = isAdminPage ? Link : LocaleLink;
  
  return (
    <header className={`bg-background ${positionClasses}`} style={{ paddingTop: '18px', paddingBottom: '18px' }}>
      <div className="wrapper h-12  flex items-center min-[394px]:justify-between justify-around">
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
              <Link href="/projects" className="text-[12px] font-normal leading-normal text-black">
                {tNav('projects')}
              </Link>
              <Link href="/products" className="text-[12px] font-normal leading-normal text-black">
                {tNav('products')}
              </Link>
              <Link href="/users" className="text-[12px] font-normal leading-normal text-black">
                {tNav('users')}
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {session && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f5] border border-[#e0e0e0] rounded-sm">
                    <User size={14} className="text-[#666]" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium leading-normal text-[#333] tracking-wide pt-[5px]">
                      {session.user?.name || t('admin')}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSignOut}
                    className="md:text-xs md:px-4 md:py-1.5"
                  >
                    {t('signOut')}
                  </Button>
                </>
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

