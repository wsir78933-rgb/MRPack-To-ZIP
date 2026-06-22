import { describe, expect, test } from "vitest";
import JSZip from "jszip";

import {
  downloadMrpackFromProject,
  downloadMrpackFromUrl,
} from "@/lib/mrpack/conversion-source";
import { runMrpackConversionFromArrayBuffer } from "@/lib/mrpack/conversion-runner";

async function createValidMrpackBuffer() {
  const mrpackArchive = new JSZip();
  mrpackArchive.file(
    "modrinth.index.json",
    JSON.stringify({
      name: "Demo Pack",
      versionId: "1.0.0",
      dependencies: { minecraft: "1.20.1" },
      files: [
        {
          path: "mods/demo.jar",
          downloads: ["https://cdn.example.com/demo.jar"],
          fileSize: 3,
        },
      ],
    }),
  );
  mrpackArchive.file("overrides/config/demo.toml", "enabled = true");
  return mrpackArchive.generateAsync({ type: "arraybuffer" });
}

async function expectConvertedZipContainsCoreFiles(mrpackBuffer: ArrayBuffer) {
  const conversionResult = await runMrpackConversionFromArrayBuffer(mrpackBuffer, {
    fetchLike: async (url) => {
      expect(url).toBe("https://cdn.example.com/demo.jar");
      return new Response("jar", { status: 200 });
    },
  });
  const outputZip = await JSZip.loadAsync(await conversionResult.outputZipBlob.arrayBuffer());

  expect(await outputZip.file("config/demo.toml")?.async("string")).toBe("enabled = true");
  expect(await outputZip.file("mods/demo.jar")?.async("string")).toBe("jar");
  expect(await outputZip.file("pack-info.json")?.async("string")).toContain("Demo Pack");
  expect(outputZip.file("FAILED_DOWNLOADS.txt")).toBeNull();
}

describe("source and runner conversion pipeline", () => {
  test("converts a valid mrpack downloaded from a direct URL and keeps the output filename", async () => {
    const mrpackBuffer = await createValidMrpackBuffer();
    const fetchLike = async (url: string) => {
      expect(url).toBe("https://cdn.example.com/demo-pack.mrpack");
      return new Response(mrpackBuffer, { status: 200 });
    };

    const source = await downloadMrpackFromUrl("https://cdn.example.com/demo-pack.mrpack", fetchLike);

    expect(source.outputZipFileName).toBe("demo-pack.zip");
    await expectConvertedZipContainsCoreFiles(source.mrpackBuffer);
  });

  test("converts a valid mrpack discovered from a Modrinth project and keeps the project file name", async () => {
    const mrpackBuffer = await createValidMrpackBuffer();
    const fetchLike = async (url: string) => {
      if (url.includes("/v2/project/demo-project/version")) {
        return Response.json([
          {
            files: [{ filename: "project-pack.mrpack", url: "https://cdn.example.com/project-pack.mrpack" }],
          },
        ]);
      }

      expect(url).toBe("https://cdn.example.com/project-pack.mrpack");
      return new Response(mrpackBuffer, { status: 200 });
    };

    const source = await downloadMrpackFromProject("demo-project", fetchLike);

    expect(source.outputZipFileName).toBe("project-pack.zip");
    await expectConvertedZipContainsCoreFiles(source.mrpackBuffer);
  });

  test("converts a valid uploaded ArrayBuffer mrpack", async () => {
    const mrpackBuffer = await createValidMrpackBuffer();

    await expectConvertedZipContainsCoreFiles(mrpackBuffer);
  });
});
