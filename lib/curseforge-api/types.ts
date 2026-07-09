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

export type CurseForgeApiErrorDetails = Record<string, unknown>;

export class CurseForgeRequestValidationError extends Error {
  readonly status = 400;
  readonly fieldPath: string;
  readonly problemValue: unknown;
  readonly expectedDescription: string;

  constructor(
    fieldPath: string,
    problemValue: unknown,
    expectedDescription: string,
    options?: ErrorOptions,
  ) {
    super(
      `Invalid CurseForge request body at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
      options,
    );
    this.name = "CurseForgeRequestValidationError";
    this.fieldPath = fieldPath;
    this.problemValue = problemValue;
    this.expectedDescription = expectedDescription;
  }
}

type CurseForgeApiResponseErrorOptions = {
  reason?: string;
  details?: CurseForgeApiErrorDetails;
  status?: number;
};

export class CurseForgeApiResponseError extends Error {
  readonly status: number;
  readonly reason: string;
  readonly details: CurseForgeApiErrorDetails;

  constructor(message: string, options: CurseForgeApiResponseErrorOptions = {}) {
    super(message);
    this.name = "CurseForgeApiResponseError";
    this.status = options.status ?? 502;
    this.reason = options.reason ?? "curseforge_api_response_error";
    this.details = options.details ?? {};
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
