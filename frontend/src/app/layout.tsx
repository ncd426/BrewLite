import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BrewLite - Đặt cà phê không tiền mặt',
  description: 'Hệ thống đặt đồ uống BrewLite',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        <QueryProvider>
          <Header />
          <main className="max-w-md mx-auto min-h-[calc(100vh-3.5rem)] bg-white shadow-sm flex flex-col">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}