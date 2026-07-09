import {
  collectCurseForgeOverrideFiles,
  loadCurseForgeZipArchive,
  readCurseForgeManifestJson,
} from "../curseforge/archive-reader";
import {
  parseCurseForgeManifestJson,
  type CurseForgeManifestFile,
} from "../curseforge/manifest-parser";
import { downloadCurseForgeFileContent } from "../curseforge-api/client-download";
import { fetchCurseForgeFileMetadata } from "../curseforge-api/client-files";
import type {
  CurseForgeFetchLike,
  CurseForgeFileMetadata,
  CurseForgeFileReference,
} from "../curseforge-api/types";
import { ConversionError, conversionErrorCodes, toConversionError } from "../mrpack/errors";
import {
  buildZipToMrpackBlob,
  type CurseForgeOnlyFile,
} from "./mrpack-builder";
import {
  fetchModrinthVersionsBySha1,
  type ModrinthMatchedVersion,
} from "./modrinth-version-files";
import type { MatchedModrinthFile } from "./modrinth-index-builder";

export type BrowserCurseForgeZipFile = {
  name: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type ZipToMrpackConversionStage =
  | "reading-zip"
  | "reading-manifest"
  | "resolving-curseforge-files"
  | "matching-modrinth-files"
  | "downloading-curseforge-files"
  | "building-mrpack";

export type ZipToMrpackConversionProgress = {
  stage: ZipToMrpackConversionStage;
  percent: number;
  currentFileCount?: number;
  totalFileCount?: number;
};

export type ZipToMrpackConversionResult = {
  outputMrpackBlob: Blob;
  outputMrpackFileName: string;
  sourceFileName: string;
  matchedFileCount: number;
  bundledFileCount: number;
  referencedFileCount: number;
};

export type RunZipToMrpackConversionWorkflowInput = {
  selectedFile: BrowserCurseForgeZipFile | null;
  fetchLike?: CurseForgeFetchLike;
  onProgressChange?: (progress: ZipToMrpackConversionProgress) => void;
  onStageChange?: (stage: ZipToMrpackConversionStage) => void;
};

type ZipToMrpackProgressCallbacks = Pick<
  RunZipToMrpackConversionWorkflowInput,
  "onProgressChange" | "onStageChange"
>;

const zipToMrpackProgressPercentByStage = {
  "reading-zip": 10,
  "reading-manifest": 22,
  "resolving-curseforge-files": 38,
  "matching-modrinth-files": 58,
  "building-mrpack": 90,
} satisfies Record<Exclude<ZipToMrpackConversionStage, "downloading-curseforge-files">, number>;

const curseForgeDownloadStartPercent = 65;
const curseForgeDownloadEndPercent = 85;

export async function runZipToMrpackConversionWorkflow({
  fetchLike = fetch,
  onProgressChange,
  onStageChange,
  selectedFile,
}: RunZipToMrpackConversionWorkflowInput): Promise<ZipToMrpackConversionResult> {
  if (!selectedFile) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `Missing selected CurseForge ZIP file. selectedFile: ${String(selectedFile)}`,
    );
  }

  if (!isZipFileName(selectedFile.name)) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `Invalid CurseForge ZIP file name: ${selectedFile.name}. Expected a .zip file.`,
      undefined,
      { fileName: selectedFile.name },
    );
  }

  const progressCallbacks = {
    onProgressChange,
    onStageChange,
  };

  reportStageProgress(progressCallbacks, "reading-zip");
  const curseForgeZipBuffer = await readSelectedZipFile(selectedFile);
  const curseForgeArchive = await loadCurseForgeZipArchive(curseForgeZipBuffer);

  reportStageProgress(progressCallbacks, "reading-manifest");
  const manifestJsonText = await readCurseForgeManifestJson(curseForgeArchive);
  const curseForgeManifest = parseCurseForgeManifestJson(manifestJsonText);
  const overrideFiles = await collectCurseForgeOverrideFiles(
    curseForgeArchive,
    curseForgeManifest.overrides,
  );

  reportStageProgress(progressCallbacks, "resolving-curseforge-files");
  const curseForgeFiles = await fetchCurseForgeFileMetadata(
    curseForgeManifest.files.map(toCurseForgeFileReference),
    fetchLike,
  );
  const curseForgeFilesByFileId = indexCurseForgeFilesByFileId(curseForgeFiles);
  const resolvedCurseForgeFiles = curseForgeManifest.files.map((manifestFile) =>
    resolveManifestFileMetadata(manifestFile, curseForgeFilesByFileId),
  );

  reportStageProgress(progressCallbacks, "matching-modrinth-files");
  const sha1Hashes = resolvedCurseForgeFiles
    .map((curseForgeFile) => extractSha1Hash(curseForgeFile))
    .filter((sha1Hash): sha1Hash is string => Boolean(sha1Hash));
  const modrinthVersionsBySha1 = await fetchModrinthVersionsBySha1(sha1Hashes, fetchLike);
  const matchedModrinthFiles: MatchedModrinthFile[] = [];
  const curseForgeOnlyFileMetadatas: CurseForgeFileMetadata[] = [];

  for (const curseForgeFile of resolvedCurseForgeFiles) {
    const sha1Hash = extractSha1Hash(curseForgeFile);
    const matchedVersion = sha1Hash ? modrinthVersionsBySha1[sha1Hash] : undefined;
    const matchedVersionFile = sha1Hash
      ? findModrinthFileBySha1(matchedVersion, sha1Hash)
      : null;

    if (matchedVersionFile) {
      matchedModrinthFiles.push({
        curseForgeProjectId: curseForgeFile.modId,
        curseForgeFileId: curseForgeFile.fileId,
        path: `mods/${matchedVersionFile.filename}`,
        downloads: [matchedVersionFile.url],
        hashes: matchedVersionFile.hashes,
        fileSize: matchedVersionFile.size,
      });
    } else {
      curseForgeOnlyFileMetadatas.push(curseForgeFile);
    }
  }

  const curseForgeOnlyFiles = await downloadCurseForgeOnlyFiles(
    curseForgeOnlyFileMetadatas,
    fetchLike,
    progressCallbacks,
  );
  reportStageProgress(progressCallbacks, "building-mrpack");
  const outputMrpackBlob = await buildZipToMrpackBlob({
    curseForgeManifest,
    matchedModrinthFiles,
    curseForgeOnlyFiles,
    overrideFiles,
  });

  return {
    outputMrpackBlob,
    outputMrpackFileName: buildOutputMrpackFileName(selectedFile.name),
    sourceFileName: selectedFile.name,
    matchedFileCount: matchedModrinthFiles.length,
    bundledFileCount: curseForgeOnlyFiles.length,
    referencedFileCount: curseForgeManifest.files.length,
  };
}

function reportStageProgress(
  callbacks: ZipToMrpackProgressCallbacks,
  stage: Exclude<ZipToMrpackConversionStage, "downloading-curseforge-files">,
) {
  reportZipToMrpackConversionProgress(callbacks, {
    stage,
    percent: zipToMrpackProgressPercentByStage[stage],
  });
}

function reportZipToMrpackConversionProgress(
  callbacks: ZipToMrpackProgressCallbacks,
  progress: ZipToMrpackConversionProgress,
) {
  callbacks.onProgressChange?.(progress);
  callbacks.onStageChange?.(progress.stage);
}

async function readSelectedZipFile(selectedFile: BrowserCurseForgeZipFile) {
  try {
    return await selectedFile.arrayBuffer();
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.invalidInput,
      `Failed to read selected CurseForge ZIP file ${selectedFile.name}.`,
      caughtError,
    );
  }
}

function toCurseForgeFileReference(
  manifestFile: CurseForgeManifestFile,
): CurseForgeFileReference {
  return {
    projectId: manifestFile.projectId,
    fileId: manifestFile.fileId,
  };
}

function indexCurseForgeFilesByFileId(curseForgeFiles: CurseForgeFileMetadata[]) {
  const curseForgeFilesByFileId = new Map<number, CurseForgeFileMetadata>();

  for (const curseForgeFile of curseForgeFiles) {
    if (curseForgeFilesByFileId.has(curseForgeFile.fileId)) {
      throw new ConversionError(
        conversionErrorCodes.invalidInput,
        `Duplicate CurseForge metadata for fileId ${curseForgeFile.fileId}.`,
      );
    }

    curseForgeFilesByFileId.set(curseForgeFile.fileId, curseForgeFile);
  }

  return curseForgeFilesByFileId;
}

function resolveManifestFileMetadata(
  manifestFile: CurseForgeManifestFile,
  curseForgeFilesByFileId: Map<number, CurseForgeFileMetadata>,
) {
  const curseForgeFile = curseForgeFilesByFileId.get(manifestFile.fileId);
  if (!curseForgeFile) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `CurseForge metadata was not returned for projectId ${manifestFile.projectId}, fileId ${manifestFile.fileId}.`,
    );
  }

  if (curseForgeFile.modId !== manifestFile.projectId) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `CurseForge metadata mismatch for fileId ${manifestFile.fileId}: manifest projectId ${manifestFile.projectId}, API modId ${curseForgeFile.modId}.`,
    );
  }

  return curseForgeFile;
}

function extractSha1Hash(curseForgeFile: CurseForgeFileMetadata) {
  return curseForgeFile.hashes.find((hash) => hash.algo === 1)?.value ?? null;
}

function findModrinthFileBySha1(
  matchedVersion: ModrinthMatchedVersion | undefined,
  sha1Hash: string,
) {
  return matchedVersion?.files.find((versionFile) => versionFile.hashes.sha1 === sha1Hash) ?? null;
}

async function downloadCurseForgeOnlyFiles(
  curseForgeOnlyFileMetadatas: CurseForgeFileMetadata[],
  fetchLike: CurseForgeFetchLike,
  progressCallbacks: ZipToMrpackProgressCallbacks,
): Promise<CurseForgeOnlyFile[]> {
  const curseForgeOnlyFiles: CurseForgeOnlyFile[] = [];
  const totalFileCount = curseForgeOnlyFileMetadatas.length;
  let currentFileCount = 0;

  reportCurseForgeOnlyDownloadProgress(
    progressCallbacks,
    currentFileCount,
    totalFileCount,
  );

  for (const curseForgeFile of curseForgeOnlyFileMetadatas) {
    try {
      const content = await downloadCurseForgeFileContent(
        {
          projectId: curseForgeFile.modId,
          fileId: curseForgeFile.fileId,
        },
        fetchLike,
      );

      curseForgeOnlyFiles.push({
        curseForgeProjectId: curseForgeFile.modId,
        curseForgeFileId: curseForgeFile.fileId,
        fileName: curseForgeFile.fileName,
        content,
      });
    } finally {
      currentFileCount += 1;
      reportCurseForgeOnlyDownloadProgress(
        progressCallbacks,
        currentFileCount,
        totalFileCount,
      );
    }
  }

  return curseForgeOnlyFiles;
}

function reportCurseForgeOnlyDownloadProgress(
  callbacks: ZipToMrpackProgressCallbacks,
  currentFileCount: number,
  totalFileCount: number,
) {
  if (totalFileCount === 0) {
    return;
  }

  reportZipToMrpackConversionProgress(callbacks, {
    stage: "downloading-curseforge-files",
    percent: calculateCurseForgeOnlyDownloadPercent(currentFileCount, totalFileCount),
    currentFileCount,
    totalFileCount,
  });
}

function calculateCurseForgeOnlyDownloadPercent(
  currentFileCount: number,
  totalFileCount: number,
) {
  return (
    curseForgeDownloadStartPercent +
    ((curseForgeDownloadEndPercent - curseForgeDownloadStartPercent) * currentFileCount) /
      totalFileCount
  );
}

function buildOutputMrpackFileName(sourceFileName: string) {
  const trimmedSourceFileName = sourceFileName.trim();
  const fileNameWithoutExtension = isZipFileName(trimmedSourceFileName)
    ? trimmedSourceFileName.slice(0, -".zip".length)
    : trimmedSourceFileName;
  const safeFileName = fileNameWithoutExtension
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();

  return `${safeFileName || "converted-pack"}.mrpack`;
}

function isZipFileName(fileName: string) {
  return fileName.trim().toLowerCase().endsWith(".zip");
}
