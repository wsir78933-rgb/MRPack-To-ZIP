import '../globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MRPack 转 ZIP 在线转换器 - Minecraft 模组包工具',
  description:
    '在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。',
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
