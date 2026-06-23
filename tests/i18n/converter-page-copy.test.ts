import { describe, expect, test } from "vitest";

import {
  chineseConverterPageCopy,
  englishConverterPageCopy,
} from "@/lib/i18n/converter-page-copy";
import { converterInputModes } from "@/lib/mrpack/conversion-workflow";

describe("converter page copy", () => {
  test("keeps converter input mode copy aligned with workflow modes", () => {
    expect(Object.keys(chineseConverterPageCopy.converterPanel.modes).sort()).toEqual(
      [...converterInputModes].sort(),
    );
  });

  test("localizes Chinese source card titles", () => {
    expect(chineseConverterPageCopy.converterPanel.modes.project.title).toBe("项目 ID");
    expect(chineseConverterPageCopy.converterPanel.modes.url.title).toBe("下载链接");
    expect(chineseConverterPageCopy.converterPanel.modes.upload.title).toBe("上传文件");
  });

  test("links the main converter page to the ZIP to MRPack route", () => {
    expect(chineseConverterPageCopy.navLinks).toContainEqual({
      label: "ZIP 转 MRPack",
      href: "/zh/zip-to-mrpack",
      isActive: false,
    });
  });

  test("provides Chinese text for referenced file progress counts", () => {
    expect(chineseConverterPageCopy.converterPanel.progressCountLabel).toBe(
      "已处理引用文件",
    );
  });

  test("uses manual download copy after conversion completes", () => {
    expect(englishConverterPageCopy.converterPanel.downloadLabel).toBe(
      "Download ZIP",
    );
    expect(englishConverterPageCopy.converterPanel.successNote).toBe(
      "Conversion complete. Click the button to download the ZIP.",
    );
    expect(chineseConverterPageCopy.converterPanel.downloadLabel).toBe(
      "下载 ZIP",
    );
    expect(chineseConverterPageCopy.converterPanel.successNote).toBe(
      "转换完成，可点击按钮下载 ZIP。",
    );
  });

  test("covers core English search intent without keyword stuffing", () => {
    const englishPageText = collectCopyText(englishConverterPageCopy);

    expect(englishPageText).toContain("MRPack converter");
    expect(englishPageText).toContain("Modrinth pack to ZIP");
    expect(englishPageText).toContain("Minecraft modpack converter");
  });

  test("adds homepage depth for format, launcher, and troubleshooting intent", () => {
    const englishPageText = collectCopyText(englishConverterPageCopy);
    const chinesePageText = collectCopyText(chineseConverterPageCopy);

    for (const expectedEnglishText of [
      "MRPack vs ZIP",
      "modrinth.index.json",
      "overrides",
      "Prism Launcher",
      "MultiMC",
      "Official Minecraft Launcher",
      "Technic",
      "FAILED_DOWNLOADS.txt",
    ]) {
      expect(englishPageText).toContain(expectedEnglishText);
    }

    for (const expectedChineseText of [
      "MRPack 与 ZIP",
      "modrinth.index.json",
      "overrides",
      "Prism Launcher",
      "MultiMC",
      "官方 Minecraft 启动器",
      "Technic",
      "FAILED_DOWNLOADS.txt",
    ]) {
      expect(chinesePageText).toContain(expectedChineseText);
    }

    expect(englishConverterPageCopy.faq.items.length).toBeGreaterThanOrEqual(7);
    expect(chineseConverterPageCopy.faq.items.length).toBeGreaterThanOrEqual(7);
  });

  test("omits repeated conceptual FAQ questions from both locales", () => {
    const englishFaqQuestions = englishConverterPageCopy.faq.items.map(
      (faqItem) => faqItem.question,
    );
    const chineseFaqQuestions = chineseConverterPageCopy.faq.items.map(
      (faqItem) => faqItem.question,
    );

    expect(englishFaqQuestions).not.toContain("Why convert .mrpack to ZIP?");
    expect(englishFaqQuestions).not.toContain(
      "What is the difference between MRPack and ZIP?",
    );
    expect(englishFaqQuestions).not.toContain("Does it need a backend?");
    expect(chineseFaqQuestions).not.toContain("为什么要把 .mrpack 转成 ZIP？");
    expect(chineseFaqQuestions).not.toContain("MRPack 与 ZIP 有什么区别？");
    expect(chineseFaqQuestions).not.toContain("这个工具需要后端吗？");
  });

  test("documents real converter limits in English and Chinese", () => {
    const englishPageText = collectCopyText(englishConverterPageCopy);
    const chinesePageText = collectCopyText(chineseConverterPageCopy);

    for (const expectedLimitText of [
      "100 MB",
      "250 MB",
      "1 GB",
      "3000",
      "CORS",
      "FAILED_DOWNLOADS.txt",
    ]) {
      expect(englishPageText).toContain(expectedLimitText);
      expect(chinesePageText).toContain(expectedLimitText);
    }
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
