import { describe, expect, test } from "vitest";

import {
  buildNotFoundHtml,
  buildNotFoundResponse,
} from "@/lib/seo/not-found-response";

describe("not found response", () => {
  test("builds localized 404 HTML with static language and noindex", () => {
    const notFoundHtml = buildNotFoundHtml({
      htmlLang: "zh-Hans",
      title: "页面未找到",
      message: "你访问的页面可能已被移除、重命名，或暂时不可用。",
      homeHref: "/zh",
      homeLabel: "返回首页",
    });

    expect(notFoundHtml).toContain('<html lang="zh-Hans">');
    expect(notFoundHtml).toContain(
      '<meta name="robots" content="noindex">',
    );
    expect(notFoundHtml).toContain("<title>页面未找到</title>");
    expect(notFoundHtml).toContain('href="/zh"');
    expect(notFoundHtml).toContain("返回首页");
  });

  test("returns an HTML response with 404 status", () => {
    const notFoundResponse = buildNotFoundResponse({
      htmlLang: "en",
      title: "Page Not Found",
      message:
        "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
      homeHref: "/",
      homeLabel: "Back to Home",
    });

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
  });

  test("fails fast when a home href is not root-relative", () => {
    expect(() =>
      buildNotFoundHtml({
        htmlLang: "en",
        title: "Page Not Found",
        message: "Missing",
        homeHref: "https://example.com",
        homeLabel: "Back to Home",
      }),
    ).toThrow("Invalid not-found homeHref value: https://example.com");
  });
});
