import { parseCurseForgeFileReference } from "@/lib/curseforge-api/request-validation";
import { fetchCurseForgeFilesByIds } from "@/lib/curseforge-api/server-files";
import {
  CurseForgeApiResponseError,
  CurseForgeRequestValidationError,
  type CurseForgeFileMetadata,
  type CurseForgeFileReference,
} from "@/lib/curseforge-api/types";

const allowedCurseForgeDownloadHost = "edge.forgecdn.net";

export async function POST(request: Request) {
  let requestJson: unknown;

  try {
    requestJson = await request.json();
  } catch (caughtError) {
    return jsonErrorResponse(
      `Invalid CurseForge download request body JSON: ${formatErrorReason(caughtError)}.`,
      400,
    );
  }

  let fileReference: CurseForgeFileReference;
  try {
    fileReference = parseCurseForgeFileReference(requestJson, "fileReference");
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
		const curseForgeFile = await resolveCurseForgeFileMetadata(fileReference, curseForgeApiKey);
		const downloadUrl = parseDownloadUrl(curseForgeFile, fileReference);
		const curseForgeResponse = await fetch(downloadUrl, {
      headers: {
        "x-api-key": curseForgeApiKey,
      },
    });

		if (!curseForgeResponse.ok) {
			return jsonErrorResponse(
				`CurseForge file download returned ${curseForgeResponse.status} ${curseForgeResponse.statusText} for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}.`,
				502,
			);
		}

		if (!curseForgeResponse.body) {
			throw new CurseForgeApiResponseError(
				`CurseForge CDN returned body null for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}, downloadUrl ${downloadUrl}.`,
			);
		}

		return new Response(curseForgeResponse.body, {
			status: 200,
			headers: {
				"Content-Type": curseForgeResponse.headers.get("Content-Type") ?? "application/octet-stream",
				"X-CurseForge-File-Name": curseForgeFile.fileName,
      },
    });
  } catch (caughtError) {
    if (caughtError instanceof CurseForgeApiResponseError) {
      return jsonErrorResponse(caughtError.message, caughtError.status);
    }

    return jsonErrorResponse(
      `Failed to download CurseForge file projectId ${fileReference.projectId}, fileId ${fileReference.fileId}: ${formatErrorReason(caughtError)}.`,
      502,
    );
  }
}

async function resolveCurseForgeFileMetadata(
  fileReference: CurseForgeFileReference,
  curseForgeApiKey: string,
) {
  const curseForgeFiles = await fetchCurseForgeFilesByIds(
    [fileReference.fileId],
    curseForgeApiKey,
  );
  const curseForgeFile = curseForgeFiles.find((file) => file.fileId === fileReference.fileId);

  if (!curseForgeFile) {
    throw new CurseForgeApiResponseError(
      `CurseForge files API did not return fileId ${fileReference.fileId}.`,
    );
  }

	if (curseForgeFile.modId !== fileReference.projectId) {
		throw new CurseForgeApiResponseError(
			`CurseForge file projectId mismatch for fileId ${fileReference.fileId}: expected projectId ${fileReference.projectId}, got ${curseForgeFile.modId}.`,
		);
	}

	if (!curseForgeFile.isAvailable) {
		throw new CurseForgeApiResponseError(
			`CurseForge file isAvailable false for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}.`,
		);
	}

	return curseForgeFile;
}

function parseDownloadUrl(
  curseForgeFile: CurseForgeFileMetadata,
  fileReference: CurseForgeFileReference,
) {
	if (!curseForgeFile.downloadUrl) {
		throw new CurseForgeApiResponseError(
			`CurseForge file projectId ${fileReference.projectId}, fileId ${fileReference.fileId} has no downloadUrl.`,
		);
	}

	let downloadUrl: URL;
	try {
		downloadUrl = new URL(curseForgeFile.downloadUrl);
	} catch (caughtError) {
		throw new CurseForgeApiResponseError(
			`CurseForge file projectId ${fileReference.projectId}, fileId ${fileReference.fileId} has invalid downloadUrl ${curseForgeFile.downloadUrl}: ${formatErrorReason(caughtError)}.`,
		);
	}

	if (downloadUrl.protocol !== "https:") {
		throw new CurseForgeApiResponseError(
			`Expected https CurseForge file download URL for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}, got ${curseForgeFile.downloadUrl}.`,
		);
	}

	if (downloadUrl.hostname !== allowedCurseForgeDownloadHost) {
		throw new CurseForgeApiResponseError(
			`CurseForge file download host ${downloadUrl.hostname} is not allowed for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}. Expected ${allowedCurseForgeDownloadHost}.`,
		);
	}

	return downloadUrl.toString();
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
