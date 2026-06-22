import { ConversionError, conversionErrorCodes, toConversionError } from "./errors";
import { isMrpackFileName } from "./input-validation";

export type FetchLike = (url: string) => Promise<Response>;

export type ModrinthVersionFile = {
  filename: string;
  url: string;
};

type ModrinthProjectVersion = {
  files: ModrinthVersionFile[];
};

export function buildProjectVersionsUrl(project: string) {
  const trimmedProject = project.trim();

  if (trimmedProject.length === 0) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `Invalid Modrinth project: ${project}. Project must not be blank.`,
    );
  }

  return new URL(
    `https://api.modrinth.com/v2/project/${encodeURIComponent(trimmedProject)}/version?include_changelog=false`,
  );
}

export function findFirstMrpackFile(projectVersions: ModrinthProjectVersion[]) {
  for (const projectVersion of projectVersions) {
    for (const versionFile of projectVersion.files) {
      if (isMrpackFileName(versionFile.filename)) {
        return versionFile;
      }
    }
  }

  return null;
}

export async function fetchProjectVersions(project: string, fetchLike: FetchLike = fetch) {
  const projectVersionsUrl = buildProjectVersionsUrl(project);
  let response: Response;

  try {
    response = await fetchLike(projectVersionsUrl.href);
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.modrinthApiError,
      `Failed to fetch Modrinth versions for project ${project}: ${formatErrorReason(caughtError)}`,
      caughtError,
    );
  }

  if (!response.ok) {
    throw new ConversionError(
      conversionErrorCodes.modrinthApiError,
      `Failed to fetch Modrinth versions for project ${project}: ${response.status} ${response.statusText}`,
    );
  }

  let responseJson: unknown;
  try {
    responseJson = await response.json();
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.modrinthApiError,
      `Failed to read Modrinth versions JSON for project ${project}: ${formatErrorReason(caughtError)}`,
      caughtError,
    );
  }
  if (!Array.isArray(responseJson)) {
    throw new ConversionError(
      conversionErrorCodes.modrinthApiError,
      `Invalid Modrinth versions response for project ${project} at root: ${formatProblemValue(responseJson)}. Expected an array.`,
      undefined,
      { expectedDescription: "versions array", fieldPath: "root", project },
      { problemValue: responseJson },
    );
  }

  return parseProjectVersionsResponse(project, responseJson);
}

function formatErrorReason(caughtError: unknown) {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return String(caughtError);
}

function parseProjectVersionsResponse(project: string, responseJson: unknown[]) {
  return responseJson.map((projectVersionValue, versionIndex) =>
    parseProjectVersion(project, projectVersionValue, `versions[${versionIndex}]`),
  );
}

function parseProjectVersion(
  project: string,
  projectVersionValue: unknown,
  fieldPath: string,
): ModrinthProjectVersion {
  if (
    !projectVersionValue ||
    typeof projectVersionValue !== "object" ||
    Array.isArray(projectVersionValue)
  ) {
    throw createModrinthApiValidationError(project, fieldPath, "version object", projectVersionValue);
  }

  const projectVersionRecord = projectVersionValue as Record<string, unknown>;
  const filesFieldPath = `${fieldPath}.files`;
  if (!Array.isArray(projectVersionRecord.files)) {
    throw createModrinthApiValidationError(
      project,
      filesFieldPath,
      "files array",
      projectVersionRecord.files,
    );
  }

  return {
    files: projectVersionRecord.files.map((versionFileValue, fileIndex) =>
      parseVersionFile(project, versionFileValue, `${filesFieldPath}[${fileIndex}]`),
    ),
  };
}

function parseVersionFile(
  project: string,
  versionFileValue: unknown,
  fieldPath: string,
): ModrinthVersionFile {
  if (!versionFileValue || typeof versionFileValue !== "object" || Array.isArray(versionFileValue)) {
    throw createModrinthApiValidationError(project, fieldPath, "file object", versionFileValue);
  }

  const versionFileRecord = versionFileValue as Record<string, unknown>;
  if (typeof versionFileRecord.filename !== "string") {
    throw createModrinthApiValidationError(
      project,
      `${fieldPath}.filename`,
      "string",
      versionFileRecord.filename,
    );
  }

  if (typeof versionFileRecord.url !== "string") {
    throw createModrinthApiValidationError(
      project,
      `${fieldPath}.url`,
      "string",
      versionFileRecord.url,
    );
  }

  return {
    filename: versionFileRecord.filename,
    url: versionFileRecord.url,
  };
}

function createModrinthApiValidationError(
  project: string,
  fieldPath: string,
  expectedDescription: string,
  problemValue: unknown,
) {
  return new ConversionError(
    conversionErrorCodes.modrinthApiError,
    `Invalid Modrinth versions response for project ${project} at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
    undefined,
    { expectedDescription, fieldPath, project },
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
