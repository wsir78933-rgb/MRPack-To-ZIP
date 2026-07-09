import {
  CurseForgeApiResponseError,
  formatErrorReason,
  formatProblemValue,
  type CurseForgeFetchLike,
  type CurseForgeFileHash,
  type CurseForgeFileMetadata,
} from "./types";

const curseForgeFilesEndpoint = "https://api.curseforge.com/v1/mods/files";
const maxCurseForgeInt32Id = 2_147_483_647;

export async function fetchCurseForgeFilesByIds(
  fileIds: number[],
  curseForgeApiKey: string,
  fetchLike: CurseForgeFetchLike = fetch,
): Promise<CurseForgeFileMetadata[]> {
  const validatedFileIds = fileIds.map((fileId, fileIdIndex) =>
    parseApiPositiveInt32(fileId, `fileIds[${fileIdIndex}]`),
  );

  const response = await fetchLike(curseForgeFilesEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": curseForgeApiKey,
    },
    body: JSON.stringify({ fileIds: validatedFileIds }),
  });

  if (!response.ok) {
    throw new CurseForgeApiResponseError(
      `CurseForge files API returned ${response.status} ${response.statusText}.`,
      {
        reason: "curseforge_files_api_http_error",
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      },
    );
  }

  let responseJson: unknown;
  try {
    responseJson = await response.json();
  } catch (caughtError) {
    throw new CurseForgeApiResponseError(
      `CurseForge files API returned invalid JSON: ${formatErrorReason(caughtError)}.`,
      {
        reason: "curseforge_files_api_invalid_json",
        details: {
          parseError: formatErrorReason(caughtError),
        },
      },
    );
  }

  return parseCurseForgeFilesResponse(responseJson);
}

function parseCurseForgeFilesResponse(responseJson: unknown): CurseForgeFileMetadata[] {
  if (!responseJson || typeof responseJson !== "object" || Array.isArray(responseJson)) {
    throw createCurseForgeApiValidationError("root", responseJson, "an object");
  }

  const responseRecord = responseJson as Record<string, unknown>;
  if (!Array.isArray(responseRecord.data)) {
    throw createCurseForgeApiValidationError("data", responseRecord.data, "an array of files");
  }

  return responseRecord.data.map((fileValue, fileIndex) =>
    parseCurseForgeFileMetadata(fileValue, `data[${fileIndex}]`),
  );
}

function parseCurseForgeFileMetadata(
  fileValue: unknown,
  fieldPath: string,
): CurseForgeFileMetadata {
  if (!fileValue || typeof fileValue !== "object" || Array.isArray(fileValue)) {
    throw createCurseForgeApiValidationError(fieldPath, fileValue, "a file object");
  }

  const fileRecord = fileValue as Record<string, unknown>;

  return {
    modId: parseApiPositiveInt32(fileRecord.modId, `${fieldPath}.modId`),
    fileId: parseApiPositiveInt32(fileRecord.id, `${fieldPath}.id`),
    fileName: parseApiString(fileRecord.fileName, `${fieldPath}.fileName`),
    fileLength: parseApiNonNegativeNumber(fileRecord.fileLength, `${fieldPath}.fileLength`),
    downloadUrl: parseApiNullableString(fileRecord.downloadUrl, `${fieldPath}.downloadUrl`),
    hashes: parseApiHashes(fileRecord.hashes, `${fieldPath}.hashes`),
    isAvailable: parseApiBoolean(fileRecord.isAvailable, `${fieldPath}.isAvailable`),
  };
}

function parseApiHashes(hashesValue: unknown, fieldPath: string): CurseForgeFileHash[] {
  if (!Array.isArray(hashesValue)) {
    throw createCurseForgeApiValidationError(fieldPath, hashesValue, "an array of hashes");
  }

  return hashesValue.map((hashValue, hashIndex) =>
    parseApiHash(hashValue, `${fieldPath}[${hashIndex}]`),
  );
}

function parseApiHash(hashValue: unknown, fieldPath: string): CurseForgeFileHash {
  if (!hashValue || typeof hashValue !== "object" || Array.isArray(hashValue)) {
    throw createCurseForgeApiValidationError(fieldPath, hashValue, "a hash object");
  }

  const hashRecord = hashValue as Record<string, unknown>;

  return {
    value: parseApiString(hashRecord.value, `${fieldPath}.value`),
    algo: parseApiPositiveInt32(hashRecord.algo, `${fieldPath}.algo`),
  };
}

function parseApiPositiveInt32(value: unknown, fieldPath: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > maxCurseForgeInt32Id
  ) {
    throw createCurseForgeApiValidationError(
      fieldPath,
      value,
      `a positive integer no larger than ${maxCurseForgeInt32Id}`,
    );
  }

  return value;
}

function parseApiNonNegativeNumber(value: unknown, fieldPath: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw createCurseForgeApiValidationError(fieldPath, value, "a non-negative number");
  }

  return value;
}

function parseApiString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string") {
    throw createCurseForgeApiValidationError(fieldPath, value, "a string");
  }

  return value;
}

function parseApiNullableString(value: unknown, fieldPath: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw createCurseForgeApiValidationError(fieldPath, value, "a string or null");
  }

  return value;
}

function parseApiBoolean(value: unknown, fieldPath: string): boolean {
  if (typeof value !== "boolean") {
    throw createCurseForgeApiValidationError(fieldPath, value, "a boolean");
  }

  return value;
}

function createCurseForgeApiValidationError(
  fieldPath: string,
  problemValue: unknown,
  expectedDescription: string,
) {
  return new CurseForgeApiResponseError(
    `Invalid CurseForge files API response at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
    {
      reason: "curseforge_files_api_invalid_response",
      details: {
        expectedDescription,
        fieldPath,
        problemValue,
      },
    },
  );
}
