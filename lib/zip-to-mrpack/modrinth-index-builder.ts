import type { CurseForgeManifest } from "../curseforge/manifest-parser";
import { ConversionError, conversionErrorCodes } from "../mrpack/errors";
import { validateArchivePath } from "../mrpack/path-safety";

export type MatchedModrinthFile = {
  curseForgeProjectId: number;
  curseForgeFileId: number;
  path: string;
  downloads: string[];
  hashes: Record<string, string>;
  fileSize?: number;
};

export type ModrinthIndexFile = {
  path: string;
  env: ModrinthIndexFileEnvironment;
  downloads: string[];
  hashes: Record<string, string>;
  fileSize?: number;
};

export type ModrinthIndexFileEnvironment = {
  client: "required";
  server: "required";
};

export type ModrinthIndex = {
  formatVersion: 1;
  game: "minecraft";
  name: string;
  versionId: string;
  dependencies: Record<string, string>;
  files: ModrinthIndexFile[];
};

export type CreateModrinthIndexInput = {
  curseForgeManifest: CurseForgeManifest;
  matchedModrinthFiles: MatchedModrinthFile[];
};

type LoaderDependency = {
  dependencyName: string;
  version: string;
};

const loaderDependencyPatterns = [
  { prefix: "fabric-loader-", dependencyName: "fabric-loader" },
  { prefix: "quilt-loader-", dependencyName: "quilt-loader" },
  { prefix: "neoforge-", dependencyName: "neoforge" },
  { prefix: "forge-", dependencyName: "forge" },
  { prefix: "fabric-", dependencyName: "fabric-loader" },
  { prefix: "quilt-", dependencyName: "quilt-loader" },
];

const fallbackPackName = "Converted Pack";
const fallbackVersionId = "1.0.0";
const defaultModrinthFileEnvironment = {
  client: "required",
  server: "required",
} satisfies ModrinthIndexFileEnvironment;

export function createModrinthIndex({
  curseForgeManifest,
  matchedModrinthFiles,
}: CreateModrinthIndexInput): ModrinthIndex {
  const loaderDependency = parseLoaderDependency(curseForgeManifest.primaryModLoader.id);
  const modrinthIndexFiles = parseMatchedModrinthFiles(matchedModrinthFiles);

  return {
    formatVersion: 1,
    game: "minecraft",
    name: parseStringWithFallback(curseForgeManifest.name, "name", fallbackPackName),
    versionId: parseStringWithFallback(curseForgeManifest.version, "versionId", fallbackVersionId),
    dependencies: {
      minecraft: curseForgeManifest.minecraft.version,
      [loaderDependency.dependencyName]: loaderDependency.version,
    },
    files: modrinthIndexFiles,
  };
}

function parseMatchedModrinthFiles(matchedModrinthFiles: MatchedModrinthFile[]) {
  const files: ModrinthIndexFile[] = [];
  const fileSourceByPath = new Map<string, string>();

  for (const matchedModrinthFile of matchedModrinthFiles) {
    const file = parseMatchedModrinthFile(matchedModrinthFile);
    const currentSource = formatCurseForgeFileSource(matchedModrinthFile);
    const existingSource = fileSourceByPath.get(file.path);

    if (existingSource) {
      throw createIndexValidationError(
        `files path ${file.path}`,
        "unique file path",
        `Duplicate ${file.path} from ${existingSource} and ${currentSource}`,
      );
    }

    fileSourceByPath.set(file.path, currentSource);
    files.push(file);
  }

  return files;
}

function parseMatchedModrinthFile(matchedModrinthFile: MatchedModrinthFile): ModrinthIndexFile {
  const path = validateArchivePath(matchedModrinthFile.path);
  const downloads = parseDownloads(matchedModrinthFile.downloads, path);
  const hashes = parseHashes(matchedModrinthFile.hashes, path);
  const fileSize = parseFileSize(matchedModrinthFile.fileSize, path);

  return {
    path,
    downloads,
    hashes,
    env: defaultModrinthFileEnvironment,
    ...(fileSize === undefined ? {} : { fileSize }),
  };
}

function parseDownloads(downloadsValue: unknown, path: string) {
  if (!Array.isArray(downloadsValue)) {
    throw createIndexValidationError(
      `files path ${path}.downloads`,
      "downloads array",
      downloadsValue,
    );
  }

  const downloads = downloadsValue.map((downloadUrlValue, downloadUrlIndex) => {
    if (typeof downloadUrlValue !== "string" || downloadUrlValue.trim().length === 0) {
      throw createIndexValidationError(
        `files path ${path}.downloads[${downloadUrlIndex}]`,
        "non-blank string",
        downloadUrlValue,
      );
    }

    return parseHttpsDownloadUrl(downloadUrlValue, `files path ${path}.downloads[${downloadUrlIndex}]`);
  });

  if (downloads.length === 0) {
    throw createIndexValidationError(`files path ${path}.downloads`, "non-empty downloads array", downloadsValue);
  }

  return downloads;
}

function parseHashes(hashesValue: unknown, path: string) {
  if (!hashesValue || typeof hashesValue !== "object" || Array.isArray(hashesValue)) {
    throw createIndexValidationError(`files path ${path}.hashes`, "hash object", hashesValue);
  }

  const hashesRecord = hashesValue as Record<string, unknown>;
  const hashes: Record<string, string> = {};

  for (const [hashName, hashValue] of Object.entries(hashesRecord)) {
    if (typeof hashValue !== "string" || hashValue.trim().length === 0) {
      throw createIndexValidationError(
        `files path ${path}.hashes.${hashName}`,
        "non-blank string",
        hashValue,
      );
    }

    hashes[hashName] = hashValue;
  }

  parseRequiredString(hashes.sha1, `files path ${path}.hashes.sha1`);
  parseRequiredString(hashes.sha512, `files path ${path}.hashes.sha512`);

  return hashes;
}

function parseHttpsDownloadUrl(downloadUrlValue: string, fieldPath: string) {
  if (/\s/.test(downloadUrlValue)) {
    throw createIndexValidationError(fieldPath, "valid HTTPS URL without whitespace", downloadUrlValue);
  }

  let downloadUrl: URL;
  try {
    downloadUrl = new URL(downloadUrlValue);
  } catch {
    throw createIndexValidationError(fieldPath, "valid HTTPS URL", downloadUrlValue);
  }

  if (downloadUrl.protocol !== "https:") {
    throw createIndexValidationError(fieldPath, "valid HTTPS URL", downloadUrlValue);
  }

  return downloadUrl.toString();
}

function parseFileSize(fileSizeValue: unknown, path: string) {
  if (fileSizeValue === undefined) {
    return undefined;
  }

  if (
    typeof fileSizeValue !== "number" ||
    !Number.isSafeInteger(fileSizeValue) ||
    fileSizeValue < 0
  ) {
    throw createIndexValidationError(
      `files path ${path}.fileSize`,
      "non-negative safe integer",
      fileSizeValue,
    );
  }

  return fileSizeValue;
}

function parseLoaderDependency(loaderId: string): LoaderDependency {
  for (const loaderDependencyPattern of loaderDependencyPatterns) {
    if (loaderId.startsWith(loaderDependencyPattern.prefix)) {
      const loaderVersion = loaderId.slice(loaderDependencyPattern.prefix.length);
      if (loaderVersion.length === 0) {
        throw createIndexValidationError(
          "primaryModLoader.id",
          `${loaderDependencyPattern.prefix}<version>`,
          loaderId,
        );
      }

      return {
        dependencyName: loaderDependencyPattern.dependencyName,
        version: loaderVersion,
      };
    }
  }

  throw createIndexValidationError(
    "primaryModLoader.id",
    "supported loader id with version",
    loaderId,
  );
}

function parseRequiredString(value: unknown, fieldPath: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createIndexValidationError(fieldPath, "non-blank string", value);
  }

  return value;
}

function parseStringWithFallback(value: unknown, fieldPath: string, fallbackValue: string) {
  if (value === undefined) {
    return fallbackValue;
  }

  if (typeof value !== "string") {
    throw createIndexValidationError(fieldPath, "non-blank string", value);
  }

  return value.trim().length === 0 ? fallbackValue : value;
}

function formatCurseForgeFileSource(matchedModrinthFile: MatchedModrinthFile) {
  return `${matchedModrinthFile.curseForgeProjectId}/${matchedModrinthFile.curseForgeFileId}`;
}

function createIndexValidationError(
  fieldPath: string,
  expectedDescription: string,
  problemValue: unknown,
) {
  return new ConversionError(
    conversionErrorCodes.invalidInput,
    `Invalid ZIP to MRPack input at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
    undefined,
    { expectedDescription, fieldPath },
    { problemValue },
  );
}

function formatProblemValue(problemValue: unknown) {
  if (problemValue === undefined) {
    return "undefined";
  }

  const jsonText = JSON.stringify(problemValue);
  return jsonText === undefined ? String(problemValue) : jsonText;
}
