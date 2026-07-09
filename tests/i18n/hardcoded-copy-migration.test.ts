import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  chineseConverterPageCopy,
  englishConverterPageCopy,
} from "@/lib/i18n/converter-page-copy";
import {
  siteMetadataCopyByRoute,
  siteMetadataSocialPreviewImageAlt,
} from "@/lib/i18n/site-metadata-copy";
import {
  chineseAboutPageCopy,
  englishAboutPageCopy,
} from "@/lib/i18n/trust-page-copy";

function readProjectFile(relativeFilePath: string) {
  return readFileSync(join(process.cwd(), relativeFilePath), "utf8");
}

describe("hardcoded copy migration", () => {
  test("keeps homepage chrome text in converter i18n copy", () => {
    expect(englishConverterPageCopy.languageSwitchLabel).toBe("中文");
    expect(chineseConverterPageCopy.languageSwitchLabel).toBe("EN");
    expect(englishConverterPageCopy.hero.chips).toEqual([
      "MRPack to ZIP",
      "CurseForge ZIP to MRPack",
      "Browser-first conversion",
    ]);
    expect(chineseConverterPageCopy.hero.chips).toEqual([
      "MRPack 转 ZIP",
      "CurseForge ZIP 转 MRPack",
      "浏览器内转换",
    ]);
    expect(englishConverterPageCopy.hero.chipListAriaLabel).toBe(
      "Supported conversion flows",
    );
    expect(chineseConverterPageCopy.hero.chipListAriaLabel).toBe("支持的转换流程");
    expect(englishConverterPageCopy.converterPanel.previewPanel.title).toBe(
      "Crafting Converter",
    );
    expect(englishConverterPageCopy.converterPanel.previewPanel.idleStatusLabel).toBe(
      "Idle",
    );
    expect(englishConverterPageCopy.converterPanel.previewPanel.outputSlotLabel).toBe(
      "Output Slot",
    );
    expect(englishConverterPageCopy.converterPanel.previewPanel.outputFileLabel).toBe(
      "ZIP archive",
    );
    expect(chineseConverterPageCopy.converterPanel.previewPanel.title).toBe(
      "转换工作台",
    );
    expect(chineseConverterPageCopy.converterPanel.previewPanel.idleStatusLabel).toBe(
      "空闲",
    );
    expect(chineseConverterPageCopy.converterPanel.previewPanel.outputSlotLabel).toBe(
      "输出槽",
    );
    expect(chineseConverterPageCopy.converterPanel.previewPanel.outputFileLabel).toBe(
      "ZIP 压缩包",
    );
    expect(englishConverterPageCopy.conversionStates.ariaLabel).toBe(
      "Conversion states",
    );
    expect(chineseConverterPageCopy.conversionStates.ariaLabel).toBe("转换状态");
    expect(englishConverterPageCopy.launcherSupport.tableAriaLabel).toBe(
      "Launcher support table",
    );
    expect(chineseConverterPageCopy.launcherSupport.tableAriaLabel).toBe(
      "启动器兼容表",
    );
  });

  test("keeps trust page chrome text in trust i18n copy", () => {
    expect(englishAboutPageCopy.hero.chips).toEqual([
      "Trust page",
      "Privacy boundary",
      "Contact",
    ]);
    expect(chineseAboutPageCopy.hero.chips).toEqual([
      "信任页面",
      "隐私边界",
      "联系方式",
    ]);
    expect(englishAboutPageCopy.hero.chipListAriaLabel).toBe(
      "Trust page sections",
    );
    expect(chineseAboutPageCopy.hero.chipListAriaLabel).toBe("信任页面栏目");

    const trustPageSource = readProjectFile("components/localized-trust-page.tsx");

    expect(trustPageSource).toContain(
      "chipListAriaLabel={copy.hero.chipListAriaLabel}",
    );
  });

  test("keeps not-found copy in locale copy files", async () => {
    const notFoundCopyPath = join(
      process.cwd(),
      "lib/i18n/not-found-page-copy.ts",
    );

    expect(existsSync(notFoundCopyPath)).toBe(true);

    const {
      chineseNotFoundPageCopy,
      englishNotFoundPageCopy,
    } = await import("@/lib/i18n/not-found-page-copy");

    expect(englishNotFoundPageCopy).toEqual({
      htmlLang: "en",
      title: "Page Not Found",
      message:
        "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
      homeHref: "/",
      homeLabel: "Back to Home",
    });
    expect(chineseNotFoundPageCopy).toEqual({
      htmlLang: "zh-Hans",
      title: "页面未找到",
      message: "你访问的页面可能已被移除、重命名，或暂时不可用。",
      homeHref: "/zh",
      homeLabel: "返回首页",
    });
  });

  test("keeps SEO metadata copy in locale copy files", () => {
    expect(siteMetadataSocialPreviewImageAlt).toBe(
      "MRPack to ZIP converter interface",
    );
    expect(siteMetadataCopyByRoute["/"]).toEqual({
      title: "MRPack to ZIP Converter - Free Online Modrinth Modpack Tool",
      description:
        "Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.",
    });
    expect(siteMetadataCopyByRoute["/zh"]).toEqual({
      title: "MRPack 转 ZIP 转换器 - 免费在线 Modrinth 模组包工具",
      description:
        "在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。",
    });
    expect(siteMetadataCopyByRoute["/zip-to-mrpack"]).toEqual({
      title: "CurseForge ZIP to MRPack Converter - Free Online Tool",
      description:
        "Convert CurseForge modpack ZIP exports into Modrinth-compatible MRPack files.",
    });
    expect(siteMetadataCopyByRoute["/zh/zip-to-mrpack"]).toEqual({
      title: "CurseForge ZIP 转 MRPack 转换器 - 免费在线工具",
      description:
        "在浏览器中把 CurseForge 整合包 ZIP 转换成兼容 Modrinth 的 MRPack 文件。",
    });
  });

  test("removes visible hardcoded copy from localized components and routes", () => {
    const hardcodedCopyByFilePath = new Map([
      [
        "components/localized-converter-page.tsx",
        [
          "Crafting Converter",
          "Output Slot",
          "ZIP archive",
          "Conversion states",
          "Launcher support table",
          "CurseForge ZIP to MRPack",
          "Browser-first conversion",
        ],
      ],
      [
        "components/minecraft-workbench-layout.tsx",
        ["Supported conversion flows"],
      ],
      [
        "components/localized-trust-page.tsx",
        [
          "Trust page",
          "Privacy boundary",
          "Contact",
          "信任页面",
          "隐私边界",
          "联系方式",
        ],
      ],
      [
        "app/(en)/layout.tsx",
        [
          "MRPack to ZIP Converter - Free Online Modrinth Modpack Tool",
          "Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.",
        ],
      ],
      [
        "app/(zh)/layout.tsx",
        [
          "MRPack 转 ZIP 在线转换器 - Minecraft 模组包工具",
          "在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。",
        ],
      ],
      [
        "app/(en)/not-found.tsx",
        [
          "Page Not Found",
          "The page you are looking for might have been removed",
          "Back to Home",
        ],
      ],
      [
        "app/(zh)/not-found.tsx",
        ["页面未找到", "你访问的页面可能已被移除", "返回首页"],
      ],
      [
        "app/(en)/[...notFoundSegments]/route.ts",
        [
          "Page Not Found",
          "The page you are looking for might have been removed",
          "Back to Home",
        ],
      ],
      [
        "app/(zh)/zh/[...notFoundSegments]/route.ts",
        ["页面未找到", "你访问的页面可能已被移除", "返回首页"],
      ],
      [
        "lib/seo/site-metadata.ts",
        [
          "MRPack to ZIP converter interface",
          "MRPack to ZIP Converter - Free Online Modrinth Modpack Tool",
          "Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.",
          "MRPack 转 ZIP 在线转换器 - Minecraft 模组包工具",
          "MRPack 转 ZIP 转换器 - 免费在线 Modrinth 模组包工具",
          "在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。",
          "ZIP to MRPack Converter",
          "CurseForge ZIP to MRPack Converter - Free Online Tool",
          "Convert CurseForge modpack ZIP exports into Modrinth-compatible MRPack files.",
          "ZIP 转 MRPack 转换器",
          "在浏览器中把 CurseForge 整合包 ZIP 转换成兼容 Modrinth 的 MRPack 文件。",
          "Privacy Policy - MRPack to ZIP",
          "隐私政策 - MRPack to ZIP",
        ],
      ],
      [
        "lib/seo/structured-data.ts",
        [
          "ZIP to MRPack Converter",
          "CurseForge ZIP to MRPack Converter - Free Online Tool",
          "ZIP 转 MRPack 转换器",
          "CurseForge ZIP 转 MRPack 转换器 - 免费在线工具",
        ],
      ],
    ]);

    for (const [relativeFilePath, hardcodedTexts] of hardcodedCopyByFilePath) {
      const fileSource = readProjectFile(relativeFilePath);

      for (const hardcodedText of hardcodedTexts) {
        expect(fileSource, `${relativeFilePath} should use i18n copy`).not.toContain(
          hardcodedText,
        );
      }
    }
  });
});
