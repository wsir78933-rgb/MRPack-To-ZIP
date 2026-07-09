import { describe, expect, test } from "vitest";

import {
  chineseZipToMrpackPageCopy,
  englishZipToMrpackPageCopy,
} from "@/lib/i18n/zip-to-mrpack-page-copy";

describe("zip to mrpack page copy", () => {
  test("provides English copy for the CurseForge ZIP converter", () => {
    expect(englishZipToMrpackPageCopy.languageSwitchLabel).toBe("中文");
    expect(englishZipToMrpackPageCopy.hero.title).toBe("Convert CurseForge ZIP to MRPack");
    expect(englishZipToMrpackPageCopy.hero.description).toBe(
      "Convert CurseForge modpack exports into Modrinth-compatible .mrpack files.",
    );
    expect(englishZipToMrpackPageCopy.hero.chips).toEqual([
      "ZIP to MRPack",
      "CurseForge exports",
      "Browser conversion",
    ]);
    expect(englishZipToMrpackPageCopy.uploadPanel.acceptedFileLabel).toBe(".zip");
    expect(englishZipToMrpackPageCopy.previewPanel.title).toBe(
      "Crafting Converter",
    );
    expect(englishZipToMrpackPageCopy.previewPanel.idleStatusLabel).toBe("Idle");
    expect(englishZipToMrpackPageCopy.previewPanel.outputSlotLabel).toBe(
      "Output Slot",
    );
    expect(englishZipToMrpackPageCopy.previewPanel.outputFileLabel).toBe(
      "MRPack output",
    );
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
    expect(chineseZipToMrpackPageCopy.languageSwitchLabel).toBe("EN");
    expect(chineseZipToMrpackPageCopy.hero.title).toBe("将 CurseForge ZIP 转为 MRPack");
    expect(chineseZipToMrpackPageCopy.hero.description).toBe(
      "把 CurseForge 导出的整合包 ZIP 转换成兼容 Modrinth 的 .mrpack 文件。",
    );
    expect(chineseZipToMrpackPageCopy.hero.chips).toEqual([
      "ZIP 转 MRPack",
      "CurseForge 导出",
      "浏览器内转换",
    ]);
    expect(chineseZipToMrpackPageCopy.uploadPanel.selectButtonLabel).toBe("选择 CurseForge ZIP 文件");
    expect(chineseZipToMrpackPageCopy.previewPanel.title).toBe(
      "转换工作台",
    );
    expect(chineseZipToMrpackPageCopy.previewPanel.idleStatusLabel).toBe(
      "待机",
    );
    expect(chineseZipToMrpackPageCopy.previewPanel.outputSlotLabel).toBe(
      "输出槽",
    );
    expect(chineseZipToMrpackPageCopy.previewPanel.outputFileLabel).toBe(
      "MRPack 输出",
    );
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
    expect(englishPageText).toContain("project IDs");
    expect(englishPageText).toContain("file IDs");
    expect(englishPageText).toContain("SHA-1");
    expect(englishPageText).toContain("Modrinth matching");
    expect(englishPageText).toContain("protected API proxy");
    expect(englishPageText).toContain("not uploaded as a complete conversion package");
    expect(englishPageText).toContain("not a general ZIP converter");
    expect(englishPageText).toContain("failure cases");
    expect(englishPageText).toContain("privacy boundary");
    expect(englishZipToMrpackPageCopy.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(englishZipToMrpackPageCopy.limits.items.length).toBeGreaterThanOrEqual(3);
  });

  test("adds Chinese what, how, limits, and FAQ content", () => {
    const chinesePageText = collectCopyText(chineseZipToMrpackPageCopy);

    expect(chinesePageText).toContain("CurseForge ZIP");
    expect(chinesePageText).toContain("manifest.json");
    expect(chinesePageText).toContain("overrides");
    expect(chinesePageText).toContain("project ID");
    expect(chinesePageText).toContain("file ID");
    expect(chinesePageText).toContain("SHA-1");
    expect(chinesePageText).toContain("Modrinth 匹配");
    expect(chinesePageText).toContain("受保护的 API 代理");
    expect(chinesePageText).toContain("不会作为完整转换包整体上传");
    expect(chinesePageText).toContain("不是通用 ZIP 转换器");
    expect(chinesePageText).toContain("失败场景");
    expect(chinesePageText).toContain("隐私边界");
    expect(chineseZipToMrpackPageCopy.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(chineseZipToMrpackPageCopy.limits.items.length).toBeGreaterThanOrEqual(3);
  });

  test("provides localized footer trust links and brand disclaimer", () => {
    expect(englishZipToMrpackPageCopy.footer.links).toEqual(
      expect.arrayContaining([
        { label: "About", href: "/about" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Contact", href: "/contact" },
      ]),
    );
    expect(englishZipToMrpackPageCopy.footer.disclaimer).toContain("CurseForge");
    expect(chineseZipToMrpackPageCopy.footer.links).toEqual(
      expect.arrayContaining([
        { label: "关于", href: "/zh/about" },
        { label: "隐私", href: "/zh/privacy" },
        { label: "条款", href: "/zh/terms" },
        { label: "联系", href: "/zh/contact" },
      ]),
    );
    expect(chineseZipToMrpackPageCopy.footer.disclaimer).toContain("CurseForge");
  });

  test("links ZIP to MRPack footer section anchors to rendered section ids", () => {
    expect(englishZipToMrpackPageCopy.footer.links).toEqual(
      expect.arrayContaining([
        { label: "How it works", href: "#how-it-works" },
        { label: "FAQ", href: "#faq" },
      ]),
    );
    expect(chineseZipToMrpackPageCopy.footer.links).toEqual(
      expect.arrayContaining([
        { label: "如何转换", href: "#how-it-works" },
        { label: "FAQ", href: "#faq" },
      ]),
    );
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
