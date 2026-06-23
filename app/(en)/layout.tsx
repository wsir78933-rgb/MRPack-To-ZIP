import '../globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MRPack to ZIP Converter - Free Online Modrinth Modpack Tool',
  description:
    'Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.',
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
