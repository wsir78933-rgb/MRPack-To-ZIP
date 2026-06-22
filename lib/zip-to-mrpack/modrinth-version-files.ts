import { ConversionError, conversionErrorCodes } from "../mrpack/errors";

type ModrinthVersionFilesFetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type ModrinthMatchedVersionFile = {
  filename: string;
  url: string;
  size: number;
  hashes: Record<string, string>;
};

export type ModrinthMatchedVersion = {
  files: ModrinthMatchedVersionFile[];
};

export type ModrinthVersionsByHash = Record<string, ModrinthMatchedVersion>;

const modrinthVersionFilesEndpoint = "https://api.modrinth.com/v2/version_files";

export async function fetchModrinthVersionsBySha1(
  sha1Hashes: string[],
  fetchLike: ModrinthVersionFilesFetchLike = fetch,
): Promise<ModrinthVersionsByHash> {
  const validatedSha1Hashes = sha1Hashes.map((sha1Hash, sha1HashIndex) =>
    parseSha1Hash(sha1Hash, `hashes[${sha1HashIndex}]`),
  );

  const response = await fetchLike(modrinthVersionFilesEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hashes: validatedSha1Hashes,
      algorithm: "sha1",
    }),
  });

  if (!response.ok) {
    throw new ConversionError(
      conversionErrorCodes.modrinthApiError,
      `Modrinth version_files API returned ${response.status} ${response.statusText}.`,
    );
  }

  let responseJson: unknown;
  try {
    responseJson = await response.json();
  } catch (caughtError) {
    throw new ConversionError(
      conversionErrorCodes.modrinthApiError,
      `Modrinth version_files API returned invalid JSON: ${formatErrorReason(caughtError)}.`,
      caughtError,
    );
  }

  return parseModrinthVersionsByHash(responseJson);
}

function parseModrinthVersionsByHash(responseJson: unknown): ModrinthVersionsByHash {
  if (!responseJson || typeof responseJson !== "object" || Array.isArray(responseJson)) {
    throw createModrinthVersionFilesError("root", "object map", responseJson);
  }

  const versionsByHash: ModrinthVersionsByHash = {};

  for (const [sha1Hash, versionValue] of Object.entries(responseJson)) {
    versionsByHash[sha1Hash] = parseModrinthMatchedVersion(
      versionValue,
      `files.${sha1Hash}`,
    );
  }

  return versionsByHash;
}

function parseModrinthMatchedVersion(
  versionValue: unknown,
  fieldPath: string,
): ModrinthMatchedVersion {
  if (!versionValue || typeof versionValue !== "object" || Array.isArray(versionValue)) {
    throw createModrinthVersionFilesError(fieldPath, "version object", versionValue);
  }

  const versionRecord = versionValue as Record<string, unknown>;
  if (!Array.isArray(versionRecord.files)) {
    throw createModrinthVersionFilesError(`${fieldPath}.files`, "files array", versionRecord.files);
  }

  return {
    files: versionRecord.files.map((fileValue, fileIndex) =>
      parseModrinthMatchedVersionFile(fileValue, `${fieldPath}.files[${fileIndex}]`),
    ),
  };
}

function parseModrinthMatchedVersionFile(
  fileValue: unknown,
  fieldPath: string,
): ModrinthMatchedVersionFile {
  if (!fileValue || typeof fileValue !== "object" || Array.isArray(fileValue)) {
    throw createModrinthVersionFilesError(fieldPath, "file object", fileValue);
  }

  const fileRecord = fileValue as Record<string, unknown>;

  return {
    filename: parseString(fileRecord.filename, `${fieldPath}.filename`),
    url: parseString(fileRecord.url, `${fieldPath}.url`),
    size: parseNonNegativeSafeInteger(fileRecord.size, `${fieldPath}.size`),
    hashes: parseHashes(fileRecord.hashes, `${fieldPath}.hashes`),
  };
}

function parseHashes(hashesValue: unknown, fieldPath: string) {
  if (!hashesValue || typeof hashesValue !== "object" || Array.isArray(hashesValue)) {
    throw createModrinthVersionFilesError(fieldPath, "hash object", hashesValue);
  }

  const hashesRecord = hashesValue as Record<string, unknown>;
  const hashes: Record<string, string> = {};

  for (const [hashName, hashValue] of Object.entries(hashesRecord)) {
    hashes[hashName] = parseString(hashValue, `${fieldPath}.${hashName}`);
  }

  return hashes;
}

function parseSha1Hash(sha1Hash: unknown, fieldPath: string) {
  if (typeof sha1Hash !== "string" || sha1Hash.trim().length === 0) {
    throw createModrinthVersionFilesError(fieldPath, "non-blank sha1 string", sha1Hash);
  }

  return sha1Hash;
}

function parseString(value: unknown, fieldPath: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createModrinthVersionFilesError(fieldPath, "non-blank string", value);
  }

  return value;
}

function parseNonNegativeSafeInteger(value: unknown, fieldPath: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw createModrinthVersionFilesError(fieldPath, "non-negative safe integer", value);
  }

  return value;
}

function createModrinthVersionFilesError(
  fieldPath: string,
  expectedDescription: string,
  problemValue: unknown,
) {
  return new ConversionError(
    conversionErrorCodes.modrinthApiError,
    `Invalid Modrinth version_files response at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
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

function formatErrorReason(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : String(caughtError);
}
