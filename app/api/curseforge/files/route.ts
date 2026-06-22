import {
  CurseForgeApiResponseError,
  CurseForgeRequestValidationError,
  extractCurseForgeFileIds,
  fetchCurseForgeFilesByIds,
  parseCurseForgeFileMetadataRequest,
} from "@/lib/curseforge-api/files";

export async function POST(request: Request) {
  let requestJson: unknown;

  try {
    requestJson = await request.json();
  } catch (caughtError) {
    return jsonErrorResponse(
      `Invalid CurseForge request body JSON: ${formatErrorReason(caughtError)}.`,
      400,
    );
  }

  let fileReferences;
  try {
    fileReferences = parseCurseForgeFileMetadataRequest(requestJson);
  } catch (caughtError) {
    if (caughtError instanceof CurseForgeRequestValidationError) {
      return jsonErrorResponse(caughtError.message, caughtError.status);
    }

    throw caughtError;
  }

  const curseForgeApiKey = readCurseForgeApiKey();
  if (!curseForgeApiKey) {
    return jsonErrorResponse("Missing server env CURSEFORGE_API_KEY for CurseForge API requests.", 500);
  }

  try {
    const files = await fetchCurseForgeFilesByIds(
      extractCurseForgeFileIds(fileReferences),
      curseForgeApiKey,
    );

    return Response.json({ files });
  } catch (caughtError) {
    if (caughtError instanceof CurseForgeApiResponseError) {
      return jsonErrorResponse(caughtError.message, caughtError.status);
    }

    return jsonErrorResponse(
      `Failed to fetch CurseForge file metadata: ${formatErrorReason(caughtError)}.`,
      502,
    );
  }
}

function readCurseForgeApiKey() {
  const curseForgeApiKey = process.env.CURSEFORGE_API_KEY?.trim();
  return curseForgeApiKey && curseForgeApiKey.length > 0 ? curseForgeApiKey : null;
}

function jsonErrorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

function formatErrorReason(caughtError: unknown) {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return String(caughtError);
}
