import type { SiteRoutePath } from "@/lib/seo/site-metadata";

export type SiteMetadataCopy = {
  title: string;
  description: string;
};

export const siteMetadataSocialPreviewImageAlt =
  "MRPack to ZIP converter interface";

export const siteMetadataCopyByRoute = {
  "/": {
    title: "MRPack to ZIP Converter - Free Online Modrinth Modpack Tool",
    description:
      "Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.",
  },
  "/zh": {
    title: "MRPack 转 ZIP 转换器 - 免费在线 Modrinth 模组包工具",
    description:
      "在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。",
  },
  "/zip-to-mrpack": {
    title: "CurseForge ZIP to MRPack Converter - Free Online Tool",
    description:
      "Convert CurseForge modpack ZIP exports into Modrinth-compatible MRPack files.",
  },
  "/zh/zip-to-mrpack": {
    title: "CurseForge ZIP 转 MRPack 转换器 - 免费在线工具",
    description:
      "在浏览器中把 CurseForge 整合包 ZIP 转换成兼容 Modrinth 的 MRPack 文件。",
  },
  "/about": {
    title: "About MRPack to ZIP",
    description:
      "Learn who maintains MRPack to ZIP and how the browser-based Minecraft modpack conversion tools are scoped.",
  },
  "/zh/about": {
    title: "关于 MRPack to ZIP",
    description:
      "了解 MRPack to ZIP 的维护目标，以及浏览器内 Minecraft 整合包转换工具的适用范围。",
  },
  "/privacy": {
    title: "Privacy Policy - MRPack to ZIP",
    description:
      "Learn how MRPack to ZIP handles local files, browser-based conversion, proxy requests, and server logs.",
  },
  "/zh/privacy": {
    title: "隐私政策 - MRPack to ZIP",
    description:
      "了解 MRPack to ZIP 如何处理本地文件、浏览器内转换、代理请求和服务器日志。",
  },
  "/terms": {
    title: "Terms of Use - MRPack to ZIP",
    description:
      "Read the MRPack to ZIP terms covering acceptable use, modpack ownership, third-party services, and conversion limits.",
  },
  "/zh/terms": {
    title: "使用条款 - MRPack to ZIP",
    description:
      "阅读 MRPack to ZIP 关于可接受使用、整合包权利、第三方服务和转换限制的条款。",
  },
  "/contact": {
    title: "Contact MRPack to ZIP",
    description:
      "Contact the MRPack to ZIP project for support, bug reports, privacy questions, or policy requests.",
  },
  "/zh/contact": {
    title: "联系我们 - MRPack to ZIP",
    description:
      "联系 MRPack to ZIP，反馈问题、报告错误、提出隐私问题或发送政策相关请求。",
  },
} satisfies Record<SiteRoutePath, SiteMetadataCopy>;

export function getSiteMetadataCopy(routePath: SiteRoutePath): SiteMetadataCopy {
  const siteMetadataCopy = siteMetadataCopyByRoute[routePath];

  if (!siteMetadataCopy) {
    throw new Error(`Missing site metadata copy for route path: ${routePath}`);
  }

  return siteMetadataCopy;
}
