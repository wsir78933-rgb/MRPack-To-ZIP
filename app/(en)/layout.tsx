import '../globals.css';
import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo/site-metadata';

const englishHomePageMetadata = buildPageMetadata('/');

export const metadata: Metadata = {
  title: englishHomePageMetadata.title,
  description: englishHomePageMetadata.description,
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-white dark:bg-gray-950 text-black dark:text-white"
    >
      <body className="min-h-[100dvh] bg-gray-50">
        {children}
      </body>
    </html>
  );
}
