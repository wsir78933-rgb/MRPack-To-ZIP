import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, test } from "vitest";

import EnglishRootLayout, {
  metadata as englishRootMetadata,
} from "@/app/(en)/layout";
import { GET as getEnglishCatchAllNotFoundResponse } from "@/app/(en)/[...notFoundSegments]/route";
import ChineseRootLayout, {
  metadata as chineseRootMetadata,
} from "@/app/(zh)/layout";
import ChineseNotFound from "@/app/(zh)/not-found";
import { GET as getChineseCatchAllNotFoundResponse } from "@/app/(zh)/zh/[...notFoundSegments]/route";
import {
  chineseNotFoundPageCopy,
  englishNotFoundPageCopy,
} from "@/lib/i18n/not-found-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

const appDirectory = join(process.cwd(), "app");
const englishLayoutPath = join(appDirectory, "(en)", "layout.tsx");
const chineseLayoutPath = join(appDirectory, "(zh)", "layout.tsx");
const englishCatchAllNotFoundPath = join(
  appDirectory,
  "(en)",
  "[...notFoundSegments]",
  "route.ts",
);
const chineseCatchAllNotFoundPath = join(
  appDirectory,
  "(zh)",
  "zh",
  "[...notFoundSegments]",
  "route.ts",
);

function readRouteSource(filePath: string) {
  return readFileSync(filePath, "utf8");
}

describe("locale root layouts", () => {
  test("uses route-group root layouts instead of a request-aware top-level layout", () => {
    expect(existsSync(join(appDirectory, "layout.tsx"))).toBe(false);
    expect(existsSync(englishLayoutPath)).toBe(true);
    expect(existsSync(chineseLayoutPath)).toBe(true);
  });

  test("sets static lang attributes for English and Chinese root layouts", () => {
    const englishLayoutSource = readRouteSource(englishLayoutPath);
    const chineseLayoutSource = readRouteSource(chineseLayoutPath);

    expect(englishLayoutSource).toContain('lang="en"');
    expect(chineseLayoutSource).toContain('lang="zh-Hans"');
    expect(englishLayoutSource).not.toContain("next/headers");
    expect(chineseLayoutSource).not.toContain("next/headers");
  });

  test("returns root html elements with static locale lang props", () => {
    const englishLayoutElement = EnglishRootLayout({
      children: "content",
    }) as ReactElement<{ lang: string; children: ReactNode }>;
    const chineseLayoutElement = ChineseRootLayout({
      children: "content",
    }) as ReactElement<{ lang: string; children: ReactNode }>;

    expect(englishLayoutElement.type).toBe("html");
    expect(chineseLayoutElement.type).toBe("html");
    expect(englishLayoutElement.props.lang).toBe("en");
    expect(chineseLayoutElement.props.lang).toBe("zh-Hans");
  });

  test("preserves locale-specific root metadata and shared body styling", () => {
    const expectedEnglishMetadata = buildPageMetadata("/");
    const expectedChineseMetadata = buildPageMetadata("/zh");
    const englishLayoutSource = readRouteSource(englishLayoutPath);
    const chineseLayoutSource = readRouteSource(chineseLayoutPath);

    expect(englishRootMetadata.title).toEqual(expectedEnglishMetadata.title);
    expect(englishRootMetadata.description).toBe(
      expectedEnglishMetadata.description,
    );
    expect(chineseRootMetadata.title).toEqual(expectedChineseMetadata.title);
    expect(chineseRootMetadata.description).toBe(
      expectedChineseMetadata.description,
    );

    for (const layoutSource of [englishLayoutSource, chineseLayoutSource]) {
      expect(layoutSource).toContain("/icon.svg");
      expect(layoutSource).toContain("bg-white dark:bg-gray-950 text-black dark:text-white");
      expect(layoutSource).toContain("min-h-[100dvh] bg-gray-50");
    }
  });

  test("uses Chinese copy and Chinese homepage path for the Chinese 404 page", () => {
    const chineseNotFoundMarkup = renderToStaticMarkup(
      createElement(ChineseNotFound),
    );

    expect(chineseNotFoundMarkup).toContain(chineseNotFoundPageCopy.title);
    expect(chineseNotFoundMarkup).toContain(chineseNotFoundPageCopy.homeLabel);
    expect(chineseNotFoundMarkup).toContain(
      `href="${chineseNotFoundPageCopy.homeHref}"`,
    );
    expect(chineseNotFoundMarkup).not.toContain(englishNotFoundPageCopy.title);
    expect(chineseNotFoundMarkup).not.toContain(
      `href="${englishNotFoundPageCopy.homeHref}"`,
    );
  });

  test("routes unmatched locale paths through localized 404 route handlers", async () => {
    const englishCatchAllNotFoundSource = readRouteSource(
      englishCatchAllNotFoundPath,
    );
    const chineseCatchAllNotFoundSource = readRouteSource(
      chineseCatchAllNotFoundPath,
    );

    for (const catchAllNotFoundSource of [
      englishCatchAllNotFoundSource,
      chineseCatchAllNotFoundSource,
    ]) {
      expect(catchAllNotFoundSource).toContain("buildNotFoundResponse");
      expect(catchAllNotFoundSource).toContain("export function GET()");
    }

    const englishNotFoundHtml =
      await getEnglishCatchAllNotFoundResponse().text();
    const chineseNotFoundHtml =
      await getChineseCatchAllNotFoundResponse().text();

    expect(englishNotFoundHtml).toContain(
      `<html lang="${englishNotFoundPageCopy.htmlLang}">`,
    );
    expect(englishNotFoundHtml).toContain(englishNotFoundPageCopy.title);
    expect(englishNotFoundHtml).toContain(englishNotFoundPageCopy.homeLabel);
    expect(chineseNotFoundHtml).toContain(
      `<html lang="${chineseNotFoundPageCopy.htmlLang}">`,
    );
    expect(chineseNotFoundHtml).toContain(chineseNotFoundPageCopy.title);
    expect(chineseNotFoundHtml).toContain(chineseNotFoundPageCopy.homeLabel);
  });
});
