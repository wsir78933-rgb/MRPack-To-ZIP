import JSZip from "jszip";

import type { CurseForgeManifest } from "../curseforge/manifest-parser";
import type { CurseForgeOverrideFile } from "../curseforge/archive-reader";
import { ConversionError, conversionErrorCodes, toConversionError } from "../mrpack/errors";
import { validateArchivePath } from "../mrpack/path-safety";
import {
  createModrinthIndex,
  type MatchedModrinthFile,
} from "./modrinth-index-builder";

export type CurseForgeOnlyFile = {
  curseForgeProjectId: number;
  curseForgeFileId: number;
  fileName: string;
  content: Blob;
};

export type BuildZipToMrpackInput = {
  curseForgeManifest: CurseForgeManifest;
  matchedModrinthFiles: MatchedModrinthFile[];
  curseForgeOnlyFiles: CurseForgeOnlyFile[];
  overrideFiles: CurseForgeOverrideFile[];
};

export async function buildZipToMrpackBlob(buildInput: BuildZipToMrpackInput) {
  const mrpackArchive = await buildZipToMrpackArchive(buildInput);

  try {
    const mrpackBuffer = await mrpackArchive.generateAsync({ type: "arraybuffer" });
    return new Blob([mrpackBuffer], { type: "application/x-modrinth-modpack+zip" });
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.zipBuildFailed,
      "Failed to generate MRPack Blob.",
      caughtError,
    );
  }
}

export async function buildZipToMrpackArchive(buildInput: BuildZipToMrpackInput) {
  const mrpackArchive = new JSZip();
  const outputPaths = new Set<string>();
  const modrinthIndex = createModrinthIndex({
    curseForgeManifest: buildInput.curseForgeManifest,
    matchedModrinthFiles: buildInput.matchedModrinthFiles,
  });

  addTextToMrpack(
    mrpackArchive,
    outputPaths,
    "modrinth.index.json",
    JSON.stringify(modrinthIndex, null, 2),
    "generated modrinth.index.json",
  );

  for (const overrideFile of buildInput.overrideFiles) {
    await addBlobToMrpack(
      mrpackArchive,
      outputPaths,
      `overrides/${overrideFile.outputPath}`,
      overrideFile.content,
      `override file ${overrideFile.sourcePath}`,
    );
  }

  for (const curseForgeOnlyFile of buildInput.curseForgeOnlyFiles) {
    await addBlobToMrpack(
      mrpackArchive,
      outputPaths,
      `overrides/mods/${parseSafeFileName(curseForgeOnlyFile.fileName)}`,
      curseForgeOnlyFile.content,
      `CurseForge file ${curseForgeOnlyFile.curseForgeProjectId}/${curseForgeOnlyFile.curseForgeFileId}`,
    );
  }

  return mrpackArchive;
}

async function addBlobToMrpack(
  mrpackArchive: JSZip,
  outputPaths: Set<string>,
  outputPath: string,
  outputBlob: Blob,
  sourceDescription: string,
) {
  const validatedOutputPath = registerOutputPath(outputPaths, outputPath, sourceDescription);
  mrpackArchive.file(
    validatedOutputPath,
    await readOutputBlob(validatedOutputPath, outputBlob),
  );
}

function addTextToMrpack(
  mrpackArchive: JSZip,
  outputPaths: Set<string>,
  outputPath: string,
  outputText: string,
  sourceDescription: string,
) {
  const validatedOutputPath = registerOutputPath(outputPaths, outputPath, sourceDescription);
  mrpackArchive.file(validatedOutputPath, outputText);
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
      `Duplicate MRPack path ${validatedOutputPath} from ${sourceDescription}.`,
    );
  }

  outputPaths.add(validatedOutputPath);
  return validatedOutputPath;
}

function parseSafeFileName(fileName: string) {
  if (
    fileName.trim().length === 0 ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName === "." ||
    fileName === ".."
  ) {
    throw new ConversionError(
      conversionErrorCodes.invalidPath,
      `Invalid CurseForge file name for MRPack overrides/mods: ${JSON.stringify(fileName)}. Expected a safe file name without path separators.`,
      undefined,
      { fileName },
    );
  }

  return validateArchivePath(fileName);
}

async function readOutputBlob(outputPath: string, outputBlob: Blob) {
  try {
    return await outputBlob.arrayBuffer();
  } catch (caughtError) {
    const reason = caughtError instanceof Error ? caughtError.message : String(caughtError);
    throw new ConversionError(
      conversionErrorCodes.zipBuildFailed,
      `Failed to write MRPack path ${outputPath}: ${reason}`,
      caughtError,
    );
  }
}
