import { describe, expect, test } from "vitest";

import {
  buildNotFoundHtml,
  buildNotFoundResponse,
} from "@/lib/seo/not-found-response";
import {
  chineseNotFoundPageCopy,
  englishNotFoundPageCopy,
} from "@/lib/i18n/not-found-page-copy";

describe("not found response", () => {
  test("builds localized 404 HTML with static language and noindex", () => {
    const notFoundHtml = buildNotFoundHtml(chineseNotFoundPageCopy);

    expect(notFoundHtml).toContain(
      `<html lang="${chineseNotFoundPageCopy.htmlLang}">`,
    );
    expect(notFoundHtml).toContain(
      '<meta name="robots" content="noindex">',
    );
    expect(notFoundHtml).toContain(
      `<title>${chineseNotFoundPageCopy.title}</title>`,
    );
    expect(notFoundHtml).toContain(`href="${chineseNotFoundPageCopy.homeHref}"`);
    expect(notFoundHtml).toContain(chineseNotFoundPageCopy.homeLabel);
  });

  test("returns an HTML response with 404 status", () => {
    const notFoundResponse = buildNotFoundResponse(englishNotFoundPageCopy);

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
