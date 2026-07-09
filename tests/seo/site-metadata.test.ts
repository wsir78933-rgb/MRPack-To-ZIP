import { describe, expect, test } from "vitest";

import {
  siteMetadataCopyByRoute,
  siteMetadataSocialPreviewImageAlt,
} from "@/lib/i18n/site-metadata-copy";
import {
  buildRobotsMetadata,
  buildPageMetadata,
  buildSitemapEntries,
  resolveProductionSiteUrl,
  siteContentLastModified,
  siteRoutePaths,
} from "@/lib/seo/site-metadata";

describe("site metadata", () => {
  test("uses the production domain when no environment override is provided", () => {
    expect(resolveProductionSiteUrl(undefined).toString()).toBe(
      "https://mrpacktozip.pro/",
    );
  });

  test("accepts an https origin or local http origin override without path, query, or hash", () => {
    expect(resolveProductionSiteUrl("https://preview.example.com").toString()).toBe(
      "https://preview.example.com/",
    );
    expect(resolveProductionSiteUrl("http://localhost:3000").toString()).toBe(
      "http://localhost:3000/",
    );
    expect(resolveProductionSiteUrl("http://127.0.0.1:3000").toString()).toBe(
      "http://127.0.0.1:3000/",
    );
  });

  test("rejects site URL overrides with blank values, path, query, hash, unsupported protocol, or non-local http", () => {
    expect(() => resolveProductionSiteUrl("   ")).toThrow(
      'Invalid NEXT_PUBLIC_SITE_URL value: "   "',
    );
    expect(() => resolveProductionSiteUrl("https://example.com/app")).toThrow(
      "Invalid NEXT_PUBLIC_SITE_URL value: https://example.com/app",
    );
    expect(() => resolveProductionSiteUrl("https://example.com?from=test")).toThrow(
      "Invalid NEXT_PUBLIC_SITE_URL value: https://example.com?from=test",
    );
    expect(() => resolveProductionSiteUrl("ftp://example.com")).toThrow(
      "Invalid NEXT_PUBLIC_SITE_URL value: ftp://example.com",
    );
    expect(() => resolveProductionSiteUrl("http://example.com")).toThrow(
      "Invalid NEXT_PUBLIC_SITE_URL value: http://example.com",
    );
  });

  test("lists the canonical SEO routes", () => {
    expect(siteRoutePaths).toEqual([
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
    ]);
  });

  test("builds absolute canonical and hreflang metadata for the English converter", () => {
    const metadata = buildPageMetadata("/", new URL("https://example.com"));

    expect(metadata.metadataBase?.toString()).toBe("https://example.com/");
    expect(metadata.alternates?.canonical).toBe("https://example.com/");
    expect(metadata.alternates?.languages).toEqual({
      en: "https://example.com/",
      "zh-Hans": "https://example.com/zh",
      "x-default": "https://example.com/",
    });
  });

  test("builds social metadata with absolute page URLs", () => {
    const zipToMrpackChineseCopy = siteMetadataCopyByRoute["/zh/zip-to-mrpack"];
    const metadata = buildPageMetadata(
      "/zh/zip-to-mrpack",
      new URL("https://example.com"),
    );

    expect(metadata.openGraph).toMatchObject({
      title: zipToMrpackChineseCopy.title,
      description: zipToMrpackChineseCopy.description,
      url: "https://example.com/zh/zip-to-mrpack",
      siteName: "MRPack to ZIP",
      type: "website",
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: zipToMrpackChineseCopy.title,
      description: zipToMrpackChineseCopy.description,
      images: [
        {
          url: "https://example.com/assets/mrpackzip-voxel-bg.png",
          alt: siteMetadataSocialPreviewImageAlt,
        },
      ],
    });
    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://example.com/assets/mrpackzip-voxel-bg.png",
          width: 1672,
          height: 941,
          alt: siteMetadataSocialPreviewImageAlt,
        },
      ],
    });
  });

  test("uses i18n copy for ZIP to MRPack metadata titles and descriptions", () => {
    const englishMetadata = buildPageMetadata(
      "/zip-to-mrpack",
      new URL("https://example.com"),
    );
    const chineseMetadata = buildPageMetadata(
      "/zh/zip-to-mrpack",
      new URL("https://example.com"),
    );
    const englishCopy = siteMetadataCopyByRoute["/zip-to-mrpack"];
    const chineseCopy = siteMetadataCopyByRoute["/zh/zip-to-mrpack"];

    expect(englishMetadata.title).toBe(englishCopy.title);
    expect(englishMetadata.description).toBe(englishCopy.description);
    expect(chineseMetadata.title).toBe(chineseCopy.title);
    expect(chineseMetadata.description).toBe(chineseCopy.description);
  });

  test("builds canonical and hreflang metadata for trust pages", () => {
    const englishPrivacyMetadata = buildPageMetadata(
      "/privacy",
      new URL("https://example.com"),
    );
    const chineseContactMetadata = buildPageMetadata(
      "/zh/contact",
      new URL("https://example.com"),
    );
    const englishPrivacyCopy = siteMetadataCopyByRoute["/privacy"];
    const chineseContactCopy = siteMetadataCopyByRoute["/zh/contact"];

    expect(englishPrivacyMetadata).toMatchObject({
      title: englishPrivacyCopy.title,
      description: englishPrivacyCopy.description,
      alternates: {
        canonical: "https://example.com/privacy",
        languages: {
          en: "https://example.com/privacy",
          "zh-Hans": "https://example.com/zh/privacy",
          "x-default": "https://example.com/privacy",
        },
      },
    });
    expect(chineseContactMetadata).toMatchObject({
      title: chineseContactCopy.title,
      alternates: {
        canonical: "https://example.com/zh/contact",
        languages: {
          en: "https://example.com/contact",
          "zh-Hans": "https://example.com/zh/contact",
          "x-default": "https://example.com/contact",
        },
      },
    });
  });

  test("builds sitemap entries for each canonical route", () => {
    expect(buildSitemapEntries(new URL("https://example.com"))).toEqual([
      { url: "https://example.com/", lastModified: siteContentLastModified },
      { url: "https://example.com/zh", lastModified: siteContentLastModified },
      {
        url: "https://example.com/zip-to-mrpack",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/zh/zip-to-mrpack",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/about",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/zh/about",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/privacy",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/zh/privacy",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/terms",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/zh/terms",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/contact",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://example.com/zh/contact",
        lastModified: siteContentLastModified,
      },
    ]);
  });

  test("builds robots metadata with the absolute sitemap URL", () => {
    expect(buildRobotsMetadata(new URL("https://example.com"))).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      sitemap: "https://example.com/sitemap.xml",
    });
  });
});
