import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

describe("llms.txt", () => {
  test("lists core routes, trust pages, and support contact", async () => {
    const llmsText = await readFile("public/llms.txt", "utf8");

    expect(llmsText).toContain("# MRPack to ZIP");
    expect(llmsText).toContain("https://mrpacktozip.pro/");
    expect(llmsText).toContain("https://mrpacktozip.pro/zh");
    expect(llmsText).toContain("https://mrpacktozip.pro/zip-to-mrpack");
    expect(llmsText).toContain("https://mrpacktozip.pro/zh/zip-to-mrpack");
    expect(llmsText).toContain("https://mrpacktozip.pro/about");
    expect(llmsText).toContain("https://mrpacktozip.pro/privacy");
    expect(llmsText).toContain("https://mrpacktozip.pro/terms");
    expect(llmsText).toContain("https://mrpacktozip.pro/contact");
    expect(llmsText).toContain("https://mrpacktozip.pro/zh/about");
    expect(llmsText).toContain("https://mrpacktozip.pro/zh/privacy");
    expect(llmsText).toContain("https://mrpacktozip.pro/zh/terms");
    expect(llmsText).toContain("https://mrpacktozip.pro/zh/contact");
    expect(llmsText).toContain("contact@mrpacktozip.pro");
  });

  test("does not list API routes, assets, or redirect entry points", async () => {
    const llmsText = await readFile("public/llms.txt", "utf8");

    expect(llmsText).not.toContain("https://mrpacktozip.pro/api/");
    expect(llmsText).not.toContain("https://mrpacktozip.pro/assets/");
    expect(llmsText).not.toContain("https://mrpacktozip.pro/en");
    expect(llmsText).not.toContain("https://mrpacktozip.pro/en/zip-to-mrpack");
    expect(llmsText).not.toContain(".DS_Store");
  });
});
