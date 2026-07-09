import { parseCurseForgeFileReference } from "@/lib/curseforge-api/request-validation";
import { fetchCurseForgeFilesByIds } from "@/lib/curseforge-api/server-files";
import {
  CurseForgeApiResponseError,
  CurseForgeRequestValidationError,
  formatErrorReason,
  type CurseForgeFileMetadata,
  type CurseForgeFileReference,
} from "@/lib/curseforge-api/types";
import {
  createCurseForgeApiErrorResponse,
  createInvalidCurseForgeRequestResponse,
  createMissingCurseForgeApiKeyResponse,
  createUnexpectedCurseForgeRouteErrorResponse,
  readJsonRequestBody,
} from "@/lib/curseforge-api/route-errors";

const allowedCurseForgeDownloadHost = "edge.forgecdn.net";

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

  let fileReference: CurseForgeFileReference;
  try {
    fileReference = parseCurseForgeFileReference(requestJson, "fileReference");
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
		const curseForgeFile = await resolveCurseForgeFileMetadata(fileReference, curseForgeApiKey);
		const downloadUrl = parseDownloadUrl(curseForgeFile, fileReference);
		const curseForgeResponse = await fetch(downloadUrl, {
      headers: {
        "x-api-key": curseForgeApiKey,
      },
    });

		if (!curseForgeResponse.ok) {
			throw new CurseForgeApiResponseError(
				`CurseForge file download returned ${curseForgeResponse.status} ${curseForgeResponse.statusText} for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}.`,
				{
					reason: "curseforge_cdn_http_error",
					details: {
						fileId: fileReference.fileId,
						projectId: fileReference.projectId,
						status: curseForgeResponse.status,
						statusText: curseForgeResponse.statusText,
					},
				},
			);
		}

		if (!curseForgeResponse.body) {
			throw new CurseForgeApiResponseError(
				`CurseForge CDN returned body null for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}, downloadUrl ${downloadUrl}.`,
				{
					reason: "download_body_missing",
					details: {
						downloadUrl,
						fileId: fileReference.fileId,
						projectId: fileReference.projectId,
					},
				},
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
      return createCurseForgeApiErrorResponse(caughtError);
    }

    return createUnexpectedCurseForgeRouteErrorResponse(
      "curseforge_download_failed",
      502,
      {
        fileId: fileReference.fileId,
        projectId: fileReference.projectId,
      },
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
      {
        reason: "file_metadata_missing",
        details: {
          fileId: fileReference.fileId,
          projectId: fileReference.projectId,
        },
      },
    );
  }

	if (curseForgeFile.modId !== fileReference.projectId) {
		throw new CurseForgeApiResponseError(
			`CurseForge file projectId mismatch for fileId ${fileReference.fileId}: expected projectId ${fileReference.projectId}, got ${curseForgeFile.modId}.`,
			{
				reason: "project_id_mismatch",
				details: {
					actualProjectId: curseForgeFile.modId,
					expectedProjectId: fileReference.projectId,
					fileId: fileReference.fileId,
				},
			},
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
			{
				reason: "download_url_missing",
				details: {
					fileId: fileReference.fileId,
					projectId: fileReference.projectId,
				},
			},
		);
	}

	let downloadUrl: URL;
	try {
		downloadUrl = new URL(curseForgeFile.downloadUrl);
	} catch (caughtError) {
		throw new CurseForgeApiResponseError(
			`CurseForge file projectId ${fileReference.projectId}, fileId ${fileReference.fileId} has invalid downloadUrl ${curseForgeFile.downloadUrl}: ${formatErrorReason(caughtError)}.`,
				{
					reason: "download_url_invalid",
					details: {
						downloadUrl: curseForgeFile.downloadUrl,
						fileId: fileReference.fileId,
						projectId: fileReference.projectId,
				},
			},
		);
	}

	if (downloadUrl.protocol !== "https:") {
		throw new CurseForgeApiResponseError(
			`Expected https CurseForge file download URL for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}, got ${curseForgeFile.downloadUrl}.`,
			{
				reason: "download_url_not_https",
				details: {
					actualProtocol: downloadUrl.protocol,
					downloadUrl: curseForgeFile.downloadUrl,
					fileId: fileReference.fileId,
					projectId: fileReference.projectId,
				},
			},
		);
	}

	if (downloadUrl.hostname !== allowedCurseForgeDownloadHost) {
		throw new CurseForgeApiResponseError(
			`CurseForge file download host ${downloadUrl.hostname} is not allowed for projectId ${fileReference.projectId}, fileId ${fileReference.fileId}. Expected ${allowedCurseForgeDownloadHost}.`,
			{
				reason: "download_url_not_allowed",
				details: {
					actualHost: downloadUrl.hostname,
					expectedHost: allowedCurseForgeDownloadHost,
					fileId: fileReference.fileId,
					projectId: fileReference.projectId,
				},
			},
		);
	}

	return downloadUrl.toString();
}

function readCurseForgeApiKey() {
  const curseForgeApiKey = process.env.CURSEFORGE_API_KEY?.trim();
  return curseForgeApiKey && curseForgeApiKey.length > 0 ? curseForgeApiKey : null;
}
