import { parseCurseForgeFileReference } from "./request-validation";
import { throwCurseForgeRouteConversionError } from "./route-errors";
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
    await throwCurseForgeRouteConversionError(localCurseForgeDownloadRoute, response);
  }

  return response.blob();
}
