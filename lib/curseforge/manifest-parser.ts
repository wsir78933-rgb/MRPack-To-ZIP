import { ConversionError, conversionErrorCodes } from "../mrpack/errors";
import { validateArchivePath } from "../mrpack/path-safety";

export type CurseForgeModLoader = {
  id: string;
  primary: boolean;
};

export type CurseForgeManifestFile = {
  projectId: number;
  fileId: number;
  required: boolean;
};

export type CurseForgeManifest = {
  manifestType: "minecraftModpack";
  manifestVersion: 1;
  name?: string;
  version?: string;
  author?: string;
  minecraft: {
    version: string;
    modLoaders: CurseForgeModLoader[];
  };
  primaryModLoader: CurseForgeModLoader;
  files: CurseForgeManifestFile[];
  overrides: string;
};

export function parseCurseForgeManifestJson(manifestJsonText: string): CurseForgeManifest {
  let manifestValue: unknown;

  try {
    manifestValue = JSON.parse(manifestJsonText);
  } catch (caughtError) {
    throw new ConversionError(
      conversionErrorCodes.invalidInput,
      `Invalid CurseForge manifest.json JSON: ${manifestJsonText}`,
      caughtError,
    );
  }

  if (!isPlainRecord(manifestValue)) {
    throw createManifestValidationError("root", "manifest object", manifestValue);
  }

  return parseCurseForgeManifestRecord(manifestValue);
}

function parseCurseForgeManifestRecord(
  manifestRecord: Record<string, unknown>,
): CurseForgeManifest {
  if (manifestRecord.manifestType !== "minecraftModpack") {
    throw createManifestValidationError(
      "manifestType",
      "minecraftModpack",
      manifestRecord.manifestType,
    );
  }

  if (manifestRecord.manifestVersion !== 1) {
    throw createManifestValidationError("manifestVersion", "1", manifestRecord.manifestVersion);
  }

  const minecraft = parseMinecraft(manifestRecord.minecraft);
  const primaryModLoader = findPrimaryModLoader(minecraft.modLoaders);

  return {
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    name: parseOptionalString(manifestRecord.name, "name"),
    version: parseOptionalString(manifestRecord.version, "version"),
    author: parseOptionalString(manifestRecord.author, "author"),
    minecraft,
    primaryModLoader,
    files: parseFiles(manifestRecord.files),
    overrides: parseOverrides(manifestRecord.overrides),
  };
}

function parseMinecraft(minecraftValue: unknown) {
  if (!isPlainRecord(minecraftValue)) {
    throw createManifestValidationError("minecraft", "minecraft object", minecraftValue);
  }

  return {
    version: parseRequiredString(minecraftValue.version, "minecraft.version"),
    modLoaders: parseModLoaders(minecraftValue.modLoaders),
  };
}

function parseModLoaders(modLoadersValue: unknown): CurseForgeModLoader[] {
  if (!Array.isArray(modLoadersValue) || modLoadersValue.length === 0) {
    throw createManifestValidationError(
      "minecraft.modLoaders",
      "non-empty mod loader array",
      modLoadersValue,
    );
  }

  return modLoadersValue.map((modLoaderValue, modLoaderIndex) =>
    parseModLoader(modLoaderValue, `minecraft.modLoaders[${modLoaderIndex}]`),
  );
}

function parseModLoader(modLoaderValue: unknown, fieldPath: string): CurseForgeModLoader {
  if (!isPlainRecord(modLoaderValue)) {
    throw createManifestValidationError(fieldPath, "mod loader object", modLoaderValue);
  }

  if (typeof modLoaderValue.primary !== "boolean") {
    throw createManifestValidationError(
      `${fieldPath}.primary`,
      "boolean",
      modLoaderValue.primary,
    );
  }

  return {
    id: parseRequiredString(modLoaderValue.id, `${fieldPath}.id`),
    primary: modLoaderValue.primary,
  };
}

function findPrimaryModLoader(modLoaders: CurseForgeModLoader[]) {
  const primaryModLoaders = modLoaders.filter((modLoader) => modLoader.primary);

  if (primaryModLoaders.length !== 1) {
    throw createManifestValidationError(
      "minecraft.modLoaders.primary",
      "exactly one primary mod loader",
      modLoaders,
    );
  }

  return primaryModLoaders[0];
}

function parseFiles(filesValue: unknown): CurseForgeManifestFile[] {
  if (!Array.isArray(filesValue)) {
    throw createManifestValidationError("files", "files array", filesValue);
  }

  return filesValue.map((fileValue, fileIndex) =>
    parseFile(fileValue, `files[${fileIndex}]`),
  );
}

function parseFile(fileValue: unknown, fieldPath: string): CurseForgeManifestFile {
  if (!isPlainRecord(fileValue)) {
    throw createManifestValidationError(fieldPath, "file object", fileValue);
  }

  return {
    projectId: parsePositiveSafeInteger(fileValue.projectID, `${fieldPath}.projectID`),
    fileId: parsePositiveSafeInteger(fileValue.fileID, `${fieldPath}.fileID`),
    required: parseRequiredBoolean(fileValue.required, `${fieldPath}.required`),
  };
}

function parseOverrides(overridesValue: unknown) {
  const overridesPath = parseRequiredString(overridesValue, "overrides");

  try {
    return validateArchivePath(overridesPath);
  } catch (caughtError) {
    throw createManifestValidationError("overrides", "safe relative archive path", overridesValue, caughtError);
  }
}

function parseOptionalString(value: unknown, fieldPath: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createManifestValidationError(fieldPath, "non-blank string", value);
  }

  return value.trim().length === 0 ? undefined : value;
}

function parseRequiredString(value: unknown, fieldPath: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createManifestValidationError(fieldPath, "non-blank string", value);
  }

  return value;
}

function parseRequiredBoolean(value: unknown, fieldPath: string) {
  if (typeof value !== "boolean") {
    throw createManifestValidationError(fieldPath, "boolean", value);
  }

  return value;
}

function parsePositiveSafeInteger(value: unknown, fieldPath: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw createManifestValidationError(fieldPath, "positive safe integer", value);
  }

  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createManifestValidationError(
  fieldPath: string,
  expectedDescription: string,
  problemValue: unknown,
  cause?: unknown,
) {
  return new ConversionError(
    conversionErrorCodes.invalidInput,
    `Invalid CurseForge manifest.json at ${fieldPath}: ${formatProblemValue(problemValue)}. Expected ${expectedDescription}.`,
    cause,
    { expectedDescription, fieldPath },
    { problemValue },
  );
}

function formatProblemValue(problemValue: unknown) {
  if (problemValue === undefined) {
    return "undefined";
  }

  const jsonText = JSON.stringify(problemValue);
  return jsonText === undefined ? String(problemValue) : jsonText;
}
