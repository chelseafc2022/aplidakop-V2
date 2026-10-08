import type { Metadata } from 'next';
import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { SidebarConfigProvider } from '@/contexts/sidebar-context';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'APLI DAKOP UMKM - Dinas Koperasi & UMKM Kab. Konawe Selatan',
  description: 'Aplikasi Data Koperasi dan Pelaku Usaha Mikro Kecil dan Menengah Kabupaten Konawe Selatan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="aplidakop-ui-theme">
            <SidebarConfigProvider>
              {children}
              <Toaster richColors position="top-right" />
            </SidebarConfigProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
