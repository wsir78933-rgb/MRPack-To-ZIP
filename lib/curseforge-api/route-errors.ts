import { ConversionError, conversionErrorCodes } from "@/lib/mrpack/errors";

import {
  CurseForgeApiResponseError,
  CurseForgeRequestValidationError,
  formatErrorReason,
  type CurseForgeApiErrorDetails,
} from "./types";

const curseForgeRouteErrorCode = "curseforge_api_error";

type CurseForgeRouteErrorPayload = {
  errorCode: typeof curseForgeRouteErrorCode;
  reason: string;
  details: CurseForgeApiErrorDetails;
};

export async function readJsonRequestBody(request: Request): Promise<unknown> {
  const requestBodyText = await request.text();

  try {
    return JSON.parse(requestBodyText);
  } catch (caughtError) {
    throw new CurseForgeRequestValidationError(
      "body",
      requestBodyText,
      "valid JSON request body",
      { cause: caughtError },
    );
  }
}

export function createMissingCurseForgeApiKeyResponse() {
  return createCurseForgeRouteErrorResponse(
    "missing_api_key",
    { service: "curseforge" },
    500,
  );
}

export function createInvalidCurseForgeRequestResponse(
  caughtError: CurseForgeRequestValidationError,
) {
  return createCurseForgeRouteErrorResponse(
    "invalid_request",
    {
      expectedDescription: caughtError.expectedDescription,
      fieldPath: caughtError.fieldPath,
      problemValue: caughtError.problemValue,
    },
    caughtError.status,
  );
}

export function createCurseForgeApiErrorResponse(
  caughtError: CurseForgeApiResponseError,
) {
  return createCurseForgeRouteErrorResponse(
    caughtError.reason,
    caughtError.details,
    caughtError.status,
  );
}

export function createUnexpectedCurseForgeRouteErrorResponse(
  reason: string,
  status = 502,
  extraDetails: CurseForgeApiErrorDetails = {},
) {
  return createCurseForgeRouteErrorResponse(reason, extraDetails, status);
}

export async function throwCurseForgeRouteConversionError(
  route: string,
  response: Response,
): Promise<never> {
  let routeErrorJson: unknown;

  try {
    routeErrorJson = await response.clone().json();
  } catch (caughtError) {
    throw createCurseForgeRouteConversionError(
      route,
      response,
      "unparseable_route_error",
      {
        parseError: formatErrorReason(caughtError),
        status: response.status,
        statusText: response.statusText,
      },
      caughtError,
    );
  }

  const routeErrorPayload = parseCurseForgeRouteErrorPayload(routeErrorJson);

  throw createCurseForgeRouteConversionError(
    route,
    response,
    routeErrorPayload.reason,
    routeErrorPayload.details,
  );
}

function createCurseForgeRouteErrorResponse(
  reason: string,
  details: CurseForgeApiErrorDetails,
  status: number,
) {
  return Response.json(createCurseForgeRouteErrorPayload(reason, details), { status });
}

function createCurseForgeRouteErrorPayload(
  reason: string,
  details: CurseForgeApiErrorDetails,
): CurseForgeRouteErrorPayload {
  return {
    errorCode: curseForgeRouteErrorCode,
    reason,
    details: normalizeRouteErrorDetails(details),
  };
}

function parseCurseForgeRouteErrorPayload(
  routeErrorJson: unknown,
): Pick<CurseForgeRouteErrorPayload, "reason" | "details"> {
  if (
    routeErrorJson &&
    typeof routeErrorJson === "object" &&
    !Array.isArray(routeErrorJson)
  ) {
    const routeErrorRecord = routeErrorJson as Record<string, unknown>;
    if (
      routeErrorRecord.errorCode === curseForgeRouteErrorCode &&
      typeof routeErrorRecord.reason === "string" &&
      isRouteErrorDetails(routeErrorRecord.details)
    ) {
      return {
        reason: routeErrorRecord.reason,
        details: routeErrorRecord.details,
      };
    }

    if (typeof routeErrorRecord.error === "string") {
      return {
        reason: "legacy_route_error",
        details: { error: routeErrorRecord.error },
      };
    }
  }

  return {
    reason: "legacy_route_error",
    details: { response: normalizeRouteErrorDetailValue(routeErrorJson) },
  };
}

function createCurseForgeRouteConversionError(
  route: string,
  response: Response,
  routeReason: string,
  details: CurseForgeApiErrorDetails,
  cause?: unknown,
) {
  return new ConversionError(
    conversionErrorCodes.downloadFailed,
    `CurseForge route ${route} failed with ${response.status} ${response.statusText}: ${routeReason}.`,
    cause,
    {
      reason: "curseforge_route_error",
      route,
      routeReason,
      status: response.status,
    },
    details,
  );
}

function isRouteErrorDetails(value: unknown): value is CurseForgeApiErrorDetails {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRouteErrorDetails(
  details: CurseForgeApiErrorDetails,
): CurseForgeApiErrorDetails {
  const normalizedDetails: CurseForgeApiErrorDetails = {};

  for (const [detailName, detailValue] of Object.entries(details)) {
    normalizedDetails[detailName] = normalizeRouteErrorDetailValue(detailValue);
  }

  return normalizedDetails;
}

function normalizeRouteErrorDetailValue(value: unknown): unknown {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return String(value);
  }

  if (
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((itemValue) => normalizeRouteErrorDetailValue(itemValue));
  }

  if (value && typeof value === "object") {
    const normalizedRecord: Record<string, unknown> = {};

    for (const [propertyName, propertyValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      normalizedRecord[propertyName] = normalizeRouteErrorDetailValue(propertyValue);
    }

    return normalizedRecord;
  }

  return value;
}
