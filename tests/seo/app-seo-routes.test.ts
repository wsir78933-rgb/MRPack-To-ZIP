import { describe, expect, test } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as getEnglishNotFoundResponse } from "@/app/(en)/[...notFoundSegments]/route";
import { GET as getChineseNotFoundResponse } from "@/app/(zh)/zh/[...notFoundSegments]/route";

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
      { url: "https://mrpacktozip.pro/" },
      { url: "https://mrpacktozip.pro/zh" },
      { url: "https://mrpacktozip.pro/zip-to-mrpack" },
      { url: "https://mrpacktozip.pro/zh/zip-to-mrpack" },
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
