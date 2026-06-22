import JSZip from "jszip";
import { describe, expect, test } from "vitest";

import { buildZipToMrpackArchive, buildZipToMrpackBlob } from "@/lib/zip-to-mrpack/mrpack-builder";
import type { CurseForgeManifest } from "@/lib/curseforge/manifest-parser";

function createCurseForgeManifest(): CurseForgeManifest {
  return {
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    name: "Demo Pack",
    version: "1.0.0",
    minecraft: {
      version: "1.20.1",
      modLoaders: [{ id: "forge-47.2.0", primary: true }],
    },
    primaryModLoader: { id: "forge-47.2.0", primary: true },
    files: [
      { projectId: 306612, fileId: 5257532, required: true },
      { projectId: 238222, fileId: 5143950, required: true },
    ],
    overrides: "overrides",
  };
}

describe("buildZipToMrpackArchive", () => {
  test("writes modrinth.index.json, overrides, and CurseForge-only mods", async () => {
    const mrpackArchive = await buildZipToMrpackArchive({
      curseForgeManifest: createCurseForgeManifest(),
      matchedModrinthFiles: [
        {
          curseForgeProjectId: 306612,
          curseForgeFileId: 5257532,
          path: "mods/matched.jar",
          downloads: ["https://cdn.modrinth.com/data/demo/versions/demo/matched.jar"],
          hashes: {
            sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
            sha512:
              "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
          },
        },
      ],
      curseForgeOnlyFiles: [
        {
          curseForgeProjectId: 238222,
          curseForgeFileId: 5143950,
          fileName: "curseforge-only.jar",
          content: new Blob(["curseforge bytes"]),
        },
      ],
      overrideFiles: [
        {
          sourcePath: "overrides/config/demo.toml",
          outputPath: "config/demo.toml",
          content: new Blob(["enabled = true"]),
        },
      ],
    });

    const indexJson = await mrpackArchive.file("modrinth.index.json")?.async("string");
    expect(JSON.parse(indexJson ?? "")).toMatchObject({
      formatVersion: 1,
      game: "minecraft",
      dependencies: {
        minecraft: "1.20.1",
        forge: "47.2.0",
      },
      files: [
        {
          path: "mods/matched.jar",
          downloads: ["https://cdn.modrinth.com/data/demo/versions/demo/matched.jar"],
          hashes: {
            sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
            sha512:
              "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
          },
        },
      ],
    });

    expect(await mrpackArchive.file("overrides/config/demo.toml")?.async("string")).toBe(
      "enabled = true",
    );
    expect(await mrpackArchive.file("overrides/mods/curseforge-only.jar")?.async("string")).toBe(
      "curseforge bytes",
    );
  });

  test("fails fast when a CurseForge-only file name is unsafe", async () => {
    await expect(
      buildZipToMrpackArchive({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [],
        curseForgeOnlyFiles: [
          {
            curseForgeProjectId: 238222,
            curseForgeFileId: 5143950,
            fileName: "../curseforge-only.jar",
            content: new Blob(["curseforge bytes"]),
          },
        ],
        overrideFiles: [],
      }),
    ).rejects.toThrow("../curseforge-only.jar");
  });
});

describe("buildZipToMrpackBlob", () => {
  test("generates an application/x-modrinth-modpack+zip Blob", async () => {
    const mrpackBlob = await buildZipToMrpackBlob({
      curseForgeManifest: createCurseForgeManifest(),
      matchedModrinthFiles: [],
      curseForgeOnlyFiles: [],
      overrideFiles: [],
    });

    const archive = await JSZip.loadAsync(await mrpackBlob.arrayBuffer());

    expect(mrpackBlob.type).toBe("application/x-modrinth-modpack+zip");
    expect(archive.file("modrinth.index.json")).not.toBeNull();
  });
});
