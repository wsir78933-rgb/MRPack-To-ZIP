import { ConversionError } from "./errors";
import type { FailedDownload } from "./failed-downloads";
import { parseHttpUrl } from "./input-validation";
import {
  maxReferencedFileBytes,
  maxTotalReferencedFileBytes,
  parseContentLengthBytes,
  readResponseBlobWithLimit,
} from "./limits";
import type { FetchLike } from "./modrinth-api";
import type { ModrinthIndexFile } from "./mrpack-parser";
import { validateArchivePath } from "./path-safety";

export type DownloadedReferencedFile = {
  path: string;
  content: Blob;
};

export type ReferencedFileDownloadResult =
  | {
      ok: true;
      downloadedFile: DownloadedReferencedFile;
      downloadedByteCount: number;
    }
  | {
      ok: false;
      failedDownload: FailedDownload;
      downloadedByteCount: number;
    };

export type ReferencedFileDownloadProgress = {
  currentFileCount: number;
  totalFileCount: number;
};

export type ReferencedFileDownloadProgressCallback = (
  progress: ReferencedFileDownloadProgress,
) => void;

export async function downloadFirstAvailableUrl(
  referencedFile: ModrinthIndexFile,
  fetchLike: FetchLike = fetch,
  remainingTotalDownloadBytes = maxTotalReferencedFileBytes,
): Promise<ReferencedFileDownloadResult> {
  validateArchivePath(referencedFile.path);

  const attemptedUrls: string[] = [];
  const reasons: string[] = [];
  let downloadedByteCount = 0;

  const singleFileLimitFailureReason = getManifestSingleFileLimitFailureReason(referencedFile);
  if (singleFileLimitFailureReason) {
    return {
      ok: false,
      failedDownload: {
        path: referencedFile.path,
        attemptedUrls,
        reasons: [singleFileLimitFailureReason],
      },
      downloadedByteCount,
    };
  }

  if (referencedFile.downloads.length === 0) {
    return {
      ok: false,
      failedDownload: {
        path: referencedFile.path,
        attemptedUrls,
        reasons: [`No downloads were listed for path ${referencedFile.path}.`],
      },
      downloadedByteCount,
    };
  }

  const totalLimitFailureReason = getManifestTotalLimitFailureReason(
    referencedFile,
    remainingTotalDownloadBytes,
  );
  if (totalLimitFailureReason) {
    return {
      ok: false,
      failedDownload: {
        path: referencedFile.path,
        attemptedUrls,
        reasons: [totalLimitFailureReason],
      },
      downloadedByteCount,
    };
  }

  for (const downloadUrl of referencedFile.downloads) {
    attemptedUrls.push(downloadUrl);
    const remainingAttemptDownloadBytes = remainingTotalDownloadBytes - downloadedByteCount;

    if (remainingAttemptDownloadBytes <= 0) {
      reasons.push(
        `Skipping path ${referencedFile.path} because the remaining total download limit is ${remainingAttemptDownloadBytes} bytes.`,
      );
      break;
    }

    let parsedDownloadUrl: URL;
    try {
      parsedDownloadUrl = parseHttpUrl(downloadUrl, `download URL for path ${referencedFile.path}`);
    } catch (caughtError) {
      reasons.push(formatErrorReason(caughtError));
      continue;
    }

    try {
      const response = await fetchLike(parsedDownloadUrl.href);
      if (!response.ok) {
        reasons.push(
          `URL ${parsedDownloadUrl.href} returned ${response.status} ${response.statusText}`,
        );
        continue;
      }

      const contentLengthBytes = parseContentLengthBytes(response);
      if (contentLengthBytes !== null && contentLengthBytes > maxReferencedFileBytes) {
        reasons.push(
          `URL ${parsedDownloadUrl.href} Content-Length ${contentLengthBytes} bytes exceeds the ${maxReferencedFileBytes} byte single file limit.`,
        );
        continue;
      }

      if (contentLengthBytes !== null && contentLengthBytes > remainingAttemptDownloadBytes) {
        reasons.push(
          `URL ${parsedDownloadUrl.href} Content-Length ${contentLengthBytes} bytes exceeds the remaining total download limit ${remainingAttemptDownloadBytes} bytes for path ${referencedFile.path}.`,
        );
        continue;
      }

      const downloadedBlob = await readResponseBlobWithLimit(response, {
        maxBodyBytes: Math.min(maxReferencedFileBytes, remainingAttemptDownloadBytes),
        sourceLabel: `URL ${parsedDownloadUrl.href}`,
        limitDescription: getResponseBodyLimitDescription(
          referencedFile,
          remainingAttemptDownloadBytes,
        ),
      });
      downloadedByteCount += downloadedBlob.size;
      const validationError = await validateDownloadedReferencedFile(
        referencedFile,
        parsedDownloadUrl.href,
        downloadedBlob,
        remainingAttemptDownloadBytes,
      );
      if (validationError) {
        reasons.push(validationError);
        continue;
      }

      return {
        ok: true,
        downloadedFile: {
          path: referencedFile.path,
          content: downloadedBlob,
        },
        downloadedByteCount,
      };
    } catch (caughtError) {
      downloadedByteCount += getDownloadedByteCountFromError(caughtError);
      reasons.push(formatErrorReason(caughtError));
      if (downloadedByteCount >= remainingTotalDownloadBytes) {
        break;
      }
    }
  }

  return {
    ok: false,
    failedDownload: {
      path: referencedFile.path,
      attemptedUrls,
      reasons,
    },
    downloadedByteCount,
  };
}

export async function downloadReferencedFiles(
  referencedFiles: ModrinthIndexFile[],
  fetchLike: FetchLike = fetch,
  totalDownloadByteLimit = maxTotalReferencedFileBytes,
  onProgress?: ReferencedFileDownloadProgressCallback,
) {
  const downloadedFiles: DownloadedReferencedFile[] = [];
  const failedDownloads: FailedDownload[] = [];
  let totalDownloadedBytes = 0;
  let totalDownloadLimitReached = false;
  let processedFileCount = 0;
  const totalFileCount = referencedFiles.length;

  function reportProcessedFile() {
    processedFileCount += 1;
    onProgress?.({
      currentFileCount: processedFileCount,
      totalFileCount,
    });
  }

  for (const referencedFile of referencedFiles) {
    if (totalDownloadLimitReached) {
      failedDownloads.push(
        createTotalLimitFailedDownload(
          referencedFile,
          totalDownloadedBytes,
          totalDownloadByteLimit,
        ),
      );
      reportProcessedFile();
      continue;
    }

    const remainingTotalDownloadBytes = totalDownloadByteLimit - totalDownloadedBytes;
    const downloadResult = await downloadFirstAvailableUrl(
      referencedFile,
      fetchLike,
      remainingTotalDownloadBytes,
    );

    const nextTotalDownloadedBytes = totalDownloadedBytes + downloadResult.downloadedByteCount;

    if (downloadResult.ok) {
      if (nextTotalDownloadedBytes > totalDownloadByteLimit) {
        totalDownloadLimitReached = true;
        failedDownloads.push(
          createTotalLimitFailedDownload(
            referencedFile,
            nextTotalDownloadedBytes,
            totalDownloadByteLimit,
          ),
        );
        reportProcessedFile();
        continue;
      }

      totalDownloadedBytes = nextTotalDownloadedBytes;
      downloadedFiles.push(downloadResult.downloadedFile);
    } else {
      totalDownloadedBytes = nextTotalDownloadedBytes;
      failedDownloads.push(downloadResult.failedDownload);
      if (totalDownloadedBytes >= totalDownloadByteLimit) {
        totalDownloadLimitReached = true;
      }
    }

    reportProcessedFile();
  }

  return { downloadedFiles, failedDownloads };
}

async function validateDownloadedReferencedFile(
  referencedFile: ModrinthIndexFile,
  downloadedUrl: string,
  downloadedBlob: Blob,
  remainingTotalDownloadBytes: number,
) {
  if (downloadedBlob.size > maxReferencedFileBytes) {
    return `URL ${downloadedUrl} downloaded ${downloadedBlob.size} bytes, which exceeds the ${maxReferencedFileBytes} byte single file limit.`;
  }

  if (downloadedBlob.size > remainingTotalDownloadBytes) {
    return `URL ${downloadedUrl} downloaded ${downloadedBlob.size} bytes for path ${referencedFile.path}, which exceeds the remaining total download limit ${remainingTotalDownloadBytes} bytes.`;
  }

  if (referencedFile.fileSize !== undefined && downloadedBlob.size !== referencedFile.fileSize) {
    return `URL ${downloadedUrl} downloaded ${downloadedBlob.size} bytes for path ${referencedFile.path}, expected fileSize ${referencedFile.fileSize}.`;
  }

  const expectedHash = selectExpectedHash(referencedFile.hashes);
  if (!expectedHash) {
    return null;
  }

  const actualHash = await digestBlob(downloadedBlob, expectedHash.algorithm);
  if (actualHash !== expectedHash.value.toLowerCase()) {
    return `URL ${downloadedUrl} ${expectedHash.algorithm} hash mismatch for path ${referencedFile.path}: expected ${expectedHash.value}, got ${actualHash}.`;
  }

  return null;
}

function getManifestTotalLimitFailureReason(
  referencedFile: ModrinthIndexFile,
  remainingTotalDownloadBytes: number,
) {
  if (remainingTotalDownloadBytes <= 0) {
    return `Skipping path ${referencedFile.path} because the remaining total download limit is ${remainingTotalDownloadBytes} bytes.`;
  }

  if (
    referencedFile.fileSize !== undefined &&
    referencedFile.fileSize > remainingTotalDownloadBytes
  ) {
    return `Skipping path ${referencedFile.path} because manifest fileSize ${referencedFile.fileSize} bytes exceeds the remaining total download limit ${remainingTotalDownloadBytes} bytes.`;
  }

  return null;
}

function getManifestSingleFileLimitFailureReason(referencedFile: ModrinthIndexFile) {
  if (
    referencedFile.fileSize !== undefined &&
    referencedFile.fileSize > maxReferencedFileBytes
  ) {
    return `Skipping path ${referencedFile.path} because manifest fileSize ${referencedFile.fileSize} bytes exceeds the ${maxReferencedFileBytes} byte single file limit.`;
  }

  return null;
}

function getResponseBodyLimitDescription(
  referencedFile: ModrinthIndexFile,
  remainingTotalDownloadBytes: number,
) {
  if (remainingTotalDownloadBytes < maxReferencedFileBytes) {
    return `remaining total download limit for path ${referencedFile.path}`;
  }

  return `single file limit for path ${referencedFile.path}`;
}

function selectExpectedHash(hashes: Record<string, string> | undefined) {
  if (!hashes) {
    return null;
  }

  if (typeof hashes.sha512 === "string") {
    return { algorithm: "sha512" as const, value: hashes.sha512 };
  }

  if (typeof hashes.sha1 === "string") {
    return { algorithm: "sha1" as const, value: hashes.sha1 };
  }

  return null;
}

async function digestBlob(downloadedBlob: Blob, algorithm: "sha512" | "sha1") {
  const arrayBuffer = await downloadedBlob.arrayBuffer();
  const subtleAlgorithmName = algorithm === "sha512" ? "SHA-512" : "SHA-1";
  const subtleCrypto = globalThis.crypto?.subtle;

  if (subtleCrypto) {
    const digestBuffer = await subtleCrypto.digest(subtleAlgorithmName, arrayBuffer);
    return arrayBufferToHex(digestBuffer);
  }

  const nodeCrypto = await import("node:crypto");
  return nodeCrypto
    .createHash(algorithm)
    .update(new Uint8Array(arrayBuffer))
    .digest("hex");
}

function arrayBufferToHex(arrayBuffer: ArrayBuffer) {
  return Array.from(new Uint8Array(arrayBuffer), (byteValue) =>
    byteValue.toString(16).padStart(2, "0"),
  ).join("");
}

function createTotalLimitFailedDownload(
  referencedFile: ModrinthIndexFile,
  totalDownloadedBytes: number,
  totalDownloadByteLimit = maxTotalReferencedFileBytes,
): FailedDownload {
  return {
    path: referencedFile.path,
    attemptedUrls: referencedFile.downloads,
    reasons: [
      `Skipping path ${referencedFile.path} because total download limit ${totalDownloadByteLimit} bytes would be exceeded by ${totalDownloadedBytes} bytes.`,
    ],
  };
}

function formatErrorReason(caughtError: unknown) {
  if (caughtError instanceof ConversionError) {
    return `${caughtError.code}: ${caughtError.message}`;
  }

  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return `Unknown download error: ${String(caughtError)}`;
}

function getDownloadedByteCountFromError(caughtError: unknown) {
  if (!(caughtError instanceof ConversionError)) {
    return 0;
  }

  if (!caughtError.details || typeof caughtError.details !== "object") {
    return 0;
  }

  const downloadedByteCount = (caughtError.details as Record<string, unknown>).downloadedByteCount;
  return typeof downloadedByteCount === "number" ? downloadedByteCount : 0;
}
