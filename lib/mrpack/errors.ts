export const conversionErrorCodes = {
  invalidInput: "invalid_input",
  invalidPath: "invalid_path",
  invalidUrl: "invalid_url",
  invalidMrpack: "invalid_mrpack",
  modrinthApiError: "modrinth_api_error",
  downloadFailed: "download_failed",
  zipBuildFailed: "zip_build_failed",
} as const;

export type ConversionErrorCode =
  (typeof conversionErrorCodes)[keyof typeof conversionErrorCodes];

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;
  readonly cause: unknown;
  readonly context: Record<string, unknown> | undefined;
  readonly details: unknown;

  constructor(
    code: ConversionErrorCode,
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
    details?: unknown,
  ) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
    this.cause = cause;
    this.context = context;
    this.details = details;
  }
}

export function toConversionError(
  errorCode: ConversionErrorCode,
  message: string,
  caughtError: unknown,
  context?: Record<string, unknown>,
  details?: unknown,
) {
  if (caughtError instanceof ConversionError) {
    return caughtError;
  }

  return new ConversionError(errorCode, message, caughtError, context, details);
}
