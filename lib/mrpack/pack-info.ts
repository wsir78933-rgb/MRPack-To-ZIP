import type { FailedDownload } from "./failed-downloads";
import type { ModrinthIndex, OverrideFile } from "./mrpack-parser";

export function createPackInfo(
  modrinthIndex: ModrinthIndex,
  overrideFiles: OverrideFile[],
  failedDownloads: FailedDownload[],
) {
  return {
    name: modrinthIndex.name ?? null,
    versionId: modrinthIndex.versionId ?? null,
    minecraftVersion: modrinthIndex.dependencies?.minecraft ?? null,
    referencedFileCount: modrinthIndex.files.length,
    overrideFileCount: overrideFiles.length,
    failedDownloadCount: failedDownloads.length,
  };
}
