import { ConversionError, conversionErrorCodes } from "./errors";

export const maxMrpackSourceBytes = 100 * 1024 * 1024;
export const maxManifestFileCount = 3000;
export const maxReferencedFileBytes = 250 * 1024 * 1024;
export const maxTotalReferencedFileBytes = 1024 * 1024 * 1024;

export function assertMrpackSourceSize(byteLength: number, sourceLabel: string) {
  if (byteLength > maxMrpackSourceBytes) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `MRPack source ${sourceLabel} is ${byteLength} bytes, which exceeds the ${maxMrpackSourceBytes} byte limit.`,
      undefined,
      {
        byteLength,
        maxBytes: maxMrpackSourceBytes,
        reason: "mrpack_source_size",
        sourceLabel,
      },
    );
  }
}

export function parseContentLengthBytes(response: Response) {
  const contentLengthHeader = response.headers.get("Content-Length");

  if (contentLengthHeader === null) {
    return null;
  }

  const contentLengthBytes = Number(contentLengthHeader);
  if (!Number.isFinite(contentLengthBytes) || contentLengthBytes < 0) {
    throw new ConversionError(
      conversionErrorCodes.downloadFailed,
      `Invalid Content-Length header value: ${contentLengthHeader}.`,
    );
  }

  return contentLengthBytes;
}

type ResponseBodyLimit = {
  maxBodyBytes: number;
  sourceLabel: string;
  limitDescription: string;
};

export async function readResponseArrayBufferWithLimit(
  response: Response,
  bodyLimit: ResponseBodyLimit,
) {
  const streamedBody = await readResponseBodyWithLimit(response, bodyLimit);
  const arrayBuffer = new ArrayBuffer(streamedBody.byteLength);
  const outputBytes = new Uint8Array(arrayBuffer);
  let nextOffset = 0;

  for (const bodyChunk of streamedBody.chunks) {
    outputBytes.set(bodyChunk, nextOffset);
    nextOffset += bodyChunk.byteLength;
  }

  return arrayBuffer;
}

export async function readResponseBlobWithLimit(
  response: Response,
  bodyLimit: ResponseBodyLimit,
) {
  const streamedBody = await readResponseBodyWithLimit(response, bodyLimit);
  return new Blob(streamedBody.chunks);
}

async function readResponseBodyWithLimit(
  response: Response,
  { limitDescription, maxBodyBytes, sourceLabel }: ResponseBodyLimit,
) {
  if (!response.body) {
    throw new ConversionError(
      conversionErrorCodes.downloadFailed,
      `Response body for ${sourceLabel} is not readable, so the ${maxBodyBytes} byte ${limitDescription} cannot be enforced while streaming.`,
      undefined,
      { limitDescription, maxBodyBytes, sourceLabel },
    );
  }

  const bodyReader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let downloadedByteCount = 0;

  while (true) {
    const nextChunk = await bodyReader.read();
    if (nextChunk.done) {
      break;
    }

    const bodyChunk = nextChunk.value;
    downloadedByteCount += bodyChunk.byteLength;
    if (downloadedByteCount > maxBodyBytes) {
      throw new ConversionError(
        conversionErrorCodes.downloadFailed,
        `${sourceLabel} downloaded ${downloadedByteCount} bytes, which exceeds the ${maxBodyBytes} byte ${limitDescription}.`,
        undefined,
        { limitDescription, maxBodyBytes, sourceLabel },
        { downloadedByteCount },
      );
    }

    chunks.push(bodyChunk);
  }

  return { byteLength: downloadedByteCount, chunks };
}
