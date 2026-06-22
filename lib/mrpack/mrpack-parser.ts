import JSZip from "jszip";

import { ConversionError, conversionErrorCodes, toConversionError } from "./errors";
import { maxManifestFileCount } from "./limits";
import { normalizeOverridePath, validateArchivePath } from "./path-safety";

export type ModrinthIndexFile = {
  path: string;
  downloads: string[];
  hashes?: Record<string, string>;
  fileSize?: number;
};

export type ModrinthIndex = {
  name?: string;
  versionId?: string;
  dependencies?: Record<string, string>;
  files: ModrinthIndexFile[];
};

export type OverrideFile = {
  sourcePath: string;
  outputPath: string;
  content: Blob;
};

export async function loadMrpackArchive(mrpackBuffer: ArrayBuffer) {
  try {
    return await JSZip.loadAsync(mrpackBuffer);
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.invalidMrpack,
      "Invalid .mrpack archive. The provided ArrayBuffer could not be read as a ZIP archive.",
      caughtError,
    );
  }
}

export async function readModrinthIndex(mrpackArchive: JSZip) {
  const indexFile = mrpackArchive.file("modrinth.index.json");

  if (!indexFile) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      "Invalid .mrpack archive. Missing required modrinth.index.json.",
    );
  }

  return indexFile.async("string");
}

export function parseModrinthIndexJson(indexJsonText: string): ModrinthIndex {
  let parsedIndex: unknown;

  try {
    parsedIndex = JSON.parse(indexJsonText);
  } catch (caughtError) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid modrinth.index.json JSON: ${indexJsonText}`,
      caughtError,
    );
  }

  if (!parsedIndex || typeof parsedIndex !== "object") {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid modrinth.index.json value: ${indexJsonText}. Expected an object.`,
    );
  }

  const indexRecord = parsedIndex as Record<string, unknown>;
  if (!Array.isArray(indexRecord.files)) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid modrinth.index.json files value: ${String(indexRecord.files)}. Expected files array.`,
    );
  }

  if (indexRecord.files.length > maxManifestFileCount) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid modrinth.index.json files count: ${indexRecord.files.length}. Maximum allowed is ${maxManifestFileCount}.`,
    );
  }

  const files = indexRecord.files.map(parseModrinthIndexFile);

  return {
    name: typeof indexRecord.name === "string" ? indexRecord.name : undefined,
    versionId: typeof indexRecord.versionId === "string" ? indexRecord.versionId : undefined,
    dependencies: parseDependencies(indexRecord.dependencies),
    files,
  };
}

export async function collectOverrideFiles(mrpackArchive: JSZip) {
  const overrideFiles: OverrideFile[] = [];
  const archiveFileEntries = Object.values(mrpackArchive.files);

  for (const archiveFileEntry of archiveFileEntries) {
    if (archiveFileEntry.dir) {
      continue;
    }

    const outputPath = normalizeOverridePath(archiveFileEntry.name);
    if (!outputPath) {
      continue;
    }

    overrideFiles.push({
      sourcePath: archiveFileEntry.name,
      outputPath,
      content: new Blob([await archiveFileEntry.async("arraybuffer")]),
    });
  }

  return overrideFiles;
}

function parseModrinthIndexFile(indexFileValue: unknown): ModrinthIndexFile {
  if (!indexFileValue || typeof indexFileValue !== "object") {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid modrinth.index.json file entry: ${String(indexFileValue)}. Expected object.`,
    );
  }

  const indexFileRecord = indexFileValue as Record<string, unknown>;
  if (typeof indexFileRecord.path !== "string") {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid modrinth.index.json file path: ${String(indexFileRecord.path)}. Expected string.`,
    );
  }

  if (!Array.isArray(indexFileRecord.downloads)) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid downloads for path ${indexFileRecord.path}: ${String(indexFileRecord.downloads)}. Expected array.`,
    );
  }

  const downloads = indexFileRecord.downloads.map((downloadUrlValue) => {
    if (typeof downloadUrlValue !== "string") {
      throw new ConversionError(
        conversionErrorCodes.invalidMrpack,
        `Invalid download URL for path ${indexFileRecord.path}: ${String(downloadUrlValue)}. Expected string.`,
      );
    }

    return downloadUrlValue;
  });

  const validatedPath = validateArchivePath(indexFileRecord.path);

  return {
    path: validatedPath,
    downloads,
    hashes: parseHashes(indexFileRecord.hashes, validatedPath),
    fileSize: parseFileSize(indexFileRecord, validatedPath),
  };
}

function parseDependencies(dependenciesValue: unknown) {
  if (!dependenciesValue || typeof dependenciesValue !== "object" || Array.isArray(dependenciesValue)) {
    return undefined;
  }

  const dependenciesRecord = dependenciesValue as Record<string, unknown>;
  const dependencies: Record<string, string> = {};

  for (const [dependencyName, dependencyVersion] of Object.entries(dependenciesRecord)) {
    if (typeof dependencyVersion === "string") {
      dependencies[dependencyName] = dependencyVersion;
    }
  }

  return dependencies;
}

function parseFileSize(indexFileRecord: Record<string, unknown>, path: string) {
  if (!Object.prototype.hasOwnProperty.call(indexFileRecord, "fileSize")) {
    return undefined;
  }

  const fileSizeValue = indexFileRecord.fileSize;
  if (
    typeof fileSizeValue !== "number" ||
    !Number.isSafeInteger(fileSizeValue) ||
    fileSizeValue < 0
  ) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid referenced file metadata for path ${path}: fileSize ${String(fileSizeValue)}. Expected a non-negative safe integer.`,
    );
  }

  return fileSizeValue;
}

function parseHashes(hashesValue: unknown, path: string) {
  if (hashesValue === undefined) {
    return undefined;
  }

  if (!hashesValue || typeof hashesValue !== "object" || Array.isArray(hashesValue)) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid referenced file metadata for path ${path}: hashes ${String(hashesValue)}. Expected object.`,
    );
  }

  const hashesRecord = hashesValue as Record<string, unknown>;
  const hashes: Record<string, string> = {};

  for (const [hashName, hashValue] of Object.entries(hashesRecord)) {
    if (hashName === "sha512" || hashName === "sha1") {
      hashes[hashName] = parseExpectedHash(hashName, hashValue, path);
    } else if (typeof hashValue === "string") {
      hashes[hashName] = hashValue;
    }
  }

  return hashes;
}

function parseExpectedHash(hashName: "sha512" | "sha1", hashValue: unknown, path: string) {
  const expectedHexLength = hashName === "sha512" ? 128 : 40;

  if (typeof hashValue !== "string") {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid referenced file metadata for path ${path}: ${hashName} hash ${String(hashValue)}. Expected ${expectedHexLength}-character hex string.`,
    );
  }

  if (!new RegExp(`^[a-fA-F0-9]{${expectedHexLength}}$`).test(hashValue)) {
    throw new ConversionError(
      conversionErrorCodes.invalidMrpack,
      `Invalid referenced file metadata for path ${path}: ${hashName} hash ${hashValue}. Expected ${expectedHexLength}-character hex string.`,
    );
  }

  return hashValue;
}
