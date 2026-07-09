import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

describe("zip to mrpack routes", () => {
  test("English route renders the ZIP to MRPack page", async () => {
    const pageModule = await import("@/app/(en)/zip-to-mrpack/page");
    const pageElement = pageModule.default();

    expect(pageModule.metadata.title).toBe(
      "CurseForge ZIP to MRPack Converter - Free Online Tool",
    );
    expect(pageElement.type.name).toBe("LocalizedZipToMrpackPage");
  });

  test("Chinese route renders the ZIP to MRPack page", async () => {
    const pageModule = await import("@/app/(zh)/zh/zip-to-mrpack/page");
    const pageElement = pageModule.default();

    expect(pageModule.metadata.title).toBe(
      "CurseForge ZIP 转 MRPack 转换器 - 免费在线工具",
    );
    expect(pageElement.type.name).toBe("LocalizedZipToMrpackPage");
  });
});
