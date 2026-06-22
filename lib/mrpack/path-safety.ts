import { ConversionError, conversionErrorCodes } from "./errors";

const overridePathPrefixes = ["overrides/", "client-overrides/", "server-overrides/"];

export function validateArchivePath(archivePath: string) {
  if (archivePath.trim().length === 0) {
    throw createInvalidPathError(archivePath, "blank", "Path must not be blank.");
  }

  if (archivePath.includes("\u0000")) {
    throw createInvalidPathError(archivePath, "null_byte", "Path contains a null byte.");
  }

  if (archivePath.startsWith("/") || archivePath.startsWith("\\")) {
    throw createInvalidPathError(archivePath, "absolute", "Absolute paths are not allowed.");
  }

  if (/^[A-Za-z]:/.test(archivePath)) {
    throw createInvalidPathError(
      archivePath,
      "windows_drive",
      "Windows drive paths are not allowed.",
    );
  }

  if (archivePath.includes("\\")) {
    throw createInvalidPathError(archivePath, "backslash", "Backslashes are not allowed.");
  }

  const pathSegments = archivePath.split("/");
  if (pathSegments.includes("")) {
    throw createInvalidPathError(
      archivePath,
      "empty_segment",
      "Empty path segments are not allowed.",
    );
  }

  if (pathSegments.includes(".")) {
    throw createInvalidPathError(
      archivePath,
      "current_directory",
      "Current directory segments are not allowed.",
    );
  }

  if (pathSegments.includes("..")) {
    throw createInvalidPathError(
      archivePath,
      "parent_directory",
      "Parent directory segments are not allowed.",
    );
  }

  return archivePath;
}

export function normalizeOverridePath(archivePath: string) {
  validateArchivePath(archivePath);

  const overridePathPrefix = overridePathPrefixes.find((pathPrefix) =>
    archivePath.startsWith(pathPrefix),
  );

  if (!overridePathPrefix) {
    return null;
  }

  const outputPath = archivePath.slice(overridePathPrefix.length);
  return validateArchivePath(outputPath);
}

function createInvalidPathError(
  archivePath: string,
  reason: string,
  reasonMessage: string,
) {
  const displayedArchivePath = JSON.stringify(archivePath);
  return new ConversionError(
    conversionErrorCodes.invalidPath,
    `Invalid archive path: ${displayedArchivePath}. ${reasonMessage}`,
    undefined,
    { archivePath, reason },
  );
}
