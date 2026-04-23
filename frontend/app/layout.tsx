import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../src/index.css';
import { AppShell } from '../src/components/AppShell';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
export const metadata: Metadata = { title: 'Bezi · AI for Unity' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
