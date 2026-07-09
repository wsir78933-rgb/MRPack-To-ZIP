import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

type TrustRouteCase = {
  expectedHeading: string;
  expectedMetadataTitle: string;
  expectedSecondaryText?: string;
  expectedText: string;
  relativeRouteFilePath: string;
};

const trustRouteCases: TrustRouteCase[] = [
  {
    expectedHeading: "About MRPack to ZIP",
    expectedMetadataTitle: "About MRPack to ZIP",
    expectedSecondaryText: "not an official Modrinth, CurseForge, Mojang, or Microsoft service",
    expectedText: "browser-based Minecraft modpack conversion",
    relativeRouteFilePath: "app/(en)/about/page.tsx",
  },
  {
    expectedHeading: "Privacy Policy",
    expectedMetadataTitle: "Privacy Policy - MRPack to ZIP",
    expectedSecondaryText: "approximate request time",
    expectedText: "not uploaded as a complete conversion package",
    relativeRouteFilePath: "app/(en)/privacy/page.tsx",
  },
  {
    expectedHeading: "Terms of Use",
    expectedMetadataTitle: "Terms of Use - MRPack to ZIP",
    expectedText: "CurseForge",
    relativeRouteFilePath: "app/(en)/terms/page.tsx",
  },
  {
    expectedHeading: "Contact",
    expectedMetadataTitle: "Contact MRPack to ZIP",
    expectedSecondaryText: "Do not send complete modpack archives unless they are requested",
    expectedText: "contact@mrpacktozip.pro",
    relativeRouteFilePath: "app/(en)/contact/page.tsx",
  },
  {
    expectedHeading: "关于 MRPack to ZIP",
    expectedMetadataTitle: "关于 MRPack to ZIP",
    expectedSecondaryText: "不是 Modrinth、CurseForge、Mojang 或 Microsoft 官方服务",
    expectedText: "浏览器内 Minecraft 整合包转换",
    relativeRouteFilePath: "app/(zh)/zh/about/page.tsx",
  },
  {
    expectedHeading: "隐私政策",
    expectedMetadataTitle: "隐私政策 - MRPack to ZIP",
    expectedSecondaryText: "大致请求时间",
    expectedText: "不会作为完整转换包整体上传",
    relativeRouteFilePath: "app/(zh)/zh/privacy/page.tsx",
  },
  {
    expectedHeading: "使用条款",
    expectedMetadataTitle: "使用条款 - MRPack to ZIP",
    expectedText: "CurseForge",
    relativeRouteFilePath: "app/(zh)/zh/terms/page.tsx",
  },
  {
    expectedHeading: "联系我们",
    expectedMetadataTitle: "联系我们 - MRPack to ZIP",
    expectedSecondaryText: "除非被明确要求，不要发送完整整合包压缩包",
    expectedText: "contact@mrpacktozip.pro",
    relativeRouteFilePath: "app/(zh)/zh/contact/page.tsx",
  },
];

describe("trust page routes", () => {
  test.each(trustRouteCases)(
    "$relativeRouteFilePath exports metadata and renders localized trust content",
    async ({
      expectedHeading,
      expectedMetadataTitle,
      expectedSecondaryText,
      expectedText,
      relativeRouteFilePath,
    }) => {
      const absoluteRouteFilePath = join(process.cwd(), relativeRouteFilePath);

      expect(
        existsSync(absoluteRouteFilePath),
        `${relativeRouteFilePath} should exist`,
      ).toBe(true);

      const pageModule = await import(pathToFileURL(absoluteRouteFilePath).href);
      const pageMarkup = renderToStaticMarkup(createElement(pageModule.default));

      expect(pageModule.metadata.title).toBe(expectedMetadataTitle);
      expect(pageMarkup).toContain(expectedHeading);
      expect(pageMarkup).toContain(expectedText);
      if (expectedSecondaryText) {
        expect(pageMarkup).toContain(expectedSecondaryText);
      }
    },
  );
});
