import { ConversionError, conversionErrorCodes, toConversionError } from "./errors";
import { isMrpackFileName, parseHttpUrl } from "./input-validation";
import {
  fetchProjectVersions,
  findFirstMrpackFile,
  type FetchLike,
} from "./modrinth-api";
import {
  assertMrpackSourceSize,
  maxMrpackSourceBytes,
  parseContentLengthBytes,
  readResponseArrayBufferWithLimit,
} from "./limits";

export type MrpackArchiveSource = {
  mrpackBuffer: ArrayBuffer;
  sourceFileName: string;
  outputZipFileName: string;
};

const fallbackMrpackFileName = "downloaded-pack.mrpack";
const fallbackOutputFileBaseName = "converted-pack";

export async function downloadMrpackFromProject(
  projectIdOrSlug: string,
  fetchLike: FetchLike = fetch,
): Promise<MrpackArchiveSource> {
  const projectVersions = await fetchProjectVersions(projectIdOrSlug, fetchLike);
  const mrpackFile = findFirstMrpackFile(projectVersions);

  if (!mrpackFile) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `No .mrpack file found for Modrinth project ${projectIdOrSlug}.`,
      undefined,
      { projectIdOrSlug, reason: "no_mrpack_file" },
    );
  }

  const downloadedSource = await downloadMrpackFromUrl(mrpackFile.url, fetchLike);

  return {
    ...downloadedSource,
    sourceFileName: mrpackFile.filename,
    outputZipFileName: buildOutputZipFileName(mrpackFile.filename),
  };
}

export async function downloadMrpackFromUrl(
  mrpackDownloadUrl: string,
  fetchLike: FetchLike = fetch,
): Promise<MrpackArchiveSource> {
  const parsedDownloadUrl = parseHttpUrl(
    mrpackDownloadUrl,
    `MRPack download URL ${mrpackDownloadUrl}`,
  );
  const sourceFileName = getMrpackFileNameFromUrl(parsedDownloadUrl);

  let response: Response;

  try {
    response = await fetchLike(parsedDownloadUrl.href);
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.downloadFailed,
      `Failed to download .mrpack from URL ${parsedDownloadUrl.href}.`,
      caughtError,
    );
  }

  if (!response.ok) {
    throw new ConversionError(
      conversionErrorCodes.downloadFailed,
      `Failed to download .mrpack from URL ${parsedDownloadUrl.href}: ${response.status} ${response.statusText}`,
    );
  }

  try {
    const contentLengthBytes = parseContentLengthBytes(response);
    if (contentLengthBytes !== null) {
      assertMrpackSourceSize(contentLengthBytes, parsedDownloadUrl.href);
    }

    const mrpackBuffer = await readResponseArrayBufferWithLimit(response, {
      maxBodyBytes: maxMrpackSourceBytes,
      sourceLabel: parsedDownloadUrl.href,
      limitDescription: ".mrpack download limit",
    });

    return {
      mrpackBuffer,
      sourceFileName,
      outputZipFileName: buildOutputZipFileName(sourceFileName),
    };
  } catch (caughtError) {
    throw toConversionError(
      conversionErrorCodes.downloadFailed,
      `Failed to read .mrpack response body from URL ${parsedDownloadUrl.href}.`,
      caughtError,
    );
  }
}

export function buildOutputZipFileName(sourceFileName: string) {
  const trimmedFileName = sourceFileName.trim();
  const fileNameWithoutExtension = isMrpackFileName(trimmedFileName)
    ? trimmedFileName.slice(0, -".mrpack".length)
    : trimmedFileName;
  const safeFileName = fileNameWithoutExtension
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();

  return `${safeFileName || fallbackOutputFileBaseName}.zip`;
}

function getMrpackFileNameFromUrl(parsedDownloadUrl: URL) {
  const lastPathSegment = parsedDownloadUrl.pathname.split("/").filter(Boolean).at(-1);

  if (!lastPathSegment) {
    return fallbackMrpackFileName;
  }

  let decodedPathSegment: string;
  try {
    decodedPathSegment = decodeURIComponent(lastPathSegment);
  } catch {
    return fallbackMrpackFileName;
  }

  return isMrpackFileName(decodedPathSegment) ? decodedPathSegment : fallbackMrpackFileName;
}
