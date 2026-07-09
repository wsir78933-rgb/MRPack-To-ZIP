import JSZip from "jszip";
import { describe, expect, test } from "vitest";

import {
  runZipToMrpackConversionWorkflow,
  type ZipToMrpackConversionProgress,
} from "@/lib/zip-to-mrpack/conversion-workflow";
import { conversionErrorCodes } from "@/lib/mrpack/errors";

async function createCurseForgeZipBuffer() {
  const curseForgeZip = new JSZip();
  curseForgeZip.file(
    "manifest.json",
    JSON.stringify({
      minecraft: {
        version: "1.20.1",
        modLoaders: [{ id: "forge-47.2.0", primary: true }],
      },
      manifestType: "minecraftModpack",
      manifestVersion: 1,
      name: "Demo Pack",
      version: "1.0.0",
      author: "Demo Author",
      files: [
        { projectID: 111, fileID: 222, required: true },
        { projectID: 333, fileID: 444, required: true },
      ],
      overrides: "overrides",
    }),
  );
  curseForgeZip.file("overrides/config/demo.toml", "enabled = true");

  return curseForgeZip.generateAsync({ type: "arraybuffer" });
}

describe("runZipToMrpackConversionWorkflow", () => {
  test("converts a CurseForge manifest-only ZIP into an MRPack with matched and bundled files", async () => {
    const curseForgeZipBuffer = await createCurseForgeZipBuffer();
    const observedProgressEvents: ZipToMrpackConversionProgress[] = [];
    const fetchLike = async (url: string, init?: RequestInit) => {
      if (url === "/api/curseforge/files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          files: [
            {
              modId: 111,
              fileId: 222,
              fileName: "matched.jar",
              fileLength: 10,
              downloadUrl: "https://edge.forgecdn.net/files/222/matched.jar",
              hashes: [{ value: "sha1-matched", algo: 1 }],
              isAvailable: true,
            },
            {
              modId: 333,
              fileId: 444,
              fileName: "curse-only.jar",
              fileLength: 15,
              downloadUrl: "https://edge.forgecdn.net/files/444/curse-only.jar",
              hashes: [{ value: "sha1-curse-only", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      if (url === "https://api.modrinth.com/v2/version_files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          "sha1-matched": {
            files: [
              {
                filename: "matched.jar",
                url: "https://cdn.modrinth.com/data/demo/versions/matched.jar",
                size: 10,
                hashes: {
                  sha1: "sha1-matched",
                  sha512: "sha512-matched",
                },
              },
            ],
          },
        });
      }

      if (url === "/api/curseforge/download") {
        expect(init?.body).toBe(JSON.stringify({ projectId: 333, fileId: 444 }));
        return new Response("curse-only bytes");
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    };

    const conversionResult = await runZipToMrpackConversionWorkflow({
      selectedFile: {
        name: "demo-pack.zip",
        size: curseForgeZipBuffer.byteLength,
        arrayBuffer: async () => curseForgeZipBuffer,
      },
      fetchLike,
      onProgressChange: (progress) => observedProgressEvents.push(progress),
    });

    expect(conversionResult.outputMrpackFileName).toBe("demo-pack.mrpack");
    expect(conversionResult.matchedFileCount).toBe(1);
    expect(conversionResult.bundledFileCount).toBe(1);
    expect(observedProgressEvents).toEqual([
      { stage: "reading-zip", percent: 10 },
      { stage: "reading-manifest", percent: 22 },
      { stage: "resolving-curseforge-files", percent: 38 },
      { stage: "matching-modrinth-files", percent: 58 },
      {
        stage: "downloading-curseforge-files",
        percent: 65,
        currentFileCount: 0,
        totalFileCount: 1,
      },
      {
        stage: "downloading-curseforge-files",
        percent: 85,
        currentFileCount: 1,
        totalFileCount: 1,
      },
      { stage: "building-mrpack", percent: 90 },
    ]);
    expect(
      observedProgressEvents.every((progressEvent) => Number.isFinite(progressEvent.percent)),
    ).toBe(true);

    const mrpackArchive = await JSZip.loadAsync(await conversionResult.outputMrpackBlob.arrayBuffer());
    const indexJsonText = await mrpackArchive.file("modrinth.index.json")?.async("string");
    const modrinthIndex = JSON.parse(indexJsonText ?? "{}");

    expect(modrinthIndex).toMatchObject({
      formatVersion: 1,
      game: "minecraft",
      name: "Demo Pack",
      versionId: "1.0.0",
      dependencies: {
        minecraft: "1.20.1",
        forge: "47.2.0",
      },
      files: [
        {
          path: "mods/matched.jar",
          downloads: ["https://cdn.modrinth.com/data/demo/versions/matched.jar"],
          hashes: {
            sha1: "sha1-matched",
            sha512: "sha512-matched",
          },
          fileSize: 10,
        },
      ],
    });
    await expect(mrpackArchive.file("overrides/config/demo.toml")?.async("string")).resolves.toBe(
      "enabled = true",
    );
    await expect(mrpackArchive.file("overrides/mods/curse-only.jar")?.async("string")).resolves.toBe(
      "curse-only bytes",
    );
  });

  test("does not report CurseForge-only file counts when every manifest file is matched by Modrinth", async () => {
    const curseForgeZipBuffer = await createCurseForgeZipBuffer();
    const observedProgressEvents: ZipToMrpackConversionProgress[] = [];
    const fetchLike = async (url: string, init?: RequestInit) => {
      if (url === "/api/curseforge/files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          files: [
            {
              modId: 111,
              fileId: 222,
              fileName: "matched-one.jar",
              fileLength: 10,
              downloadUrl: "https://edge.forgecdn.net/files/222/matched-one.jar",
              hashes: [{ value: "sha1-matched-one", algo: 1 }],
              isAvailable: true,
            },
            {
              modId: 333,
              fileId: 444,
              fileName: "matched-two.jar",
              fileLength: 15,
              downloadUrl: "https://edge.forgecdn.net/files/444/matched-two.jar",
              hashes: [{ value: "sha1-matched-two", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      if (url === "https://api.modrinth.com/v2/version_files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          "sha1-matched-one": {
            files: [
              {
                filename: "matched-one.jar",
                url: "https://cdn.modrinth.com/data/demo/versions/matched-one.jar",
                size: 10,
                hashes: {
                  sha1: "sha1-matched-one",
                  sha512: "sha512-matched-one",
                },
              },
            ],
          },
          "sha1-matched-two": {
            files: [
              {
                filename: "matched-two.jar",
                url: "https://cdn.modrinth.com/data/demo/versions/matched-two.jar",
                size: 15,
                hashes: {
                  sha1: "sha1-matched-two",
                  sha512: "sha512-matched-two",
                },
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    };

    const conversionResult = await runZipToMrpackConversionWorkflow({
      selectedFile: {
        name: "all-matched.zip",
        size: curseForgeZipBuffer.byteLength,
        arrayBuffer: async () => curseForgeZipBuffer,
      },
      fetchLike,
      onProgressChange: (progress) => observedProgressEvents.push(progress),
    });

    expect(conversionResult.matchedFileCount).toBe(2);
    expect(conversionResult.bundledFileCount).toBe(0);
    expect(observedProgressEvents.map((progressEvent) => progressEvent.stage)).toEqual([
      "reading-zip",
      "reading-manifest",
      "resolving-curseforge-files",
      "matching-modrinth-files",
      "building-mrpack",
    ]);
    expect(
      observedProgressEvents.every((progressEvent) => Number.isFinite(progressEvent.percent)),
    ).toBe(true);
    expect(
      observedProgressEvents.some(
        (progressEvent) =>
          progressEvent.currentFileCount !== undefined ||
          progressEvent.totalFileCount !== undefined,
      ),
    ).toBe(false);
  });

  test("matches an unavailable CurseForge file through Modrinth before falling back to download", async () => {
    const curseForgeZipBuffer = await createCurseForgeZipBuffer();
    const downloadRequestBodies: string[] = [];
    const fetchLike = async (url: string, init?: RequestInit) => {
      if (url === "/api/curseforge/files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          files: [
            {
              modId: 111,
              fileId: 222,
              fileName: "SodiumTranslations.zip",
              fileLength: 158836,
              downloadUrl: null,
              hashes: [{ value: "sha1-unavailable-matched", algo: 1 }],
              isAvailable: false,
            },
            {
              modId: 333,
              fileId: 444,
              fileName: "matched-two.jar",
              fileLength: 15,
              downloadUrl: "https://edge.forgecdn.net/files/444/matched-two.jar",
              hashes: [{ value: "sha1-matched-two", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      if (url === "https://api.modrinth.com/v2/version_files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          "sha1-unavailable-matched": {
            files: [
              {
                filename: "SodiumTranslations.zip",
                url: "https://cdn.modrinth.com/data/demo/versions/SodiumTranslations.zip",
                size: 158836,
                hashes: {
                  sha1: "sha1-unavailable-matched",
                  sha512: "sha512-unavailable-matched",
                },
              },
            ],
          },
          "sha1-matched-two": {
            files: [
              {
                filename: "matched-two.jar",
                url: "https://cdn.modrinth.com/data/demo/versions/matched-two.jar",
                size: 15,
                hashes: {
                  sha1: "sha1-matched-two",
                  sha512: "sha512-matched-two",
                },
              },
            ],
          },
        });
      }

      if (url === "/api/curseforge/download") {
        downloadRequestBodies.push(String(init?.body));
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    };

    const conversionResult = await runZipToMrpackConversionWorkflow({
      selectedFile: {
        name: "unavailable-matched.zip",
        size: curseForgeZipBuffer.byteLength,
        arrayBuffer: async () => curseForgeZipBuffer,
      },
      fetchLike,
    });

    expect(conversionResult.matchedFileCount).toBe(2);
    expect(conversionResult.bundledFileCount).toBe(0);
    expect(downloadRequestBodies).toEqual([]);

    const mrpackArchive = await JSZip.loadAsync(await conversionResult.outputMrpackBlob.arrayBuffer());
    const indexJsonText = await mrpackArchive.file("modrinth.index.json")?.async("string");
    const modrinthIndex = JSON.parse(indexJsonText ?? "{}");

    expect(modrinthIndex.files).toContainEqual({
      path: "mods/SodiumTranslations.zip",
      downloads: ["https://cdn.modrinth.com/data/demo/versions/SodiumTranslations.zip"],
      hashes: {
        sha1: "sha1-unavailable-matched",
        sha512: "sha512-unavailable-matched",
      },
      env: {
        client: "required",
        server: "required",
      },
      fileSize: 158836,
    });
  });

  test("bundles an unavailable CurseForge file when Modrinth has no matching SHA-1", async () => {
    const curseForgeZipBuffer = await createCurseForgeZipBuffer();
    const downloadRequestBodies: string[] = [];
    const fetchLike = async (url: string, init?: RequestInit) => {
      if (url === "/api/curseforge/files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          files: [
            {
              modId: 111,
              fileId: 222,
              fileName: "unavailable-curse-only.jar",
              fileLength: 10,
              downloadUrl: "https://edge.forgecdn.net/files/222/unavailable-curse-only.jar",
              hashes: [{ value: "sha1-unavailable-curse-only", algo: 1 }],
              isAvailable: false,
            },
            {
              modId: 333,
              fileId: 444,
              fileName: "matched-two.jar",
              fileLength: 15,
              downloadUrl: "https://edge.forgecdn.net/files/444/matched-two.jar",
              hashes: [{ value: "sha1-matched-two", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      if (url === "https://api.modrinth.com/v2/version_files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          "sha1-matched-two": {
            files: [
              {
                filename: "matched-two.jar",
                url: "https://cdn.modrinth.com/data/demo/versions/matched-two.jar",
                size: 15,
                hashes: {
                  sha1: "sha1-matched-two",
                  sha512: "sha512-matched-two",
                },
              },
            ],
          },
        });
      }

      if (url === "/api/curseforge/download") {
        downloadRequestBodies.push(String(init?.body));
        return new Response("unavailable curse-only bytes");
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    };

    const conversionResult = await runZipToMrpackConversionWorkflow({
      selectedFile: {
        name: "unavailable-curse-only.zip",
        size: curseForgeZipBuffer.byteLength,
        arrayBuffer: async () => curseForgeZipBuffer,
      },
      fetchLike,
    });

    expect(conversionResult.matchedFileCount).toBe(1);
    expect(conversionResult.bundledFileCount).toBe(1);
    expect(downloadRequestBodies).toEqual([JSON.stringify({ projectId: 111, fileId: 222 })]);

    const mrpackArchive = await JSZip.loadAsync(await conversionResult.outputMrpackBlob.arrayBuffer());
    await expect(
      mrpackArchive.file("overrides/mods/unavailable-curse-only.jar")?.async("string"),
    ).resolves.toBe("unavailable curse-only bytes");
  });

  test("converts a CurseForge ZIP with an empty files list without fake download counts", async () => {
    const curseForgeZip = new JSZip();
    curseForgeZip.file(
      "manifest.json",
      JSON.stringify({
        minecraft: {
          version: "1.20.1",
          modLoaders: [{ id: "forge-47.2.0", primary: true }],
        },
        manifestType: "minecraftModpack",
        manifestVersion: 1,
        name: "Empty Pack",
        version: "1.0.0",
        author: "Demo Author",
        files: [],
        overrides: "overrides",
      }),
    );
    const curseForgeZipBuffer = await curseForgeZip.generateAsync({ type: "arraybuffer" });
    const observedProgressEvents: ZipToMrpackConversionProgress[] = [];
    const fetchRequestBodies: string[] = [];
    const fetchLike = async (url: string, init?: RequestInit) => {
      fetchRequestBodies.push(String(init?.body));

      if (url === "/api/curseforge/files") {
        return Response.json({ files: [] });
      }

      if (url === "https://api.modrinth.com/v2/version_files") {
        return Response.json({});
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    };

    const conversionResult = await runZipToMrpackConversionWorkflow({
      selectedFile: {
        name: "empty-pack.zip",
        size: curseForgeZipBuffer.byteLength,
        arrayBuffer: async () => curseForgeZipBuffer,
      },
      fetchLike,
      onProgressChange: (progress) => observedProgressEvents.push(progress),
    });

    expect(conversionResult.referencedFileCount).toBe(0);
    expect(conversionResult.matchedFileCount).toBe(0);
    expect(conversionResult.bundledFileCount).toBe(0);
    expect(fetchRequestBodies).toEqual([
      JSON.stringify({ fileReferences: [] }),
      JSON.stringify({ hashes: [], algorithm: "sha1" }),
    ]);
    expect(observedProgressEvents.map((progressEvent) => progressEvent.stage)).toEqual([
      "reading-zip",
      "reading-manifest",
      "resolving-curseforge-files",
      "matching-modrinth-files",
      "building-mrpack",
    ]);
    expect(
      observedProgressEvents.some(
        (progressEvent) =>
          progressEvent.currentFileCount !== undefined ||
          progressEvent.totalFileCount !== undefined,
      ),
    ).toBe(false);
  });

  test("reports processed CurseForge-only file counts before a download failure is thrown", async () => {
    const curseForgeZipBuffer = await createCurseForgeZipBuffer();
    const observedProgressEvents: ZipToMrpackConversionProgress[] = [];
    const downloadRequestBodies: string[] = [];
    const fetchLike = async (url: string, init?: RequestInit) => {
      if (url === "/api/curseforge/files") {
        expect(init?.method).toBe("POST");
        return Response.json({
          files: [
            {
              modId: 111,
              fileId: 222,
              fileName: "curse-only-one.jar",
              fileLength: 10,
              downloadUrl: "https://edge.forgecdn.net/files/222/curse-only-one.jar",
              hashes: [{ value: "sha1-curse-only-one", algo: 1 }],
              isAvailable: true,
            },
            {
              modId: 333,
              fileId: 444,
              fileName: "curse-only-two.jar",
              fileLength: 15,
              downloadUrl: "https://edge.forgecdn.net/files/444/curse-only-two.jar",
              hashes: [{ value: "sha1-curse-only-two", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      if (url === "https://api.modrinth.com/v2/version_files") {
        expect(init?.method).toBe("POST");
        return Response.json({});
      }

      if (url === "/api/curseforge/download") {
        const requestBodyText = String(init?.body);
        downloadRequestBodies.push(requestBodyText);

        if (requestBodyText === JSON.stringify({ projectId: 111, fileId: 222 })) {
          return new Response("curse-only-one bytes");
        }

        if (requestBodyText === JSON.stringify({ projectId: 333, fileId: 444 })) {
          return Response.json(
            { error: "CurseForge mirror is unavailable" },
            { status: 502, statusText: "Bad Gateway" },
          );
        }
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    };

    await expect(
      runZipToMrpackConversionWorkflow({
        selectedFile: {
          name: "download-failure.zip",
          size: curseForgeZipBuffer.byteLength,
          arrayBuffer: async () => curseForgeZipBuffer,
        },
        fetchLike,
        onProgressChange: (progress) => observedProgressEvents.push(progress),
      }),
    ).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/download",
        routeReason: "legacy_route_error",
        status: 502,
      },
      details: {
        error: "CurseForge mirror is unavailable",
      },
    });

    expect(downloadRequestBodies).toEqual([
      JSON.stringify({ projectId: 111, fileId: 222 }),
      JSON.stringify({ projectId: 333, fileId: 444 }),
    ]);
    expect(
      observedProgressEvents.filter(
        (progressEvent) => progressEvent.stage === "downloading-curseforge-files",
      ),
    ).toEqual([
      {
        stage: "downloading-curseforge-files",
        percent: 65,
        currentFileCount: 0,
        totalFileCount: 2,
      },
      {
        stage: "downloading-curseforge-files",
        percent: 75,
        currentFileCount: 1,
        totalFileCount: 2,
      },
      {
        stage: "downloading-curseforge-files",
        percent: 85,
        currentFileCount: 2,
        totalFileCount: 2,
      },
    ]);
    expect(observedProgressEvents.at(-1)?.stage).toBe("downloading-curseforge-files");
  });
});
