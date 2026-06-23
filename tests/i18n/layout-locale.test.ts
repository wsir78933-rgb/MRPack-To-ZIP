import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement, ReactNode } from "react";

import { describe, expect, test } from "vitest";

import EnglishRootLayout from "@/app/(en)/layout";
import ChineseRootLayout from "@/app/(zh)/layout";

const appDirectory = join(process.cwd(), "app");
const englishLayoutPath = join(appDirectory, "(en)", "layout.tsx");
const chineseLayoutPath = join(appDirectory, "(zh)", "layout.tsx");
const chineseNotFoundPath = join(appDirectory, "(zh)", "not-found.tsx");
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
    const englishLayoutSource = readRouteSource(englishLayoutPath);
    const chineseLayoutSource = readRouteSource(chineseLayoutPath);

    expect(englishLayoutSource).toContain("MRPack to ZIP Converter");
    expect(englishLayoutSource).toContain(
      "Use this MRPack converter to turn Modrinth .mrpack files, project slugs",
    );
    expect(chineseLayoutSource).toContain("MRPack 转 ZIP 在线转换器");
    expect(chineseLayoutSource).toContain(
      "在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。",
    );

    for (const layoutSource of [englishLayoutSource, chineseLayoutSource]) {
      expect(layoutSource).toContain("/icon.svg");
      expect(layoutSource).toContain("bg-white dark:bg-gray-950 text-black dark:text-white");
      expect(layoutSource).toContain("min-h-[100dvh] bg-gray-50");
    }
  });

  test("uses Chinese copy and Chinese homepage path for the Chinese 404 page", () => {
    const chineseNotFoundSource = readRouteSource(chineseNotFoundPath);

    expect(chineseNotFoundSource).toContain("页面未找到");
    expect(chineseNotFoundSource).toContain("返回首页");
    expect(chineseNotFoundSource).toContain('href="/zh"');
    expect(chineseNotFoundSource).not.toContain("Page Not Found");
    expect(chineseNotFoundSource).not.toContain('href="/"');
  });

  test("routes unmatched locale paths through localized 404 route handlers", () => {
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

    expect(englishCatchAllNotFoundSource).toContain('htmlLang: "en"');
    expect(chineseCatchAllNotFoundSource).toContain('htmlLang: "zh-Hans"');
  });
});
