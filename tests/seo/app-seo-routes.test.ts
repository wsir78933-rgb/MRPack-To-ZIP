import { describe, expect, test } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as getEnglishNotFoundResponse } from "@/app/(en)/[...notFoundSegments]/route";
import { GET as getChineseNotFoundResponse } from "@/app/(zh)/zh/[...notFoundSegments]/route";
import { siteContentLastModified } from "@/lib/seo/site-metadata";

describe("app SEO routes", () => {
  test("returns robots metadata that allows pages, disallows API routes, and links the sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      sitemap: "https://mrpacktozip.pro/sitemap.xml",
    });
  });

  test("returns sitemap entries for canonical pages only", () => {
    expect(sitemap()).toEqual([
      { url: "https://mrpacktozip.pro/", lastModified: siteContentLastModified },
      {
        url: "https://mrpacktozip.pro/zh",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/zip-to-mrpack",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/zh/zip-to-mrpack",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/about",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/zh/about",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/privacy",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/zh/privacy",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/terms",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/zh/terms",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/contact",
        lastModified: siteContentLastModified,
      },
      {
        url: "https://mrpacktozip.pro/zh/contact",
        lastModified: siteContentLastModified,
      },
    ]);
  });

  test("returns localized 404 HTML from English and Chinese catch-all route handlers", async () => {
    const englishNotFoundResponse = getEnglishNotFoundResponse();
    const chineseNotFoundResponse = getChineseNotFoundResponse();

    expect(englishNotFoundResponse.status).toBe(404);
    expect(chineseNotFoundResponse.status).toBe(404);
    expect(englishNotFoundResponse.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(chineseNotFoundResponse.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );

    await expect(englishNotFoundResponse.text()).resolves.toContain(
      '<html lang="en">',
    );
    await expect(chineseNotFoundResponse.text()).resolves.toContain(
      '<html lang="zh-Hans">',
    );
  });
});
