import './globals.css';
import type { Metadata } from 'next';
import { CartProvider } from '@/components/CartProvider';

export const metadata: Metadata = {
  title: 'BrewLite',
  description: 'Coffee ordering app built for a Scrum project',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-amber-50 text-slate-800">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
