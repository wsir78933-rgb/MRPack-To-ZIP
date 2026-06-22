import type { FetchLike } from "./modrinth-api";
import { assertMrpackSourceSize } from "./limits";
import {
  collectOverrideFiles,
  loadMrpackArchive,
  parseModrinthIndexJson,
  readModrinthIndex,
} from "./mrpack-parser";
import { downloadReferencedFiles } from "./referenced-file-downloader";
import { buildOutputZipBlob } from "./zip-builder";

export type ConversionProgressStage =
  | "loading-archive"
  | "reading-index"
  | "collecting-overrides"
  | "downloading-files"
  | "building-zip";

export type ConversionProgress = {
  stage: ConversionProgressStage;
  percent: number;
  currentFileCount?: number;
  totalFileCount?: number;
};

export type RunMrpackConversionOptions = {
  fetchLike?: FetchLike;
  onProgress?: (progress: ConversionProgress) => void;
};

export type MrpackConversionResult = {
  outputZipBlob: Blob;
  packName: string | null;
  referencedFileCount: number;
  downloadedFileCount: number;
  overrideFileCount: number;
  failedDownloadCount: number;
};

export { assertMrpackSourceSize };

const conversionProgressPercentByStage = {
  "loading-archive": 15,
  "reading-index": 25,
  "collecting-overrides": 35,
  "building-zip": 90,
} as const satisfies Record<Exclude<ConversionProgressStage, "downloading-files">, number>;

const downloadingFilesStartPercent = 40;
const downloadingFilesEndPercent = 85;

export async function runMrpackConversionFromArrayBuffer(
  mrpackBuffer: ArrayBuffer,
  options: RunMrpackConversionOptions = {},
): Promise<MrpackConversionResult> {
  const fetchLike = options.fetchLike ?? fetch;

  reportStageProgress(options.onProgress, "loading-archive");
  assertMrpackSourceSize(mrpackBuffer.byteLength, "ArrayBuffer upload");
  const mrpackArchive = await loadMrpackArchive(mrpackBuffer);

  reportStageProgress(options.onProgress, "reading-index");
  const indexJsonText = await readModrinthIndex(mrpackArchive);
  const modrinthIndex = parseModrinthIndexJson(indexJsonText);

  reportStageProgress(options.onProgress, "collecting-overrides");
  const overrideFiles = await collectOverrideFiles(mrpackArchive);

  reportDownloadingFilesProgress(options.onProgress, 0, modrinthIndex.files.length);
  const { downloadedFiles, failedDownloads } = await downloadReferencedFiles(
    modrinthIndex.files,
    fetchLike,
    undefined,
    ({ currentFileCount, totalFileCount }) => {
      reportDownloadingFilesProgress(options.onProgress, currentFileCount, totalFileCount);
    },
  );

  reportStageProgress(options.onProgress, "building-zip");
  const outputZipBlob = await buildOutputZipBlob({
    modrinthIndex,
    overrideFiles,
    downloadedFiles,
    failedDownloads,
  });

  return {
    outputZipBlob,
    packName: modrinthIndex.name ?? null,
    referencedFileCount: modrinthIndex.files.length,
    downloadedFileCount: downloadedFiles.length,
    overrideFileCount: overrideFiles.length,
    failedDownloadCount: failedDownloads.length,
  };
}

function reportStageProgress(
  onProgress: RunMrpackConversionOptions["onProgress"],
  stage: Exclude<ConversionProgressStage, "downloading-files">,
) {
  onProgress?.({
    stage,
    percent: conversionProgressPercentByStage[stage],
  });
}

function reportDownloadingFilesProgress(
  onProgress: RunMrpackConversionOptions["onProgress"],
  currentFileCount: number,
  totalFileCount: number,
) {
  onProgress?.({
    stage: "downloading-files",
    percent: calculateDownloadingFilesPercent(currentFileCount, totalFileCount),
    currentFileCount,
    totalFileCount,
  });
}

function calculateDownloadingFilesPercent(currentFileCount: number, totalFileCount: number) {
  if (totalFileCount === 0) {
    return downloadingFilesEndPercent;
  }

  const completedFileRatio = currentFileCount / totalFileCount;
  return (
    downloadingFilesStartPercent +
    (downloadingFilesEndPercent - downloadingFilesStartPercent) * completedFileRatio
  );
}
