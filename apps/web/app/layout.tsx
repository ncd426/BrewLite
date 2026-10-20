import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'BrewLite',
  description: 'Coffee ordering app built for a Scrum project',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-amber-50 text-slate-800">
        <Header />
        {children}
      </body>
    </html>
  );
}
