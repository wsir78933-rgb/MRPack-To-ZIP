import { describe, expect, test } from "vitest";

import { createModrinthIndex } from "@/lib/zip-to-mrpack/modrinth-index-builder";
import type { CurseForgeManifest } from "@/lib/curseforge/manifest-parser";

function createCurseForgeManifest(): CurseForgeManifest {
  return {
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    name: "Demo Pack",
    version: "1.0.0",
    minecraft: {
      version: "1.20.1",
      modLoaders: [{ id: "fabric-loader-0.15.11", primary: true }],
    },
    primaryModLoader: { id: "fabric-loader-0.15.11", primary: true },
    files: [{ projectId: 306612, fileId: 5257532, required: true }],
    overrides: "overrides",
  };
}

describe("createModrinthIndex", () => {
  test("creates a Modrinth index from matched CurseForge files", () => {
    const index = createModrinthIndex({
      curseForgeManifest: createCurseForgeManifest(),
      matchedModrinthFiles: [
        {
          curseForgeProjectId: 306612,
          curseForgeFileId: 5257532,
          path: "mods/fabric-api.jar",
          downloads: ["https://cdn.modrinth.com/data/P7dR8mSH/versions/demo/fabric-api.jar"],
          hashes: {
            sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
            sha512:
              "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
          },
          fileSize: 12345,
        },
      ],
    });

    expect(index).toEqual({
      formatVersion: 1,
      game: "minecraft",
      name: "Demo Pack",
      versionId: "1.0.0",
      dependencies: {
        minecraft: "1.20.1",
        "fabric-loader": "0.15.11",
      },
      files: [
        {
          path: "mods/fabric-api.jar",
          downloads: ["https://cdn.modrinth.com/data/P7dR8mSH/versions/demo/fabric-api.jar"],
          hashes: {
            sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
            sha512:
              "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
          },
          env: {
            client: "required",
            server: "required",
          },
          fileSize: 12345,
        },
      ],
    });
  });

  test("fails fast when a matched Modrinth file path is unsafe", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "../mods/fabric-api.jar",
            downloads: ["https://cdn.modrinth.com/data/P7dR8mSH/versions/demo/fabric-api.jar"],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow("../mods/fabric-api.jar");
  });

  test.each([
    ["missing name", { name: undefined }, { name: "Converted Pack", versionId: "1.0.0" }],
    ["blank name", { name: " " }, { name: "Converted Pack", versionId: "1.0.0" }],
    ["missing version", { version: undefined }, { name: "Demo Pack", versionId: "1.0.0" }],
    ["blank version", { version: " " }, { name: "Demo Pack", versionId: "1.0.0" }],
  ])("uses fallback metadata when the CurseForge manifest has %s", (_caseName, manifestPatch, expectedMetadata) => {
    const index = createModrinthIndex({
      curseForgeManifest: {
        ...createCurseForgeManifest(),
        ...manifestPatch,
      },
      matchedModrinthFiles: [],
    });

    expect(index.name).toBe(expectedMetadata.name);
    expect(index.versionId).toBe(expectedMetadata.versionId);
  });

  test("fails fast when a matched file is missing required sha512", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/fabric-api.jar",
            downloads: ["https://cdn.modrinth.com/data/P7dR8mSH/versions/demo/fabric-api.jar"],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
            },
          },
        ],
      }),
    ).toThrow(/sha512.*undefined/);
  });

  test("fails fast when a matched file is missing required sha1", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/fabric-api.jar",
            downloads: ["https://cdn.modrinth.com/data/P7dR8mSH/versions/demo/fabric-api.jar"],
            hashes: {
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow(/sha1.*undefined/);
  });

  test("fails fast when a matched file has no download URLs", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/fabric-api.jar",
            downloads: [],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow(/downloads.*non-empty/);
  });

  test("fails fast when a matched file download URL is blank", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/fabric-api.jar",
            downloads: [""],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow(/downloads\[0\].*non-blank string/);
  });

  test("fails fast when a matched file download URL is malformed", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/fabric-api.jar",
            downloads: ["not-a-url"],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow(/not-a-url.*HTTPS URL/);
  });

  test("fails fast when a matched file download URL is not HTTPS", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/fabric-api.jar",
            downloads: ["http://cdn.modrinth.com/data/P7dR8mSH/versions/demo/fabric-api.jar"],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow(/http:\/\/cdn\.modrinth\.com.*HTTPS URL/);
  });

  test("fails fast when two matched files resolve to the same index path", () => {
    expect(() =>
      createModrinthIndex({
        curseForgeManifest: createCurseForgeManifest(),
        matchedModrinthFiles: [
          {
            curseForgeProjectId: 306612,
            curseForgeFileId: 5257532,
            path: "mods/shared-name.jar",
            downloads: ["https://cdn.modrinth.com/data/P7dR8mSH/versions/demo/shared-name.jar"],
            hashes: {
              sha1: "36a70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "8f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
          {
            curseForgeProjectId: 999999,
            curseForgeFileId: 111111,
            path: "mods/shared-name.jar",
            downloads: ["https://cdn.modrinth.com/data/example/versions/demo/shared-name.jar"],
            hashes: {
              sha1: "38b70c143c529f542ae48db3697df76f88f5cc20",
              sha512:
                "9f14e45fceea167a5a36dedd4bea2543a2d2f340dff61b5528484f1e2c80a7f6b8721f9490b7ed7dbeac7fbc36c31b2c3eab42a19f9b7205dece7b59e6c8f6a1",
            },
          },
        ],
      }),
    ).toThrow(/Duplicate.*306612\/5257532.*999999\/111111/);
  });
});
