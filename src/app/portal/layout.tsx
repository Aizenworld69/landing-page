'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { Inter } from 'next/font/google';
import PromoPopup from '@/components/PromoPopup';
import { cleanupLegacyAdminStorage } from '@/lib/portal/admin/auth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/portal/admin');

  useEffect(() => {
    cleanupLegacyAdminStorage();
  }, []);

  if (isAdmin) {
    return <div className={`${inter.variable} ${inter.className}`}>{children}</div>;
  }

  return (
    <div
      className={`${inter.variable} ${inter.className} min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative flex flex-col font-sans`}
      style={{ backgroundImage: 'url(/backgoundTrangkhoahoc.jpg)' }}
    >
      <Navbar />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
      <PromoPopup />
    </div>
  );
}
