import JSZip from "jszip";

import { ConversionError, conversionErrorCodes, toConversionError } from "../mrpack/errors";
import { validateArchivePath } from "../mrpack/path-safety";

export type CurseForgeOverrideFile = {
  sourcePath: string;
  outputPath: string;
  content: Blob;
};

export async function loadCurseForgeZipArchive(curseForgeZipBuffer: ArrayBuffer) {
  try {
    return await JSZip.loadAsync(curseForgeZipBuffer);
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.invalidInput,
      "Invalid CurseForge ZIP archive. The provided ArrayBuffer could not be read as a ZIP archive.",
      caughtError,
    );
  }
}

export async function readCurseForgeManifestJson(curseForgeArchive: JSZip) {
  const manifestFile = curseForgeArchive.file("manifest.json");

  if (!manifestFile) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      "Invalid CurseForge ZIP archive. Missing required manifest.json.",
    );
  }

  return manifestFile.async("string");
}

export async function collectCurseForgeOverrideFiles(
  curseForgeArchive: JSZip,
  overridesPath: string,
) {
  const validatedOverridesPath = validateArchivePath(overridesPath);
  const overridesPathPrefix = `${validatedOverridesPath}/`;
  const overrideFiles: CurseForgeOverrideFile[] = [];

  for (const archiveFileEntry of Object.values(curseForgeArchive.files)) {
    if (archiveFileEntry.dir) {
      continue;
    }

    const archivePath = validateArchiveEntryPath(archiveFileEntry);
    if (!archivePath.startsWith(overridesPathPrefix)) {
      continue;
    }

    const outputPath = validateArchivePath(archivePath.slice(overridesPathPrefix.length));
    overrideFiles.push({
      sourcePath: archivePath,
      outputPath,
      content: new Blob([await archiveFileEntry.async("arraybuffer")]),
    });
  }

  return overrideFiles;
}

function validateArchiveEntryPath(archiveFileEntry: JSZip.JSZipObject) {
  if (archiveFileEntry.unsafeOriginalName) {
    validateArchivePath(archiveFileEntry.unsafeOriginalName);
  }

  return validateArchivePath(archiveFileEntry.name);
}
