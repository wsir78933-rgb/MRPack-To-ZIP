import { parseCurseForgeFileReference } from "./request-validation";
import type { CurseForgeFetchLike, CurseForgeFileReference } from "./types";

const localCurseForgeDownloadRoute = "/api/curseforge/download";

export async function downloadCurseForgeFileContent(
  fileReference: CurseForgeFileReference,
  fetchLike: CurseForgeFetchLike = fetch,
) {
  const validatedFileReference = parseCurseForgeFileReference(
    fileReference,
    "fileReference",
  );

  const response = await fetchLike(localCurseForgeDownloadRoute, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedFileReference),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download CurseForge file through ${localCurseForgeDownloadRoute}: ${response.status} ${await readRouteErrorMessage(response)}.`,
    );
  }

  return response.blob();
}

async function readRouteErrorMessage(response: Response) {
  try {
    const responseJson = await response.json();
    if (
      responseJson &&
      typeof responseJson === "object" &&
      !Array.isArray(responseJson) &&
      typeof (responseJson as Record<string, unknown>).error === "string"
    ) {
      return (responseJson as Record<string, string>).error;
    }
  } catch {
    return response.statusText;
  }

  return response.statusText;
}
