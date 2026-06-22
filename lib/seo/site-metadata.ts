import type { Metadata, MetadataRoute } from "next";

export const defaultProductionSiteUrl = "https://mrpacktozip.pro";

export const siteRoutePaths = [
  "/",
  "/zh",
  "/zip-to-mrpack",
  "/zh/zip-to-mrpack",
] as const;

export type SiteRoutePath = (typeof siteRoutePaths)[number];

const socialPreviewImagePath = "/assets/mrpackzip-voxel-bg.png";
const socialPreviewImageAlt = "MRPack to ZIP converter interface";

type PageSeoDefinition = {
  title: string;
  description: string;
  canonicalPath: SiteRoutePath;
  languageAlternates: Record<"en" | "zh-Hans" | "x-default", SiteRoutePath>;
};

export const pageSeoDefinitions: Record<SiteRoutePath, PageSeoDefinition> = {
  "/": {
    title: "MRPack to ZIP Converter",
    description:
      "Convert Modrinth .mrpack files, project slugs, or direct download URLs into standard ZIP archives in your browser.",
    canonicalPath: "/",
    languageAlternates: {
      en: "/",
      "zh-Hans": "/zh",
      "x-default": "/",
    },
  },
  "/zh": {
    title: "MRPack 转 ZIP 转换器",
    description:
      "在浏览器中把 Modrinth .mrpack 文件、项目 ID 或直接下载链接转换成标准 ZIP 压缩包。",
    canonicalPath: "/zh",
    languageAlternates: {
      en: "/",
      "zh-Hans": "/zh",
      "x-default": "/",
    },
  },
  "/zip-to-mrpack": {
    title: "ZIP to MRPack Converter",
    description:
      "Convert CurseForge modpack ZIP exports into Modrinth-compatible MRPack files.",
    canonicalPath: "/zip-to-mrpack",
    languageAlternates: {
      en: "/zip-to-mrpack",
      "zh-Hans": "/zh/zip-to-mrpack",
      "x-default": "/zip-to-mrpack",
    },
  },
  "/zh/zip-to-mrpack": {
    title: "ZIP 转 MRPack 转换器",
    description:
      "在浏览器中把 CurseForge 整合包 ZIP 转换成兼容 Modrinth 的 MRPack 文件。",
    canonicalPath: "/zh/zip-to-mrpack",
    languageAlternates: {
      en: "/zip-to-mrpack",
      "zh-Hans": "/zh/zip-to-mrpack",
      "x-default": "/zip-to-mrpack",
    },
  },
};

export function resolveProductionSiteUrl(
  siteUrlValue = process.env.NEXT_PUBLIC_SITE_URL,
): URL {
  const rawSiteUrl =
    siteUrlValue === undefined ? defaultProductionSiteUrl : siteUrlValue.trim();
  let siteUrl: URL;

  if (rawSiteUrl.length === 0) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL value: ${formatSiteUrlValueForError(siteUrlValue)}`,
    );
  }

  try {
    siteUrl = new URL(rawSiteUrl);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL value: ${formatSiteUrlValueForError(siteUrlValue)}`,
    );
  }

  const hasValidProtocol = siteUrl.protocol === "https:" || isLocalHttpUrl(siteUrl);
  const hasOnlyOrigin =
    siteUrl.pathname === "/" && siteUrl.search === "" && siteUrl.hash === "";

  if (!hasValidProtocol || !hasOnlyOrigin) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL value: ${formatSiteUrlValueForError(siteUrlValue)}`,
    );
  }

  return siteUrl;
}

function formatSiteUrlValueForError(siteUrlValue: string | undefined): string {
  if (siteUrlValue === undefined) {
    return defaultProductionSiteUrl;
  }

  return siteUrlValue.trim().length === 0
    ? JSON.stringify(siteUrlValue)
    : siteUrlValue.trim();
}

function isLocalHttpUrl(siteUrl: URL): boolean {
  return (
    siteUrl.protocol === "http:" &&
    (siteUrl.hostname === "localhost" || siteUrl.hostname === "127.0.0.1")
  );
}

export function buildAbsoluteUrl(pathname: SiteRoutePath, siteUrl: URL): string {
  return new URL(pathname, siteUrl).toString();
}

export function buildPageMetadata(
  routePath: SiteRoutePath,
  siteUrl = resolveProductionSiteUrl(),
): Metadata {
  const pageSeoDefinition = pageSeoDefinitions[routePath];
  const canonicalUrl = buildAbsoluteUrl(pageSeoDefinition.canonicalPath, siteUrl);
  const socialPreviewImageUrl = new URL(
    socialPreviewImagePath,
    siteUrl,
  ).toString();
  const absoluteLanguageAlternates = Object.fromEntries(
    Object.entries(pageSeoDefinition.languageAlternates).map(
      ([languageCode, alternatePath]) => [
        languageCode,
        buildAbsoluteUrl(alternatePath, siteUrl),
      ],
    ),
  );

  return {
    metadataBase: siteUrl,
    title: pageSeoDefinition.title,
    description: pageSeoDefinition.description,
    alternates: {
      canonical: canonicalUrl,
      languages: absoluteLanguageAlternates,
    },
    openGraph: {
      title: pageSeoDefinition.title,
      description: pageSeoDefinition.description,
      url: canonicalUrl,
      siteName: "MRPack to ZIP",
      type: "website",
      images: [
        {
          url: socialPreviewImageUrl,
          width: 1672,
          height: 941,
          alt: socialPreviewImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageSeoDefinition.title,
      description: pageSeoDefinition.description,
      images: [
        {
          url: socialPreviewImageUrl,
          alt: socialPreviewImageAlt,
        },
      ],
    },
  };
}

export function buildSitemapEntries(
  siteUrl = resolveProductionSiteUrl(),
): MetadataRoute.Sitemap {
  return siteRoutePaths.map((routePath) => ({
    url: buildAbsoluteUrl(routePath, siteUrl),
  }));
}

export function buildRobotsMetadata(
  siteUrl = resolveProductionSiteUrl(),
): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
