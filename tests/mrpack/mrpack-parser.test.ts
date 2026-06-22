import { describe, expect, test } from "vitest";
import JSZip from "jszip";

import {
  collectOverrideFiles,
  loadMrpackArchive,
  parseModrinthIndexJson,
  readModrinthIndex,
} from "@/lib/mrpack/mrpack-parser";

describe("readModrinthIndex", () => {
  test("fails when modrinth.index.json is missing", async () => {
    const archive = new JSZip();
    archive.file("overrides/config/a.toml", "enabled = true");

    await expect(readModrinthIndex(archive)).rejects.toThrow("modrinth.index.json");
  });
});

describe("parseModrinthIndexJson", () => {
  test("fails for invalid JSON", () => {
    expect(() => parseModrinthIndexJson("{")).toThrow("modrinth.index.json");
  });

  test("fails when files is not an array", () => {
    expect(() => parseModrinthIndexJson(JSON.stringify({ name: "Demo", files: {} }))).toThrow("files");
  });

  test("fails fast when the manifest lists more than 3000 files", () => {
    const files = Array.from({ length: 3001 }, (_, fileIndex) => ({
      path: `mods/mod-${fileIndex}.jar`,
      downloads: [`https://cdn.example.com/mod-${fileIndex}.jar`],
    }));

    expect(() => parseModrinthIndexJson(JSON.stringify({ name: "Demo", files }))).toThrow("3001");
  });

  test("fails fast when a referenced fileSize is not a non-negative safe integer", () => {
    expect(() =>
      parseModrinthIndexJson(
        JSON.stringify({
          name: "Demo",
          files: [
            {
              path: "mods/demo.jar",
              downloads: ["https://cdn.example.com/demo.jar"],
              fileSize: "6",
            },
          ],
        }),
      ),
    ).toThrow(/mods\/demo\.jar.*fileSize.*6/);
  });

  test("fails fast when hashes is not an object", () => {
    expect(() =>
      parseModrinthIndexJson(
        JSON.stringify({
          name: "Demo",
          files: [
            {
              path: "mods/demo.jar",
              downloads: ["https://cdn.example.com/demo.jar"],
              hashes: "sha512",
            },
          ],
        }),
      ),
    ).toThrow(/mods\/demo\.jar.*hashes.*sha512/);
  });

  test("fails fast when sha512 is malformed", () => {
    expect(() =>
      parseModrinthIndexJson(
        JSON.stringify({
          name: "Demo",
          files: [
            {
              path: "mods/demo.jar",
              downloads: ["https://cdn.example.com/demo.jar"],
              hashes: { sha512: "not-a-sha512" },
            },
          ],
        }),
      ),
    ).toThrow(/mods\/demo\.jar.*sha512.*not-a-sha512/);
  });

  test("fails fast when sha1 is malformed", () => {
    expect(() =>
      parseModrinthIndexJson(
        JSON.stringify({
          name: "Demo",
          files: [
            {
              path: "mods/demo.jar",
              downloads: ["https://cdn.example.com/demo.jar"],
              hashes: { sha1: 123 },
            },
          ],
        }),
      ),
    ).toThrow(/mods\/demo\.jar.*sha1.*123/);
  });
});

describe("collectOverrideFiles", () => {
  test("normalizes override paths and skips directories", async () => {
    const sourceArchive = new JSZip();
    sourceArchive.folder("overrides/config");
    sourceArchive.file("overrides/config/a.toml", "enabled = true");
    sourceArchive.file("mods/not-an-override.jar", "jar");

    const overrideFiles = await collectOverrideFiles(sourceArchive);

    expect(overrideFiles).toHaveLength(1);
    expect(overrideFiles[0]).toMatchObject({
      sourcePath: "overrides/config/a.toml",
      outputPath: "config/a.toml",
    });
    expect(await overrideFiles[0].content.arrayBuffer()).toEqual(
      await new Blob(["enabled = true"]).arrayBuffer(),
    );
  });
});

describe("loadMrpackArchive", () => {
  test("loads an in-memory mrpack archive", async () => {
    const sourceArchive = new JSZip();
    sourceArchive.file("modrinth.index.json", JSON.stringify({ files: [] }));
    const archiveBuffer = await sourceArchive.generateAsync({ type: "arraybuffer" });

    const loadedArchive = await loadMrpackArchive(archiveBuffer);

    expect(await loadedArchive.file("modrinth.index.json")?.async("string")).toBe('{"files":[]}');
  });
});
