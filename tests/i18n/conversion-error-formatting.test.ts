import { describe, expect, test } from "vitest";

import { formatConversionErrorForLocale } from "@/lib/i18n/conversion-error-formatting";
import { chineseLocaleCode, defaultLocaleCode } from "@/lib/i18n/locale-codes";
import { ConversionError, conversionErrorCodes } from "@/lib/mrpack/errors";

describe("formatConversionErrorForLocale", () => {
  test("formats English conversion errors with a localized category and structured path detail", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.invalidPath,
        'Invalid archive path: "mods/../evil.jar". Parent directory segments are not allowed.',
        undefined,
        { archivePath: "mods/../evil.jar", reason: "parent_directory" },
      ),
      defaultLocaleCode,
    );

    expect(formattedError).toBe(
      'Invalid archive path. Reason: Path "mods/../evil.jar" is invalid: parent directory segments are not allowed.',
    );
  });

  test("formats Chinese conversion errors with a localized path detail", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.invalidPath,
        'Invalid archive path: "mods/./evil.jar". Current directory segments are not allowed.',
        undefined,
        { archivePath: "mods/./evil.jar", reason: "current_directory" },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      '压缩包路径无效。原因：路径 "mods/./evil.jar" 无效：不允许包含当前目录片段。',
    );
  });

  test("formats Chinese blank path errors without falling back to English", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.invalidPath,
        'Invalid archive path: "". Path must not be blank.',
        undefined,
        { archivePath: "", reason: "blank" },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe('压缩包路径无效。原因：路径 "" 无效：路径不能为空。');
  });

  test("formats Chinese Modrinth API validation details without English fallback text", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.modrinthApiError,
        'Invalid Modrinth versions response for project sodium at versions[0].files: "bad". Expected files array.',
        undefined,
        {
          expectedDescription: "files array",
          fieldPath: "versions[0].files",
          project: "sodium",
        },
        { problemValue: "bad" },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      'Modrinth API 错误。原因：项目 sodium 的 Modrinth 返回字段 versions[0].files 无效：期望文件数组，实际为 "bad"。',
    );
  });

  test("formats Chinese Modrinth root validation details without English fallback text", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.modrinthApiError,
        'Invalid Modrinth versions response for project sodium at root: {"error":"bad"}. Expected versions array.',
        undefined,
        {
          expectedDescription: "versions array",
          fieldPath: "root",
          project: "sodium",
        },
        { problemValue: { error: "bad" } },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      'Modrinth API 错误。原因：项目 sodium 的 Modrinth 返回字段 root 无效：期望版本数组，实际为 {"error":"bad"}。',
    );
  });

  test("formats Chinese streamed download limit details", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.downloadFailed,
        "https://cdn.example.com/pack.mrpack downloaded 104857601 bytes, which exceeds the 104857600 byte .mrpack download limit.",
        undefined,
        {
          limitDescription: ".mrpack download limit",
          maxBodyBytes: 104857600,
          sourceLabel: "https://cdn.example.com/pack.mrpack",
        },
        { downloadedByteCount: 104857601 },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      "下载失败。原因：https://cdn.example.com/pack.mrpack 已下载 104857601 字节，超过 104857600 字节限制（.mrpack 下载限制）。",
    );
  });

  test("formats Chinese oversized mrpack source details", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.invalidInput,
        "MRPack source demo.mrpack is 104857601 bytes, which exceeds the 104857600 byte limit.",
        undefined,
        {
          byteLength: 104857601,
          maxBytes: 104857600,
          reason: "mrpack_source_size",
          sourceLabel: "demo.mrpack",
        },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      "输入无效。原因：MRPack 来源 demo.mrpack 为 104857601 字节，超过 104857600 字节限制。",
    );
  });

  test("formats Chinese invalid URL details", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.invalidUrl,
        "Invalid MRPack download URL https://bad url: https://bad url",
        undefined,
        {
          reason: "invalid_url",
          urlText: "https://bad url",
          valueName: "MRPack download URL https://bad url",
        },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      "URL 无效。原因：MRPack download URL https://bad url 的 URL 无效：https://bad url。",
    );
  });

  test("formats Chinese no mrpack project details", () => {
    const formattedError = formatConversionErrorForLocale(
      new ConversionError(
        conversionErrorCodes.invalidInput,
        "No .mrpack file found for Modrinth project demo.",
        undefined,
        { projectIdOrSlug: "demo", reason: "no_mrpack_file" },
      ),
      chineseLocaleCode,
    );

    expect(formattedError).toBe(
      "输入无效。原因：Modrinth 项目 demo 没有可转换的 .mrpack 文件。",
    );
  });

  test("formats unknown English errors with a localized fallback", () => {
    const formattedError = formatConversionErrorForLocale(
      new Error("Unexpected response from https://example.com/pack.mrpack"),
      defaultLocaleCode,
    );

    expect(formattedError).toBe(
      "Unexpected conversion error. Reason: Unexpected response from https://example.com/pack.mrpack",
    );
  });

  test("formats unknown Chinese thrown values with a localized fallback", () => {
    const formattedError = formatConversionErrorForLocale(
      "bad-project-value",
      chineseLocaleCode,
    );

    expect(formattedError).toBe("未知转换错误。原因：bad-project-value");
  });
});
