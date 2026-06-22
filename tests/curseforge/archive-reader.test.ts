import JSZip from "jszip";
import { describe, expect, test } from "vitest";

import {
  collectCurseForgeOverrideFiles,
  loadCurseForgeZipArchive,
  readCurseForgeManifestJson,
} from "@/lib/curseforge/archive-reader";

function createManifestJson(overrides = "overrides") {
  return JSON.stringify({
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    minecraft: {
      version: "1.20.1",
      modLoaders: [{ id: "forge-47.2.0", primary: true }],
    },
    files: [{ projectID: 306612, fileID: 5257532, required: true }],
    overrides,
  });
}

describe("CurseForge ZIP reader", () => {
  test("loads a CurseForge ZIP and reads manifest.json plus overrides", async () => {
    const sourceZip = new JSZip();
    sourceZip.file("manifest.json", createManifestJson());
    sourceZip.file("overrides/config/demo.toml", "enabled = true");
    sourceZip.file("notes.txt", "not an override");
    const sourceBuffer = await sourceZip.generateAsync({ type: "arraybuffer" });

    const archive = await loadCurseForgeZipArchive(sourceBuffer);
    const manifestJson = await readCurseForgeManifestJson(archive);
    const overrideFiles = await collectCurseForgeOverrideFiles(archive, "overrides");

    expect(manifestJson).toBe(createManifestJson());
    expect(overrideFiles).toHaveLength(1);
    expect(overrideFiles[0]).toMatchObject({
      sourcePath: "overrides/config/demo.toml",
      outputPath: "config/demo.toml",
    });
    expect(await overrideFiles[0].content.text()).toBe("enabled = true");
  });

  test("fails fast when manifest.json is missing", async () => {
    const sourceZip = new JSZip();
    sourceZip.file("overrides/config/demo.toml", "enabled = true");
    const sourceBuffer = await sourceZip.generateAsync({ type: "arraybuffer" });

    const archive = await loadCurseForgeZipArchive(sourceBuffer);

    await expect(readCurseForgeManifestJson(archive)).rejects.toThrow("manifest.json");
  });

  test("validates override archive paths before exposing files", async () => {
    const sourceZip = new JSZip();
    sourceZip.file("manifest.json", createManifestJson());
    sourceZip.file("overrides/config//demo.toml", "enabled = true");
    const sourceBuffer = await sourceZip.generateAsync({ type: "arraybuffer" });

    const archive = await loadCurseForgeZipArchive(sourceBuffer);

    await expect(collectCurseForgeOverrideFiles(archive, "overrides")).rejects.toThrow(
      "overrides/config//demo.toml",
    );
  });
});
