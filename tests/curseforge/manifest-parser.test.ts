import { describe, expect, test } from "vitest";

import { parseCurseForgeManifestJson } from "@/lib/curseforge/manifest-parser";

function createValidManifest(overrides = "overrides") {
  return {
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    name: "Demo Pack",
    version: "1.0.0",
    author: "Example Author",
    minecraft: {
      version: "1.20.1",
      modLoaders: [
        { id: "fabric-loader-0.15.11", primary: true },
        { id: "forge-47.2.0", primary: false },
      ],
    },
    files: [
      { projectID: 306612, fileID: 5257532, required: true },
      { projectID: 238222, fileID: 5143950, required: false },
    ],
    overrides,
  };
}

describe("parseCurseForgeManifestJson", () => {
  test("parses the required CurseForge minecraftModpack manifest fields", () => {
    const manifest = parseCurseForgeManifestJson(JSON.stringify(createValidManifest()));

    expect(manifest).toEqual({
      manifestType: "minecraftModpack",
      manifestVersion: 1,
      name: "Demo Pack",
      version: "1.0.0",
      author: "Example Author",
      minecraft: {
        version: "1.20.1",
        modLoaders: [
          { id: "fabric-loader-0.15.11", primary: true },
          { id: "forge-47.2.0", primary: false },
        ],
      },
      primaryModLoader: { id: "fabric-loader-0.15.11", primary: true },
      files: [
        { projectId: 306612, fileId: 5257532, required: true },
        { projectId: 238222, fileId: 5143950, required: false },
      ],
      overrides: "overrides",
    });
  });

  test("normalizes a blank optional author to undefined", () => {
    const manifest = parseCurseForgeManifestJson(
      JSON.stringify({
        ...createValidManifest(),
        author: "",
      }),
    );

    expect(manifest.author).toBeUndefined();
  });

  test.each([
    ["manifestType", { manifestType: "notMinecraft" }, /manifestType.*notMinecraft/],
    ["manifestVersion", { manifestVersion: 2 }, /manifestVersion.*2/],
    ["minecraft.version", { minecraft: { version: "", modLoaders: [{ id: "forge-47.2.0", primary: true }] } }, /minecraft\.version/],
    ["minecraft.modLoaders", { minecraft: { version: "1.20.1", modLoaders: [] } }, /minecraft\.modLoaders.*\[\]/],
    ["files[0].projectID", { files: [{ projectID: "306612", fileID: 5257532, required: true }] }, /files\[0\]\.projectID.*306612/],
    ["files[0].fileID", { files: [{ projectID: 306612, fileID: -1, required: true }] }, /files\[0\]\.fileID.*-1/],
    ["files[0].required", { files: [{ projectID: 306612, fileID: 5257532, required: "yes" }] }, /files\[0\]\.required.*yes/],
    ["overrides", { overrides: "../overrides" }, /overrides.*\.\.\/overrides/],
  ])("fails fast when %s is invalid", (_fieldName, manifestPatch, expectedError) => {
    expect(() =>
      parseCurseForgeManifestJson(
        JSON.stringify({
          ...createValidManifest(),
          ...manifestPatch,
        }),
      ),
    ).toThrow(expectedError);
  });

  test("fails fast when no mod loader is marked primary", () => {
    expect(() =>
      parseCurseForgeManifestJson(
        JSON.stringify({
          ...createValidManifest(),
          minecraft: {
            version: "1.20.1",
            modLoaders: [{ id: "forge-47.2.0", primary: false }],
          },
        }),
      ),
    ).toThrow(/primary.*forge-47\.2\.0/);
  });
});
