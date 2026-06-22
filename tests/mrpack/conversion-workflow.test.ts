import JSZip from "jszip";
import { describe, expect, test } from "vitest";

import {
  resolveMrpackArchiveSource,
  runMrpackConversionWorkflow,
  type BrowserMrpackFile,
  type ConversionWorkflowProgress,
} from "@/lib/mrpack/conversion-workflow";

async function createMrpackArchiveBuffer(indexJson: unknown) {
  const mrpackArchive = new JSZip();
  mrpackArchive.file("modrinth.index.json", JSON.stringify(indexJson));
  return mrpackArchive.generateAsync({ type: "arraybuffer" });
}

function createUploadFile(name: string, mrpackBuffer: ArrayBuffer): BrowserMrpackFile {
  return {
    name,
    size: mrpackBuffer.byteLength,
    arrayBuffer: async () => mrpackBuffer,
  };
}

describe("runMrpackConversionWorkflow", () => {
  test("converts a local uploaded ArrayBuffer source", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer({
      name: "Upload Pack",
      files: [],
    });
    const workflowProgressEvents: ConversionWorkflowProgress[] = [];

    const conversionResult = await runMrpackConversionWorkflow({
      inputMode: "upload",
      selectedFile: createUploadFile("upload-pack.mrpack", mrpackBuffer),
      onProgress: (workflowProgress) => workflowProgressEvents.push(workflowProgress),
      fetchLike: async () => {
        throw new Error("upload mode should not fetch");
      },
    });

    expect(conversionResult.sourceFileName).toBe("upload-pack.mrpack");
    expect(conversionResult.outputZipFileName).toBe("upload-pack.zip");
    expect(conversionResult.referencedFileCount).toBe(0);
    expect(workflowProgressEvents.map((workflowProgress) => workflowProgress.stage)).toEqual([
      "fetching-source",
      "loading-archive",
      "reading-index",
      "collecting-overrides",
      "downloading-files",
      "building-zip",
    ]);
    expect(workflowProgressEvents[0]).toMatchObject({
      stage: "fetching-source",
      percent: 5,
    });
    expect(
      workflowProgressEvents.every((workflowProgress) =>
        Number.isFinite(workflowProgress.percent),
      ),
    ).toBe(true);
  });

  test("downloads and converts a direct .mrpack URL source", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer({
      name: "URL Pack",
      files: [],
    });
    const fetchLike = async (url: string) => {
      expect(url).toBe("https://cdn.example.com/url-pack.mrpack");
      return new Response(mrpackBuffer, { status: 200 });
    };

    const conversionResult = await runMrpackConversionWorkflow({
      inputMode: "url",
      mrpackDownloadUrl: "https://cdn.example.com/url-pack.mrpack",
      fetchLike,
    });

    expect(conversionResult.sourceFileName).toBe("url-pack.mrpack");
    expect(conversionResult.outputZipFileName).toBe("url-pack.zip");
  });

  test("resolves and converts a Modrinth project source", async () => {
    const mrpackBuffer = await createMrpackArchiveBuffer({
      name: "Project Pack",
      files: [],
    });
    const fetchLike = async (url: string) => {
      if (url.includes("/v2/project/demo-project/version")) {
        return Response.json([
          {
            files: [
              {
                filename: "project-pack.mrpack",
                url: "https://cdn.example.com/project-pack.mrpack",
              },
            ],
          },
        ]);
      }

      expect(url).toBe("https://cdn.example.com/project-pack.mrpack");
      return new Response(mrpackBuffer, { status: 200 });
    };

    const conversionResult = await runMrpackConversionWorkflow({
      inputMode: "project",
      projectIdOrSlug: "demo-project",
      fetchLike,
    });

    expect(conversionResult.sourceFileName).toBe("project-pack.mrpack");
    expect(conversionResult.outputZipFileName).toBe("project-pack.zip");
  });

  test("fails fast when upload mode has no selected file", async () => {
    await expect(
      runMrpackConversionWorkflow({
        inputMode: "upload",
        selectedFile: null,
      }),
    ).rejects.toThrow(/upload mode.*selectedFile: null/);
  });

  test("rejects an oversized uploaded file before reading the ArrayBuffer", async () => {
    let arrayBufferReadCount = 0;

    await expect(
      runMrpackConversionWorkflow({
        inputMode: "upload",
        selectedFile: {
          name: "too-large.mrpack",
          size: 100 * 1024 * 1024 + 1,
          arrayBuffer: async () => {
            arrayBufferReadCount += 1;
            return new ArrayBuffer(0);
          },
        },
      }),
    ).rejects.toThrow(/too-large\.mrpack.*104857601/);

    expect(arrayBufferReadCount).toBe(0);
  });

  test("fails fast when inputMode is unknown at runtime", async () => {
    await expect(
      resolveMrpackArchiveSource({
        inputMode: "clipboard" as never,
        selectedFile: null,
      }),
    ).rejects.toThrow(/inputMode.*clipboard/);
  });
});
