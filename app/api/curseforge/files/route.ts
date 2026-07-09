import {
  CurseForgeApiResponseError,
  CurseForgeRequestValidationError,
  extractCurseForgeFileIds,
  fetchCurseForgeFilesByIds,
  parseCurseForgeFileMetadataRequest,
} from "@/lib/curseforge-api/files";
import {
  createCurseForgeApiErrorResponse,
  createInvalidCurseForgeRequestResponse,
  createMissingCurseForgeApiKeyResponse,
  createUnexpectedCurseForgeRouteErrorResponse,
  readJsonRequestBody,
} from "@/lib/curseforge-api/route-errors";

export async function POST(request: Request) {
  let requestJson: unknown;

  try {
    requestJson = await readJsonRequestBody(request);
  } catch (caughtError) {
    if (caughtError instanceof CurseForgeRequestValidationError) {
      return createInvalidCurseForgeRequestResponse(caughtError);
    }

    throw caughtError;
  }

  let fileReferences;
  try {
    fileReferences = parseCurseForgeFileMetadataRequest(requestJson);
  } catch (caughtError) {
    if (caughtError instanceof CurseForgeRequestValidationError) {
      return createInvalidCurseForgeRequestResponse(caughtError);
    }

    throw caughtError;
  }

  const curseForgeApiKey = readCurseForgeApiKey();
  if (!curseForgeApiKey) {
    return createMissingCurseForgeApiKeyResponse();
  }

  try {
    const files = await fetchCurseForgeFilesByIds(
      extractCurseForgeFileIds(fileReferences),
      curseForgeApiKey,
    );

    return Response.json({ files });
  } catch (caughtError) {
    if (caughtError instanceof CurseForgeApiResponseError) {
      return createCurseForgeApiErrorResponse(caughtError);
    }

    return createUnexpectedCurseForgeRouteErrorResponse(
      "curseforge_files_fetch_failed",
    );
  }
}

function readCurseForgeApiKey() {
  const curseForgeApiKey = process.env.CURSEFORGE_API_KEY?.trim();
  return curseForgeApiKey && curseForgeApiKey.length > 0 ? curseForgeApiKey : null;
}
