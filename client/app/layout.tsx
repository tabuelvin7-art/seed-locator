import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { CartProvider } from '@/lib/CartContext';
import Navbar from '@/components/Navbar';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Seed & Seedling Locator',
  description: 'Find seeds and seedlings near you in Kenya',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen bg-gray-50">{children}</main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
