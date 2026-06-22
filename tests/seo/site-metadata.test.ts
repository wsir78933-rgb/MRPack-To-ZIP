import { describe, expect, test } from "vitest";

import {
  buildRobotsMetadata,
  buildPageMetadata,
  buildSitemapEntries,
  resolveProductionSiteUrl,
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
    const metadata = buildPageMetadata(
      "/zh/zip-to-mrpack",
      new URL("https://example.com"),
    );

    expect(metadata.openGraph).toMatchObject({
      title: "ZIP 转 MRPack 转换器",
      description:
        "在浏览器中把 CurseForge 整合包 ZIP 转换成兼容 Modrinth 的 MRPack 文件。",
      url: "https://example.com/zh/zip-to-mrpack",
      siteName: "MRPack to ZIP",
      type: "website",
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "ZIP 转 MRPack 转换器",
      description:
        "在浏览器中把 CurseForge 整合包 ZIP 转换成兼容 Modrinth 的 MRPack 文件。",
      images: [
        {
          url: "https://example.com/assets/mrpackzip-voxel-bg.png",
          alt: "MRPack to ZIP converter interface",
        },
      ],
    });
    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://example.com/assets/mrpackzip-voxel-bg.png",
          width: 1672,
          height: 941,
          alt: "MRPack to ZIP converter interface",
        },
      ],
    });
  });

  test("builds sitemap entries for each canonical route", () => {
    expect(buildSitemapEntries(new URL("https://example.com"))).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/zh" },
      { url: "https://example.com/zip-to-mrpack" },
      { url: "https://example.com/zh/zip-to-mrpack" },
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
