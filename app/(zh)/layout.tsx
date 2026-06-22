import '../globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MRPack 转 ZIP 转换器',
  description:
    '在浏览器中把 Modrinth .mrpack 文件、项目 ID 或直接下载链接转换成标准 ZIP 压缩包。',
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
      lang="zh-Hans"
      className="bg-white dark:bg-gray-950 text-black dark:text-white"
    >
      <body className="min-h-[100dvh] bg-gray-50">
        {children}
      </body>
    </html>
  );
}
