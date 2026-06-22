import { describe, expect, test } from "vitest";

import { buildOutputZip } from "@/lib/mrpack/zip-builder";

describe("buildOutputZip", () => {
  test("validates downloaded file output paths before writing them", async () => {
    await expect(
      buildOutputZip({
        modrinthIndex: { name: "Demo", files: [] },
        overrideFiles: [],
        downloadedFiles: [{ path: "../mods/evil.jar", content: new Blob(["evil"]) }],
        failedDownloads: [],
      }),
    ).rejects.toThrow("../mods/evil.jar");
  });

  test("wraps Blob arrayBuffer failures with the output path", async () => {
    const brokenBlob = {
      arrayBuffer: async () => {
        throw new Error("cannot read blob");
      },
    } as unknown as Blob;

    await expect(
      buildOutputZip({
        modrinthIndex: { name: "Demo", files: [] },
        overrideFiles: [],
        downloadedFiles: [{ path: "mods/demo.jar", content: brokenBlob }],
        failedDownloads: [],
      }),
    ).rejects.toThrow(/mods\/demo\.jar.*cannot read blob/);
  });

  test("fails fast when two downloaded files target the same ZIP path", async () => {
    await expect(
      buildOutputZip({
        modrinthIndex: { name: "Demo", files: [] },
        overrideFiles: [],
        downloadedFiles: [
          { path: "mods/demo.jar", content: new Blob(["first"]) },
          { path: "mods/demo.jar", content: new Blob(["second"]) },
        ],
        failedDownloads: [],
      }),
    ).rejects.toThrow(/Duplicate output ZIP path.*mods\/demo\.jar.*downloaded file/);
  });

  test("fails fast when an override conflicts with a downloaded file path", async () => {
    await expect(
      buildOutputZip({
        modrinthIndex: { name: "Demo", files: [] },
        overrideFiles: [
          {
            sourcePath: "overrides/mods/demo.jar",
            outputPath: "mods/demo.jar",
            content: new Blob(["override"]),
          },
        ],
        downloadedFiles: [{ path: "mods/demo.jar", content: new Blob(["download"]) }],
        failedDownloads: [],
      }),
    ).rejects.toThrow(/Duplicate output ZIP path.*mods\/demo\.jar.*downloaded file/);
  });

  test("fails fast when a downloaded file conflicts with generated pack-info.json", async () => {
    await expect(
      buildOutputZip({
        modrinthIndex: { name: "Demo", files: [] },
        overrideFiles: [],
        downloadedFiles: [{ path: "pack-info.json", content: new Blob(["download"]) }],
        failedDownloads: [],
      }),
    ).rejects.toThrow(/Duplicate output ZIP path.*pack-info\.json.*generated file/);
  });

  test("fails fast when an override conflicts with generated FAILED_DOWNLOADS.txt", async () => {
    await expect(
      buildOutputZip({
        modrinthIndex: { name: "Demo", files: [] },
        overrideFiles: [
          {
            sourcePath: "overrides/FAILED_DOWNLOADS.txt",
            outputPath: "FAILED_DOWNLOADS.txt",
            content: new Blob(["override"]),
          },
        ],
        downloadedFiles: [],
        failedDownloads: [
          {
            path: "mods/missing.jar",
            attemptedUrls: ["https://cdn.example.com/missing.jar"],
            reasons: ["404 Not Found"],
          },
        ],
      }),
    ).rejects.toThrow(/Duplicate output ZIP path.*FAILED_DOWNLOADS\.txt.*generated file/);
  });
});
