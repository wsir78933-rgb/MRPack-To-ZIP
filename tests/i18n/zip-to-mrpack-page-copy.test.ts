import { describe, expect, test } from "vitest";

import {
  chineseZipToMrpackPageCopy,
  englishZipToMrpackPageCopy,
} from "@/lib/i18n/zip-to-mrpack-page-copy";

describe("zip to mrpack page copy", () => {
  test("provides English copy for the CurseForge ZIP converter", () => {
    expect(englishZipToMrpackPageCopy.hero.title).toBe("Convert CurseForge ZIP to MRPack");
    expect(englishZipToMrpackPageCopy.uploadPanel.acceptedFileLabel).toBe(".zip");
    expect(englishZipToMrpackPageCopy.statusLabels.resolvingCurseForgeFiles).toBe(
      "Resolving CurseForge files...",
    );
    expect(englishZipToMrpackPageCopy.statusLabels.downloadingCurseForgeFiles).toBe(
      "Bundling CurseForge-only files...",
    );
    expect(englishZipToMrpackPageCopy.uploadPanel.progressCountLabel).toBe(
      "Bundled CurseForge files",
    );
    expect(englishZipToMrpackPageCopy.uploadPanel.downloadLabel).toBe(
      "Download MRPack",
    );
    expect(englishZipToMrpackPageCopy.uploadPanel.successDescription).toBe(
      "Conversion complete. Click the button below to download your .mrpack file.",
    );
  });

  test("provides Chinese copy for the CurseForge ZIP converter", () => {
    expect(chineseZipToMrpackPageCopy.hero.title).toBe("将 CurseForge ZIP 转为 MRPack");
    expect(chineseZipToMrpackPageCopy.uploadPanel.selectButtonLabel).toBe("选择 CurseForge ZIP 文件");
    expect(chineseZipToMrpackPageCopy.statusLabels.buildingMrpack).toBe("正在生成 MRPack...");
    expect(chineseZipToMrpackPageCopy.statusLabels.downloadingCurseForgeFiles).toBe(
      "正在打包 CurseForge-only 文件...",
    );
    expect(chineseZipToMrpackPageCopy.uploadPanel.progressCountLabel).toBe(
      "已打包 CurseForge 文件",
    );
    expect(chineseZipToMrpackPageCopy.uploadPanel.downloadLabel).toBe(
      "下载 MRPack",
    );
    expect(chineseZipToMrpackPageCopy.uploadPanel.successDescription).toBe(
      "转换完成，可点击下方按钮下载 .mrpack 文件。",
    );
  });

  test("marks the ZIP to MRPack navigation item active on ZIP to MRPack pages", () => {
    const englishActiveNavigationLinks = englishZipToMrpackPageCopy.navLinks.filter(
      (navigationLink) => navigationLink.isActive,
    );
    const chineseActiveNavigationLinks = chineseZipToMrpackPageCopy.navLinks.filter(
      (navigationLink) => navigationLink.isActive,
    );

    expect(englishActiveNavigationLinks).toEqual([
      {
        href: "/zip-to-mrpack",
        label: "ZIP to MRPack",
        isActive: true,
      },
    ]);
    expect(chineseActiveNavigationLinks).toEqual([
      {
        href: "/zh/zip-to-mrpack",
        label: "ZIP 转 MRPack",
        isActive: true,
      },
    ]);
  });

  test("adds English what, how, limits, and FAQ content", () => {
    const englishPageText = collectCopyText(englishZipToMrpackPageCopy);

    expect(englishPageText).toContain("CurseForge ZIP");
    expect(englishPageText).toContain("manifest.json");
    expect(englishPageText).toContain("overrides");
    expect(englishPageText).toContain("Modrinth matching");
    expect(englishPageText).toContain("protected API proxy");
    expect(englishPageText).toContain("failure cases");
    expect(englishPageText).toContain("privacy boundary");
    expect(englishZipToMrpackPageCopy.faq.items.length).toBeGreaterThanOrEqual(4);
    expect(englishZipToMrpackPageCopy.limits.items.length).toBeGreaterThanOrEqual(3);
  });

  test("adds Chinese what, how, limits, and FAQ content", () => {
    const chinesePageText = collectCopyText(chineseZipToMrpackPageCopy);

    expect(chinesePageText).toContain("CurseForge ZIP");
    expect(chinesePageText).toContain("manifest.json");
    expect(chinesePageText).toContain("overrides");
    expect(chinesePageText).toContain("Modrinth 匹配");
    expect(chinesePageText).toContain("受保护的 API 代理");
    expect(chinesePageText).toContain("失败场景");
    expect(chinesePageText).toContain("隐私边界");
    expect(chineseZipToMrpackPageCopy.faq.items.length).toBeGreaterThanOrEqual(4);
    expect(chineseZipToMrpackPageCopy.limits.items.length).toBeGreaterThanOrEqual(3);
  });
});

function collectCopyText(copyValue: unknown): string {
  if (typeof copyValue === "string") {
    return copyValue;
  }

  if (Array.isArray(copyValue)) {
    return copyValue.map(collectCopyText).join("\n");
  }

  if (copyValue && typeof copyValue === "object") {
    return Object.values(copyValue).map(collectCopyText).join("\n");
  }

  return "";
}
