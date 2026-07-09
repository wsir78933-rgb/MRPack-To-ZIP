import type { Metadata, MetadataRoute } from "next";

import {
  getSiteMetadataCopy,
  siteMetadataSocialPreviewImageAlt,
} from "@/lib/i18n/site-metadata-copy";

export const defaultProductionSiteUrl = "https://mrpacktozip.pro";
export const siteContentLastModified = new Date("2026-07-08T00:00:00.000Z");

export const siteRoutePaths = [
  "/",
  "/zh",
  "/zip-to-mrpack",
  "/zh/zip-to-mrpack",
  "/about",
  "/zh/about",
  "/privacy",
  "/zh/privacy",
  "/terms",
  "/zh/terms",
  "/contact",
  "/zh/contact",
] as const;

export type SiteRoutePath = (typeof siteRoutePaths)[number];

const socialPreviewImagePath = "/assets/mrpackzip-voxel-bg.png";

type PageSeoRouteDefinition = {
  canonicalPath: SiteRoutePath;
  languageAlternates: Record<"en" | "zh-Hans" | "x-default", SiteRoutePath>;
};

export const pageSeoDefinitions: Record<SiteRoutePath, PageSeoRouteDefinition> = {
  "/": {
    canonicalPath: "/",
    languageAlternates: {
      en: "/",
      "zh-Hans": "/zh",
      "x-default": "/",
    },
  },
  "/zh": {
    canonicalPath: "/zh",
    languageAlternates: {
      en: "/",
      "zh-Hans": "/zh",
      "x-default": "/",
    },
  },
  "/zip-to-mrpack": {
    canonicalPath: "/zip-to-mrpack",
    languageAlternates: {
      en: "/zip-to-mrpack",
      "zh-Hans": "/zh/zip-to-mrpack",
      "x-default": "/zip-to-mrpack",
    },
  },
  "/zh/zip-to-mrpack": {
    canonicalPath: "/zh/zip-to-mrpack",
    languageAlternates: {
      en: "/zip-to-mrpack",
      "zh-Hans": "/zh/zip-to-mrpack",
      "x-default": "/zip-to-mrpack",
    },
  },
  "/about": {
    canonicalPath: "/about",
    languageAlternates: {
      en: "/about",
      "zh-Hans": "/zh/about",
      "x-default": "/about",
    },
  },
  "/zh/about": {
    canonicalPath: "/zh/about",
    languageAlternates: {
      en: "/about",
      "zh-Hans": "/zh/about",
      "x-default": "/about",
    },
  },
  "/privacy": {
    canonicalPath: "/privacy",
    languageAlternates: {
      en: "/privacy",
      "zh-Hans": "/zh/privacy",
      "x-default": "/privacy",
    },
  },
  "/zh/privacy": {
    canonicalPath: "/zh/privacy",
    languageAlternates: {
      en: "/privacy",
      "zh-Hans": "/zh/privacy",
      "x-default": "/privacy",
    },
  },
  "/terms": {
    canonicalPath: "/terms",
    languageAlternates: {
      en: "/terms",
      "zh-Hans": "/zh/terms",
      "x-default": "/terms",
    },
  },
  "/zh/terms": {
    canonicalPath: "/zh/terms",
    languageAlternates: {
      en: "/terms",
      "zh-Hans": "/zh/terms",
      "x-default": "/terms",
    },
  },
  "/contact": {
    canonicalPath: "/contact",
    languageAlternates: {
      en: "/contact",
      "zh-Hans": "/zh/contact",
      "x-default": "/contact",
    },
  },
  "/zh/contact": {
    canonicalPath: "/zh/contact",
    languageAlternates: {
      en: "/contact",
      "zh-Hans": "/zh/contact",
      "x-default": "/contact",
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
  const pageSeoCopy = getSiteMetadataCopy(routePath);
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
    title: pageSeoCopy.title,
    description: pageSeoCopy.description,
    alternates: {
      canonical: canonicalUrl,
      languages: absoluteLanguageAlternates,
    },
    openGraph: {
      title: pageSeoCopy.title,
      description: pageSeoCopy.description,
      url: canonicalUrl,
      siteName: "MRPack to ZIP",
      type: "website",
      images: [
        {
          url: socialPreviewImageUrl,
          width: 1672,
          height: 941,
          alt: siteMetadataSocialPreviewImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageSeoCopy.title,
      description: pageSeoCopy.description,
      images: [
        {
          url: socialPreviewImageUrl,
          alt: siteMetadataSocialPreviewImageAlt,
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
    lastModified: siteContentLastModified,
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
