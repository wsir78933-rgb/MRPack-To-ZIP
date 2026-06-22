import { ConversionError, conversionErrorCodes, toConversionError } from "./errors";
import { assertMrpackSourceSize } from "./limits";
import type { FetchLike } from "./modrinth-api";
import {
  buildOutputZipFileName,
  downloadMrpackFromProject,
  downloadMrpackFromUrl,
  type MrpackArchiveSource,
} from "./conversion-source";
import {
  runMrpackConversionFromArrayBuffer,
  type ConversionProgress,
  type ConversionProgressStage,
  type MrpackConversionResult,
} from "./conversion-runner";

export const converterInputModes = ["project", "url", "upload"] as const;

export type ConverterInputMode = (typeof converterInputModes)[number];

export type BrowserMrpackFile = {
  name: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type ConversionWorkflowStage = "fetching-source" | ConversionProgressStage;

export type ConversionWorkflowProgress = {
  stage: ConversionWorkflowStage;
  percent: number;
  currentFileCount?: number;
  totalFileCount?: number;
};

export type CompletedConversionResult = MrpackConversionResult & {
  sourceFileName: string;
  outputZipFileName: string;
};

export type RunMrpackConversionWorkflowInput = {
  inputMode: ConverterInputMode;
  projectIdOrSlug?: string;
  mrpackDownloadUrl?: string;
  selectedFile?: BrowserMrpackFile | null;
  fetchLike?: FetchLike;
  onStageChange?: (stage: ConversionWorkflowStage) => void;
  onProgress?: (progress: ConversionWorkflowProgress) => void;
};

export async function runMrpackConversionWorkflow({
  fetchLike = fetch,
  inputMode,
  mrpackDownloadUrl = "",
  onStageChange,
  onProgress,
  projectIdOrSlug = "",
  selectedFile = null,
}: RunMrpackConversionWorkflowInput): Promise<CompletedConversionResult> {
  reportWorkflowProgress(
    {
      onProgress,
      onStageChange,
    },
    {
      stage: "fetching-source",
      percent: 5,
    },
  );

  const mrpackArchiveSource = await resolveMrpackArchiveSource({
    fetchLike,
    inputMode,
    mrpackDownloadUrl,
    projectIdOrSlug,
    selectedFile,
  });
  const conversionResult = await runMrpackConversionFromArrayBuffer(
    mrpackArchiveSource.mrpackBuffer,
    {
      fetchLike,
      onProgress: (progress) =>
        reportWorkflowProgress(
          {
            onProgress,
            onStageChange,
          },
          toConversionWorkflowProgress(progress),
        ),
    },
  );

  return {
    ...conversionResult,
    sourceFileName: mrpackArchiveSource.sourceFileName,
    outputZipFileName: mrpackArchiveSource.outputZipFileName,
  };
}

function toConversionWorkflowProgress(progress: ConversionProgress): ConversionWorkflowProgress {
  return {
    stage: progress.stage,
    percent: progress.percent,
    currentFileCount: progress.currentFileCount,
    totalFileCount: progress.totalFileCount,
  };
}

function reportWorkflowProgress(
  callbacks: Pick<RunMrpackConversionWorkflowInput, "onProgress" | "onStageChange">,
  progress: ConversionWorkflowProgress,
) {
  callbacks.onProgress?.(progress);
  callbacks.onStageChange?.(progress.stage);
}

export async function resolveMrpackArchiveSource({
  fetchLike = fetch,
  inputMode,
  mrpackDownloadUrl = "",
  projectIdOrSlug = "",
  selectedFile = null,
}: RunMrpackConversionWorkflowInput): Promise<MrpackArchiveSource> {
  if (inputMode === "project") {
    return downloadMrpackFromProject(projectIdOrSlug, fetchLike);
  }

  if (inputMode === "url") {
    return downloadMrpackFromUrl(mrpackDownloadUrl, fetchLike);
  }

  if (inputMode === "upload") {
    return resolveUploadMrpackArchiveSource(selectedFile);
  }

  throw new ConversionError(
    conversionErrorCodes.invalidInput,
    `Unknown MRPack inputMode: ${String(inputMode)}.`,
    undefined,
    { inputMode },
  );
}

async function resolveUploadMrpackArchiveSource(
  selectedFile: BrowserMrpackFile | null,
): Promise<MrpackArchiveSource> {
  if (!selectedFile) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `Missing selected .mrpack file for upload mode. selectedFile: ${String(selectedFile)}`,
    );
  }

  if (typeof selectedFile.size === "number") {
    assertMrpackSourceSize(selectedFile.size, selectedFile.name);
  }

  let mrpackBuffer: ArrayBuffer;
  try {
    mrpackBuffer = await selectedFile.arrayBuffer();
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.invalidInput,
      `Failed to read uploaded .mrpack file ${selectedFile.name}.`,
      caughtError,
    );
  }

  assertMrpackSourceSize(mrpackBuffer.byteLength, selectedFile.name);

  return {
    mrpackBuffer,
    sourceFileName: selectedFile.name,
    outputZipFileName: buildOutputZipFileName(selectedFile.name),
  };
}
