import { ConversionError, conversionErrorCodes } from "./errors";

export function isMrpackFileName(fileName: string) {
  return fileName.trim().toLowerCase().endsWith(".mrpack");
}

export function parseHttpUrl(urlText: string, valueName: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlText);
  } catch (caughtError) {
    throw new ConversionError(
      conversionErrorCodes.invalidUrl,
      `Invalid ${valueName}: ${urlText}`,
      caughtError,
      { reason: "invalid_url", urlText, valueName },
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ConversionError(
      conversionErrorCodes.invalidUrl,
      `Invalid ${valueName}: ${urlText}. Expected http or https URL.`,
      undefined,
      {
        protocol: parsedUrl.protocol,
        reason: "non_http_protocol",
        urlText,
        valueName,
      },
    );
  }

  return parsedUrl;
}
