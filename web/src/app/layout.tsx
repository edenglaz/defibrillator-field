import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'דפיברילטור בשטח — Pro Bono',
  description: 'מיפוי דפיברילטורים ניידים בשטח עם LoRa ו-Meshtastic',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Breadcrumbs />
          {children}
        </main>
        <footer className="mt-8 border-t bg-white py-4 text-center text-sm text-gray-600">
          פרויקט סיום — פיתוח WEB אפקה 2026 | LoRa 433MHz | Meshtastic
        </footer>
      </body>
    </html>
  );
}
