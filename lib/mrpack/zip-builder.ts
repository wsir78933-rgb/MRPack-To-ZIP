import JSZip from "jszip";

import { ConversionError, conversionErrorCodes, toConversionError } from "./errors";
import { formatFailedDownloadsReport, type FailedDownload } from "./failed-downloads";
import { createPackInfo } from "./pack-info";
import type { DownloadedReferencedFile } from "./referenced-file-downloader";
import type { ModrinthIndex, OverrideFile } from "./mrpack-parser";
import { validateArchivePath } from "./path-safety";

export type BuildOutputZipInput = {
  modrinthIndex: ModrinthIndex;
  overrideFiles: OverrideFile[];
  downloadedFiles: DownloadedReferencedFile[];
  failedDownloads: FailedDownload[];
};

export async function buildOutputZipBlob(buildInput: BuildOutputZipInput) {
  const outputZip = await buildOutputZip(buildInput);

  try {
    const outputZipBuffer = await outputZip.generateAsync({ type: "arraybuffer" });
    return new Blob([outputZipBuffer], { type: "application/zip" });
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.zipBuildFailed,
      "Failed to generate output ZIP Blob.",
      caughtError,
    );
  }
}

export async function buildOutputZip({
  modrinthIndex,
  overrideFiles,
  downloadedFiles,
  failedDownloads,
}: BuildOutputZipInput) {
  const outputZip = new JSZip();
  const outputPaths = new Set<string>();

  for (const overrideFile of overrideFiles) {
    await addBlobToOutputZip(
      outputZip,
      outputPaths,
      overrideFile.outputPath,
      overrideFile.content,
      `override file ${overrideFile.sourcePath}`,
    );
  }

  for (const downloadedFile of downloadedFiles) {
    await addBlobToOutputZip(
      outputZip,
      outputPaths,
      downloadedFile.path,
      downloadedFile.content,
      `downloaded file ${downloadedFile.path}`,
    );
  }

  if (failedDownloads.length > 0) {
    addTextToOutputZip(
      outputZip,
      outputPaths,
      "FAILED_DOWNLOADS.txt",
      formatFailedDownloadsReport(failedDownloads),
      "generated file FAILED_DOWNLOADS.txt",
    );
  }

  addTextToOutputZip(
    outputZip,
    outputPaths,
    "pack-info.json",
    JSON.stringify(createPackInfo(modrinthIndex, overrideFiles, failedDownloads), null, 2),
    "generated file pack-info.json",
  );

  return outputZip;
}

async function addBlobToOutputZip(
  outputZip: JSZip,
  outputPaths: Set<string>,
  outputPath: string,
  outputBlob: Blob,
  sourceDescription: string,
) {
  const validatedOutputPath = registerOutputPath(outputPaths, outputPath, sourceDescription);
  outputZip.file(
    validatedOutputPath,
    await readOutputBlob(validatedOutputPath, outputBlob),
  );
}

function addTextToOutputZip(
  outputZip: JSZip,
  outputPaths: Set<string>,
  outputPath: string,
  outputText: string,
  sourceDescription: string,
) {
  const validatedOutputPath = registerOutputPath(outputPaths, outputPath, sourceDescription);
  outputZip.file(validatedOutputPath, outputText);
}

async function readOutputBlob(outputPath: string, outputBlob: Blob) {
  try {
    return await outputBlob.arrayBuffer();
  } catch (caughtError) {
    throwZipBuildError(outputPath, caughtError);
  }
}

function registerOutputPath(
  outputPaths: Set<string>,
  outputPath: string,
  sourceDescription: string,
) {
  const validatedOutputPath = validateArchivePath(outputPath);
  if (outputPaths.has(validatedOutputPath)) {
    throw new ConversionError(
      conversionErrorCodes.zipBuildFailed,
      `Duplicate output ZIP path ${validatedOutputPath} from ${sourceDescription}.`,
    );
  }

  outputPaths.add(validatedOutputPath);
  return validatedOutputPath;
}

function throwZipBuildError(outputPath: string, caughtError: unknown): never {
  const reason = caughtError instanceof Error ? caughtError.message : String(caughtError);
  throw new ConversionError(
    conversionErrorCodes.zipBuildFailed,
    `Failed to write output ZIP path ${outputPath}: ${reason}`,
    caughtError,
  );
}
