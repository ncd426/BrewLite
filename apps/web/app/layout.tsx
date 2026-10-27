import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner';

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
        <Toaster 
          position="top-right" 
          richColors 
          offset="80px" 
          visibleToasts={1} 
          duration={2000} 
        />
      </body>
    </html>
  );
}