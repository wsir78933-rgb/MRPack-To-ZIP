export type CurseForgeFetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type CurseForgeFileReference = {
  projectId: number;
  fileId: number;
};

export type CurseForgeFileHash = {
  value: string;
  algo: number;
};

export type CurseForgeFileMetadata = {
  modId: number;
  fileId: number;
  fileName: string;
  fileLength: number;
  downloadUrl: string | null;
  hashes: CurseForgeFileHash[];
  isAvailable: boolean;
};

export class CurseForgeRequestValidationError extends Error {
  readonly status = 400;
  readonly fieldPath: string;
  readonly problemValue: unknown;

  constructor(fieldPath: string, problemValue: unknown, expectedDescription: string) {
    super(
      `Invalid CurseForge request body at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
    );
    this.name = "CurseForgeRequestValidationError";
    this.fieldPath = fieldPath;
    this.problemValue = problemValue;
  }
}

export class CurseForgeApiResponseError extends Error {
  readonly status = 502;
  readonly fieldPath: string | undefined;
  readonly problemValue: unknown;

  constructor(message: string, fieldPath?: string, problemValue?: unknown) {
    super(message);
    this.name = "CurseForgeApiResponseError";
    this.fieldPath = fieldPath;
    this.problemValue = problemValue;
  }
}

export function formatProblemValue(problemValue: unknown) {
  if (problemValue === undefined) {
    return "undefined";
  }

  const jsonText = JSON.stringify(problemValue);
  return jsonText === undefined ? String(problemValue) : jsonText;
}

export function formatErrorReason(caughtError: unknown) {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return String(caughtError);
}
