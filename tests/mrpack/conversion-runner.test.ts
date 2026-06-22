import { describe, expect, test } from "vitest";
import JSZip from "jszip";

import * as conversionRunner from "@/lib/mrpack/conversion-runner";

async function createMrpackArchiveBuffer(indexJson: unknown, overrides: Record<string, string> = {}) {
  const mrpackArchive = new JSZip();
  mrpackArchive.file("modrinth.index.json", JSON.stringify(indexJson));

  for (const [archivePath, fileContent] of Object.entries(overrides)) {
    mrpackArchive.file(archivePath, fileContent);
  }

  return mrpackArchive.generateAsync({ type: "arraybuffer" });
}

async function loadOutputZip(outputZip: Blob) {
  return JSZip.loadAsync(await outputZip.arrayBuffer());
}

describe("runMrpackConversionFromArrayBuffer", () => {
  test("builds an output ZIP with overrides, downloaded files, and pack-info.json", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer(
      {
        name: "Demo Pack",
        versionId: "1.0.0",
        dependencies: { minecraft: "1.20.1" },
        files: [
          {
            path: "mods/demo.jar",
            downloads: ["https://cdn.example.com/demo.jar"],
            hashes: { sha1: "f92e777f4341930bad9b2422283c4680d00dbc06" },
            fileSize: 3,
          },
        ],
      },
      { "overrides/config/a.toml": "enabled = true" },
    );
    const fetchLike = async (url: string) =>
      new Response(url === "https://cdn.example.com/demo.jar" ? "jar" : "unexpected", { status: 200 });

    const conversionResult = await conversionRunner.runMrpackConversionFromArrayBuffer(mrpackBuffer, { fetchLike });
    const outputZip = await loadOutputZip(conversionResult.outputZipBlob);

    expect(await outputZip.file("config/a.toml")?.async("string")).toBe("enabled = true");
    expect(await outputZip.file("mods/demo.jar")?.async("string")).toBe("jar");
    expect(outputZip.file("FAILED_DOWNLOADS.txt")).toBeNull();
    expect(conversionResult).toMatchObject({
      packName: "Demo Pack",
      referencedFileCount: 1,
      downloadedFileCount: 1,
      overrideFileCount: 1,
      failedDownloadCount: 0,
    });
    expect(JSON.parse((await outputZip.file("pack-info.json")?.async("string")) ?? "{}")).toMatchObject({
      name: "Demo Pack",
      versionId: "1.0.0",
      minecraftVersion: "1.20.1",
      referencedFileCount: 1,
      overrideFileCount: 1,
      failedDownloadCount: 0,
    });
  });

  test("includes FAILED_DOWNLOADS.txt when a referenced file cannot be downloaded", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer({
      name: "Demo Pack",
      files: [
        {
          path: "mods/missing.jar",
          downloads: ["https://cdn.example.com/missing.jar"],
        },
      ],
    });
    const fetchLike = async () => new Response("not found", { status: 404, statusText: "Not Found" });

    const conversionResult = await conversionRunner.runMrpackConversionFromArrayBuffer(mrpackBuffer, { fetchLike });
    const outputZip = await loadOutputZip(conversionResult.outputZipBlob);

    const failedDownloadsReport = await outputZip.file("FAILED_DOWNLOADS.txt")?.async("string");
    expect(failedDownloadsReport).toContain("mods/missing.jar");
    expect(failedDownloadsReport).toContain("https://cdn.example.com/missing.jar");
    expect(outputZip.file("mods/missing.jar")).toBeNull();
    expect(conversionResult).toMatchObject({
      referencedFileCount: 1,
      downloadedFileCount: 0,
      overrideFileCount: 0,
      failedDownloadCount: 1,
    });
  });

  test("reports referenced file counts while downloading files", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer({
      name: "Progress Pack",
      files: [
        {
          path: "mods/one.jar",
          downloads: ["https://cdn.example.com/one.jar"],
        },
        {
          path: "mods/two.jar",
          downloads: ["https://cdn.example.com/two.jar"],
        },
      ],
    });
    const progressEvents: conversionRunner.ConversionProgress[] = [];
    const fetchLike = async (url: string) => new Response(url, { status: 200 });

    await conversionRunner.runMrpackConversionFromArrayBuffer(mrpackBuffer, {
      fetchLike,
      onProgress: (progressEvent) => progressEvents.push(progressEvent),
    });

    const downloadingProgressEvents = progressEvents.filter(
      (progressEvent) => progressEvent.stage === "downloading-files",
    );
    expect(downloadingProgressEvents[0]).toMatchObject({
      stage: "downloading-files",
      currentFileCount: 0,
      totalFileCount: 2,
      percent: 40,
    });
    expect(downloadingProgressEvents.at(-1)).toMatchObject({
      stage: "downloading-files",
      currentFileCount: 2,
      totalFileCount: 2,
      percent: 85,
    });
  });

  test("reports finite downloading progress when there are no referenced files", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer({
      name: "Empty Pack",
      files: [],
    });
    const progressEvents: conversionRunner.ConversionProgress[] = [];

    await conversionRunner.runMrpackConversionFromArrayBuffer(mrpackBuffer, {
      fetchLike: async () => {
        throw new Error("empty pack should not fetch");
      },
      onProgress: (progressEvent) => progressEvents.push(progressEvent),
    });

    const downloadingProgressEvent = progressEvents.find(
      (progressEvent) => progressEvent.stage === "downloading-files",
    );
    expect(downloadingProgressEvent).toMatchObject({
      stage: "downloading-files",
      currentFileCount: 0,
      totalFileCount: 0,
      percent: 85,
    });
    expect(Number.isFinite(downloadingProgressEvent?.percent)).toBe(true);
  });

  test("rejects an ArrayBuffer mrpack source larger than 100MB before parsing", async () => {
    expect(typeof conversionRunner.assertMrpackSourceSize).toBe("function");

    expect(() =>
      conversionRunner.assertMrpackSourceSize(100 * 1024 * 1024 + 1, "uploaded-pack.mrpack"),
    ).toThrow(/uploaded-pack\.mrpack.*104857601/);

    await expect(
      conversionRunner.runMrpackConversionFromArrayBuffer(new ArrayBuffer(100 * 1024 * 1024 + 1), {
        fetchLike: async () => {
          throw new Error("fetch should not be called");
        },
      }),
    ).rejects.toThrow(/ArrayBuffer upload.*104857601/);
  });

  test.each(["../mods/evil.jar", "C:mods/evil.jar"])(
    "rejects unsafe referenced path %s before any download",
    async (unsafePath) => {
      const mrpackBuffer = await createMrpackArchiveBuffer({
        name: "Unsafe Pack",
        files: [
          {
            path: unsafePath,
            downloads: ["https://cdn.example.com/evil.jar"],
          },
        ],
      });
      let fetchCallCount = 0;

      await expect(
        conversionRunner.runMrpackConversionFromArrayBuffer(mrpackBuffer, {
          fetchLike: async () => {
            fetchCallCount += 1;
            return new Response("evil", { status: 200 });
          },
        }),
      ).rejects.toThrow(JSON.stringify(unsafePath));
      expect(fetchCallCount).toBe(0);
    },
  );
});
