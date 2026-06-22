import {
  ConversionError,
  type ConversionErrorCode,
  conversionErrorCodes
} from "@/lib/mrpack/errors";

import { chineseLocaleCode } from "./locale-codes";

type ConversionErrorCopy = {
  categoryLabels: Record<ConversionErrorCode, string>;
  reasonLabel: string;
  unknownErrorLabel: string;
};

const englishConversionErrorCopy: ConversionErrorCopy = {
  categoryLabels: {
    [conversionErrorCodes.invalidInput]: "Invalid input",
    [conversionErrorCodes.invalidPath]: "Invalid archive path",
    [conversionErrorCodes.invalidUrl]: "Invalid URL",
    [conversionErrorCodes.invalidMrpack]: "Invalid MRPack archive",
    [conversionErrorCodes.modrinthApiError]: "Modrinth API error",
    [conversionErrorCodes.downloadFailed]: "Download failed",
    [conversionErrorCodes.zipBuildFailed]: "ZIP build failed"
  },
  reasonLabel: "Reason",
  unknownErrorLabel: "Unexpected conversion error"
};

const chineseConversionErrorCopy: ConversionErrorCopy = {
  categoryLabels: {
    [conversionErrorCodes.invalidInput]: "输入无效",
    [conversionErrorCodes.invalidPath]: "压缩包路径无效",
    [conversionErrorCodes.invalidUrl]: "URL 无效",
    [conversionErrorCodes.invalidMrpack]: "MRPack 压缩包无效",
    [conversionErrorCodes.modrinthApiError]: "Modrinth API 错误",
    [conversionErrorCodes.downloadFailed]: "下载失败",
    [conversionErrorCodes.zipBuildFailed]: "ZIP 生成失败"
  },
  reasonLabel: "原因",
  unknownErrorLabel: "未知转换错误"
};

export function formatConversionErrorForLocale(
  caughtError: unknown,
  localeCode: string
) {
  const conversionErrorCopy = getConversionErrorCopy(localeCode);

  if (caughtError instanceof ConversionError) {
    const categoryLabel = conversionErrorCopy.categoryLabels[caughtError.code];
    const detailMessage = formatConversionErrorDetail(caughtError, localeCode);
    return formatErrorMessage({
      categoryLabel,
      detailMessage,
      localeCode,
      reasonLabel: conversionErrorCopy.reasonLabel
    });
  }

  return formatErrorMessage({
    categoryLabel: conversionErrorCopy.unknownErrorLabel,
    detailMessage: getFallbackErrorMessage(caughtError),
    localeCode,
    reasonLabel: conversionErrorCopy.reasonLabel
  });
}

function getConversionErrorCopy(localeCode: string) {
  if (localeCode === chineseLocaleCode) {
    return chineseConversionErrorCopy;
  }

  return englishConversionErrorCopy;
}

function formatConversionErrorDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  if (conversionError.code === conversionErrorCodes.invalidPath) {
    return formatInvalidPathDetail(conversionError, localeCode);
  }

  if (conversionError.code === conversionErrorCodes.invalidUrl) {
    return formatInvalidUrlDetail(conversionError, localeCode);
  }

  if (conversionError.code === conversionErrorCodes.modrinthApiError) {
    return formatModrinthApiDetail(conversionError, localeCode);
  }

  if (conversionError.code === conversionErrorCodes.downloadFailed) {
    return formatDownloadFailureDetail(conversionError, localeCode);
  }

  if (conversionError.code === conversionErrorCodes.invalidInput) {
    return formatInvalidInputDetail(conversionError, localeCode);
  }

  return conversionError.message;
}

function formatInvalidPathDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const archivePath = readStringProperty(conversionError.context, "archivePath");
  const reason = readStringProperty(conversionError.context, "reason");

  if (archivePath === null || !reason) {
    return conversionError.message;
  }

  const pathReason = formatPathReason(reason, localeCode);
  if (localeCode === chineseLocaleCode) {
    return `路径 ${JSON.stringify(archivePath)} 无效：${pathReason}`;
  }

  return `Path ${JSON.stringify(archivePath)} is invalid: ${pathReason}`;
}

function formatPathReason(reason: string, localeCode: string) {
  const englishPathReasons: Record<string, string> = {
    absolute: "absolute paths are not allowed.",
    backslash: "backslashes are not allowed.",
    blank: "the path must not be blank.",
    current_directory: "current directory segments are not allowed.",
    empty_segment: "empty path segments are not allowed.",
    null_byte: "null bytes are not allowed.",
    parent_directory: "parent directory segments are not allowed.",
    windows_drive: "Windows drive paths are not allowed."
  };
  const chinesePathReasons: Record<string, string> = {
    absolute: "不允许使用绝对路径。",
    backslash: "不允许使用反斜杠。",
    blank: "路径不能为空。",
    current_directory: "不允许包含当前目录片段。",
    empty_segment: "不允许包含空路径片段。",
    null_byte: "不允许包含空字节。",
    parent_directory: "不允许包含父目录片段。",
    windows_drive: "不允许使用 Windows 盘符路径。"
  };

  const pathReasons =
    localeCode === chineseLocaleCode ? chinesePathReasons : englishPathReasons;
  return pathReasons[reason] ?? reason;
}

function formatInvalidUrlDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const protocol = readStringProperty(conversionError.context, "protocol");
  const reason = readStringProperty(conversionError.context, "reason");
  const urlText = readStringProperty(conversionError.context, "urlText");
  const valueName = readStringProperty(conversionError.context, "valueName");

  if (!reason || !urlText || !valueName) {
    return conversionError.message;
  }

  if (reason === "non_http_protocol") {
    if (localeCode === chineseLocaleCode) {
      return `${valueName} 的协议无效：${protocol ?? "unknown"}。只支持 http 或 https URL。`;
    }

    return `${valueName} has invalid protocol ${protocol ?? "unknown"}. Expected an http or https URL.`;
  }

  if (localeCode === chineseLocaleCode) {
    return `${valueName} 的 URL 无效：${urlText}。`;
  }

  return `${valueName} is not a valid URL: ${urlText}.`;
}

function formatModrinthApiDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const expectedDescription = readStringProperty(
    conversionError.context,
    "expectedDescription"
  );
  const fieldPath = readStringProperty(conversionError.context, "fieldPath");
  const project = readStringProperty(conversionError.context, "project");
  const detailsRecord = readObjectRecord(conversionError.details);
  const problemValue = detailsRecord?.problemValue;

  if (!expectedDescription || !fieldPath || !project) {
    return conversionError.message;
  }

  const localizedExpectedDescription = formatExpectedDescription(
    expectedDescription,
    localeCode
  );
  const formattedProblemValue = formatProblemValue(problemValue);

  if (localeCode === chineseLocaleCode) {
    return `项目 ${project} 的 Modrinth 返回字段 ${fieldPath} 无效：期望${localizedExpectedDescription}，实际为 ${formattedProblemValue}。`;
  }

  return `Modrinth response field ${fieldPath} for project ${project} is invalid: expected ${localizedExpectedDescription}, got ${formattedProblemValue}.`;
}

function formatExpectedDescription(
  expectedDescription: string,
  localeCode: string
) {
  if (localeCode !== chineseLocaleCode) {
    return expectedDescription;
  }

  const chineseExpectedDescriptions: Record<string, string> = {
    "file object": "文件对象",
    "files array": "文件数组",
    string: "字符串",
    "versions array": "版本数组",
    "version object": "版本对象"
  };

  return chineseExpectedDescriptions[expectedDescription] ?? expectedDescription;
}

function formatDownloadFailureDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const contentLengthBytes = readNumberProperty(
    conversionError.context,
    "contentLengthBytes"
  );
  const limitDescription = readStringProperty(
    conversionError.context,
    "limitDescription"
  );
  const maxBodyBytes = readNumberProperty(conversionError.context, "maxBodyBytes");
  const sourceLabel = readStringProperty(conversionError.context, "sourceLabel");
  const detailsRecord = readObjectRecord(conversionError.details);
  const downloadedByteCount = readNumberProperty(
    detailsRecord,
    "downloadedByteCount"
  );

  if (!limitDescription || maxBodyBytes === null || !sourceLabel) {
    return conversionError.message;
  }

  const localizedLimitDescription = formatLimitDescription(
    limitDescription,
    localeCode
  );

  if (downloadedByteCount !== null) {
    if (localeCode === chineseLocaleCode) {
      return `${sourceLabel} 已下载 ${downloadedByteCount} 字节，超过 ${maxBodyBytes} 字节限制（${localizedLimitDescription}）。`;
    }

    return `${sourceLabel} downloaded ${downloadedByteCount} bytes, exceeding the ${maxBodyBytes} byte limit (${localizedLimitDescription}).`;
  }

  if (contentLengthBytes !== null) {
    if (localeCode === chineseLocaleCode) {
      return `${sourceLabel} 的 Content-Length 为 ${contentLengthBytes} 字节，超过 ${maxBodyBytes} 字节限制（${localizedLimitDescription}）。`;
    }

    return `${sourceLabel} Content-Length is ${contentLengthBytes} bytes, exceeding the ${maxBodyBytes} byte limit (${localizedLimitDescription}).`;
  }

  return conversionError.message;
}

function formatLimitDescription(
  limitDescription: string,
  localeCode: string
) {
  if (localeCode !== chineseLocaleCode) {
    return limitDescription;
  }

  if (limitDescription === ".mrpack download limit") {
    return ".mrpack 下载限制";
  }

  if (limitDescription.startsWith("remaining total download limit for path ")) {
    return limitDescription.replace(
      "remaining total download limit for path ",
      "路径 "
    ).concat(" 的剩余总下载限制");
  }

  if (limitDescription.startsWith("single file limit for path ")) {
    return limitDescription
      .replace("single file limit for path ", "路径 ")
      .concat(" 的单文件限制");
  }

  return limitDescription;
}

function formatInvalidInputDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const reason = readStringProperty(conversionError.context, "reason");
  if (reason === "mrpack_source_size") {
    return formatMrpackSourceSizeDetail(conversionError, localeCode);
  }

  if (reason === "no_mrpack_file") {
    return formatNoMrpackFileDetail(conversionError, localeCode);
  }

  const inputMode = readStringProperty(conversionError.context, "inputMode");

  if (!inputMode) {
    return conversionError.message;
  }

  if (localeCode === chineseLocaleCode) {
    return `MRPack 输入模式 ${JSON.stringify(inputMode)} 无效。`;
  }

  return `MRPack input mode ${JSON.stringify(inputMode)} is invalid.`;
}

function formatMrpackSourceSizeDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const byteLength = readNumberProperty(conversionError.context, "byteLength");
  const maxBytes = readNumberProperty(conversionError.context, "maxBytes");
  const sourceLabel = readStringProperty(conversionError.context, "sourceLabel");

  if (byteLength === null || maxBytes === null || !sourceLabel) {
    return conversionError.message;
  }

  if (localeCode === chineseLocaleCode) {
    return `MRPack 来源 ${sourceLabel} 为 ${byteLength} 字节，超过 ${maxBytes} 字节限制。`;
  }

  return `MRPack source ${sourceLabel} is ${byteLength} bytes, exceeding the ${maxBytes} byte limit.`;
}

function formatNoMrpackFileDetail(
  conversionError: ConversionError,
  localeCode: string
) {
  const projectIdOrSlug = readStringProperty(conversionError.context, "projectIdOrSlug");

  if (!projectIdOrSlug) {
    return conversionError.message;
  }

  if (localeCode === chineseLocaleCode) {
    return `Modrinth 项目 ${projectIdOrSlug} 没有可转换的 .mrpack 文件。`;
  }

  return `Modrinth project ${projectIdOrSlug} does not contain a convertible .mrpack file.`;
}

function getFallbackErrorMessage(caughtError: unknown) {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return String(caughtError);
}

function readObjectRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readStringProperty(
  sourceRecord: Record<string, unknown> | null | undefined,
  propertyName: string
) {
  const propertyValue = sourceRecord?.[propertyName];
  return typeof propertyValue === "string" ? propertyValue : null;
}

function readNumberProperty(
  sourceRecord: Record<string, unknown> | null | undefined,
  propertyName: string
) {
  const propertyValue = sourceRecord?.[propertyName];
  return typeof propertyValue === "number" ? propertyValue : null;
}

function formatProblemValue(problemValue: unknown) {
  if (problemValue === undefined) {
    return "undefined";
  }

  const jsonText = JSON.stringify(problemValue);
  return jsonText === undefined ? String(problemValue) : jsonText;
}

function formatErrorMessage({
  categoryLabel,
  detailMessage,
  localeCode,
  reasonLabel
}: {
  categoryLabel: string;
  detailMessage: string;
  localeCode: string;
  reasonLabel: string;
}) {
  if (localeCode === chineseLocaleCode) {
    return `${categoryLabel}。${reasonLabel}：${detailMessage}`;
  }

  return `${categoryLabel}. ${reasonLabel}: ${detailMessage}`;
}
