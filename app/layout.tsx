import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hân ở Úc | Hàng Úc chính hãng',
  description: 'Hàng Úc chính hãng, săn sale, preorder và gửi về Việt Nam cùng Hân ở Úc.',
  icons: { icon: '/icon.png', apple: '/han-o-uc-logo.png' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ff6fae'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
