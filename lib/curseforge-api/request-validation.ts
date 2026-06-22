import {
  CurseForgeRequestValidationError,
  type CurseForgeFileReference,
} from "./types";

const maxCurseForgeInt32Id = 2_147_483_647;
const maxCurseForgeFileReferencesPerRequest = 3000;

export function parseCurseForgeFileMetadataRequest(
  requestJson: unknown,
): CurseForgeFileReference[] {
  if (!requestJson || typeof requestJson !== "object" || Array.isArray(requestJson)) {
    throw new CurseForgeRequestValidationError("root", requestJson, "an object");
  }

  const requestRecord = requestJson as Record<string, unknown>;
  if (!Array.isArray(requestRecord.fileReferences)) {
    throw new CurseForgeRequestValidationError(
      "fileReferences",
      requestRecord.fileReferences,
      "an array of file references",
    );
  }

  if (requestRecord.fileReferences.length > maxCurseForgeFileReferencesPerRequest) {
    throw new CurseForgeRequestValidationError(
      "fileReferences.length",
      requestRecord.fileReferences.length,
      `no more than ${maxCurseForgeFileReferencesPerRequest} file references`,
    );
  }

  return parseCurseForgeFileReferences(requestRecord.fileReferences, "fileReferences");
}

export function parseCurseForgeFileReferences(
  fileReferences: unknown[],
  fieldPath: string,
): CurseForgeFileReference[] {
  return fileReferences.map((fileReferenceValue, fileReferenceIndex) =>
    parseCurseForgeFileReference(
      fileReferenceValue,
      `${fieldPath}[${fileReferenceIndex}]`,
    ),
  );
}

export function extractCurseForgeFileIds(fileReferences: CurseForgeFileReference[]): number[] {
  return fileReferences.map((fileReference) => fileReference.fileId);
}

export function parseCurseForgeFileReference(
  fileReferenceValue: unknown,
  fieldPath: string,
): CurseForgeFileReference {
  if (
    !fileReferenceValue ||
    typeof fileReferenceValue !== "object" ||
    Array.isArray(fileReferenceValue)
  ) {
    throw new CurseForgeRequestValidationError(fieldPath, fileReferenceValue, "a file reference object");
  }

  const fileReferenceRecord = fileReferenceValue as Record<string, unknown>;

  return {
    projectId: parsePositiveInt32(fileReferenceRecord.projectId, `${fieldPath}.projectId`),
    fileId: parsePositiveInt32(fileReferenceRecord.fileId, `${fieldPath}.fileId`),
  };
}

function parsePositiveInt32(value: unknown, fieldPath: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > maxCurseForgeInt32Id
  ) {
    throw new CurseForgeRequestValidationError(
      fieldPath,
      value,
      `a positive integer no larger than ${maxCurseForgeInt32Id}`,
    );
  }

  return value;
}
