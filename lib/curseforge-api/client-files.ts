import { parseCurseForgeFileReferences } from "./request-validation";
import { throwCurseForgeRouteConversionError } from "./route-errors";
import { ConversionError, conversionErrorCodes } from "../mrpack/errors";
import {
  formatProblemValue,
  type CurseForgeFetchLike,
  type CurseForgeFileHash,
  type CurseForgeFileMetadata,
  type CurseForgeFileReference,
} from "./types";

const localCurseForgeFilesRoute = "/api/curseforge/files";
const maxCurseForgeInt32Id = 2_147_483_647;

export async function fetchCurseForgeFileMetadata(
  fileReferences: CurseForgeFileReference[],
  fetchLike: CurseForgeFetchLike = fetch,
): Promise<CurseForgeFileMetadata[]> {
  const validatedFileReferences = parseCurseForgeFileReferences(
    fileReferences,
    "fileReferences",
  );

  const response = await fetchLike(localCurseForgeFilesRoute, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileReferences: validatedFileReferences }),
  });

  if (!response.ok) {
    await throwCurseForgeRouteConversionError(localCurseForgeFilesRoute, response);
  }

  let routeResponseJson: unknown;
  try {
    routeResponseJson = await response.json();
  } catch (caughtError) {
    throw createInvalidLocalFilesRouteResponseError(
      "root",
      "unparseable_json",
      "valid JSON response",
      caughtError,
    );
  }

  return parseLocalCurseForgeFilesRouteResponse(routeResponseJson);
}

function parseLocalCurseForgeFilesRouteResponse(
  routeResponseJson: unknown,
): CurseForgeFileMetadata[] {
  if (
    !routeResponseJson ||
    typeof routeResponseJson !== "object" ||
    Array.isArray(routeResponseJson)
  ) {
    throw createInvalidLocalFilesRouteResponseError(
      "root",
      routeResponseJson,
      "an object",
    );
  }

  const routeResponseRecord = routeResponseJson as Record<string, unknown>;
  if (!Array.isArray(routeResponseRecord.files)) {
    throw createInvalidLocalFilesRouteResponseError(
      "files",
      routeResponseRecord.files,
      "an array",
    );
  }

  return routeResponseRecord.files.map((fileValue, fileIndex) =>
    parseLocalCurseForgeFileMetadata(fileValue, `files[${fileIndex}]`),
  );
}

function parseLocalCurseForgeFileMetadata(
  fileValue: unknown,
  fieldPath: string,
): CurseForgeFileMetadata {
  if (!fileValue || typeof fileValue !== "object" || Array.isArray(fileValue)) {
    throw createInvalidLocalFilesRouteResponseError(
      fieldPath,
      fileValue,
      "a file object",
    );
  }

  const fileRecord = fileValue as Record<string, unknown>;

  return {
    modId: parseLocalPositiveInt32(fileRecord.modId, `${fieldPath}.modId`),
    fileId: parseLocalPositiveInt32(fileRecord.fileId, `${fieldPath}.fileId`),
    fileName: parseLocalString(fileRecord.fileName, `${fieldPath}.fileName`),
    fileLength: parseLocalNonNegativeNumber(fileRecord.fileLength, `${fieldPath}.fileLength`),
    downloadUrl: parseLocalNullableString(fileRecord.downloadUrl, `${fieldPath}.downloadUrl`),
    hashes: parseLocalHashes(fileRecord.hashes, `${fieldPath}.hashes`),
    isAvailable: parseLocalBoolean(fileRecord.isAvailable, `${fieldPath}.isAvailable`),
  };
}

function parseLocalHashes(hashesValue: unknown, fieldPath: string): CurseForgeFileHash[] {
  if (!Array.isArray(hashesValue)) {
    throw createInvalidLocalFilesRouteResponseError(
      fieldPath,
      hashesValue,
      "an array of hashes",
    );
  }

  return hashesValue.map((hashValue, hashIndex) =>
    parseLocalHash(hashValue, `${fieldPath}[${hashIndex}]`),
  );
}

function parseLocalHash(hashValue: unknown, fieldPath: string): CurseForgeFileHash {
  if (!hashValue || typeof hashValue !== "object" || Array.isArray(hashValue)) {
    throw createInvalidLocalFilesRouteResponseError(
      fieldPath,
      hashValue,
      "a hash object",
    );
  }

  const hashRecord = hashValue as Record<string, unknown>;

  return {
    value: parseLocalString(hashRecord.value, `${fieldPath}.value`),
    algo: parseLocalPositiveInt32(hashRecord.algo, `${fieldPath}.algo`),
  };
}

function parseLocalPositiveInt32(value: unknown, fieldPath: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > maxCurseForgeInt32Id
  ) {
    throw createInvalidLocalFilesRouteResponseError(
      fieldPath,
      value,
      `a positive integer no larger than ${maxCurseForgeInt32Id}`,
    );
  }

  return value;
}

function parseLocalNonNegativeNumber(value: unknown, fieldPath: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw createInvalidLocalFilesRouteResponseError(
      fieldPath,
      value,
      "a non-negative number",
    );
  }

  return value;
}

function parseLocalString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string") {
    throw createInvalidLocalFilesRouteResponseError(fieldPath, value, "a string");
  }

  return value;
}

function parseLocalNullableString(value: unknown, fieldPath: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw createInvalidLocalFilesRouteResponseError(
      fieldPath,
      value,
      "a string or null",
    );
  }

  return value;
}

function parseLocalBoolean(value: unknown, fieldPath: string): boolean {
  if (typeof value !== "boolean") {
    throw createInvalidLocalFilesRouteResponseError(fieldPath, value, "a boolean");
  }

  return value;
}

function createInvalidLocalFilesRouteResponseError(
  fieldPath: string,
  problemValue: unknown,
  expectedDescription: string,
  cause?: unknown,
) {
  return new ConversionError(
    conversionErrorCodes.downloadFailed,
    `Invalid CurseForge files route response at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
    cause,
    {
      reason: "curseforge_route_error",
      route: localCurseForgeFilesRoute,
      routeReason: "invalid_route_response",
      status: 200,
    },
    {
      expectedDescription,
      fieldPath,
      problemValue,
    },
  );
}
