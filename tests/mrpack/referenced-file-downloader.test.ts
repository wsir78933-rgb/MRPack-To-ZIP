import { describe, expect, test } from "vitest";

import {
  downloadFirstAvailableUrl,
  downloadReferencedFiles,
} from "@/lib/mrpack/referenced-file-downloader";
import {
  maxReferencedFileBytes,
} from "@/lib/mrpack/limits";
import type { ModrinthIndexFile } from "@/lib/mrpack/mrpack-parser";

function responseWithBody(body: string, init: ResponseInit = {}) {
  return new Response(body, { status: 200, ...init });
}

function responseWithBlobSize(byteLength: number) {
  return new Response(new Uint8Array(byteLength), {
    status: 200,
    headers: { "Content-Length": String(byteLength) },
  });
}

function createChunkSizeStream(chunkSizes: number[], onChunkRead: () => void) {
  let nextChunkIndex = 0;

  return new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        const chunkSize = chunkSizes[nextChunkIndex];
        nextChunkIndex += 1;

        if (chunkSize === undefined) {
          controller.close();
          return;
        }

        onChunkRead();
        controller.enqueue({ byteLength: chunkSize } as Uint8Array);
      },
    },
    { highWaterMark: 0 },
  );
}

describe("downloadFirstAvailableUrl", () => {
  test("tries the next download URL after the first URL returns 404", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/demo.jar",
      downloads: ["https://cdn.example.com/missing.jar", "https://cdn.example.com/demo.jar"],
    };
    const fetchLike = async (url: string) =>
      url.endsWith("missing.jar")
        ? new Response("not found", { status: 404, statusText: "Not Found" })
        : responseWithBody("jar");

    const result = await downloadFirstAvailableUrl(referencedFile, fetchLike);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await result.downloadedFile.content.text()).toBe("jar");
    }
  });

  test("reports every attempted URL and reason when all URLs fail", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/missing.jar",
      downloads: ["https://cdn.example.com/first.jar", "https://cdn.example.com/second.jar"],
    };
    const fetchLike = async (url: string) =>
      new Response(url, {
        status: url.endsWith("first.jar") ? 404 : 500,
        statusText: url.endsWith("first.jar") ? "Not Found" : "Server Error",
      });

    const result = await downloadFirstAvailableUrl(referencedFile, fetchLike);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedDownload.attemptedUrls).toEqual(referencedFile.downloads);
      expect(result.failedDownload.reasons.join("\n")).toContain("404 Not Found");
      expect(result.failedDownload.reasons.join("\n")).toContain("500 Server Error");
    }
  });

  test("checks sha512 before sha1 and tries the next URL after a sha512 mismatch", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/demo.jar",
      downloads: ["https://cdn.example.com/bad.jar", "https://cdn.example.com/good.jar"],
      hashes: {
        sha512:
          "1ed993c596fe28681927f2df35f7224addb943c175cbe195ab10db25d5354cf70df14cebe6b33c653101251939d89e8a09e4f725f527fd9b4133de186e2fd184",
        sha1: "0000000000000000000000000000000000000000",
      },
      fileSize: 6,
    };
    const fetchLike = async (url: string) =>
      responseWithBody(url.endsWith("bad.jar") ? "jar" : "jar-v2");

    const result = await downloadFirstAvailableUrl(referencedFile, fetchLike);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await result.downloadedFile.content.text()).toBe("jar-v2");
    }
  });

  test("uses sha1 when sha512 is not present", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/demo.jar",
      downloads: ["https://cdn.example.com/demo.jar"],
      hashes: { sha1: "36a70c143c529f542ae48db3697df76f88f5cc20" },
      fileSize: 6,
    };

    const result = await downloadFirstAvailableUrl(referencedFile, async () => responseWithBody("jar-v2"));

    expect(result.ok).toBe(true);
  });

  test("uses fileSize when no hash is present and tries the next URL after a size mismatch", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/demo.jar",
      downloads: ["https://cdn.example.com/short.jar", "https://cdn.example.com/good.jar"],
      fileSize: 6,
    };
    const fetchLike = async (url: string) =>
      responseWithBody(url.endsWith("short.jar") ? "jar" : "jar-v2");

    const result = await downloadFirstAvailableUrl(referencedFile, fetchLike);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await result.downloadedFile.content.text()).toBe("jar-v2");
    }
  });

  test("tries the next URL when Content-Length exceeds the single file limit", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/demo.jar",
      downloads: ["https://cdn.example.com/huge.jar", "https://cdn.example.com/demo.jar"],
    };
    const fetchLike = async (url: string) =>
      url.endsWith("huge.jar")
        ? new Response("", {
            status: 200,
            headers: { "Content-Length": String(250 * 1024 * 1024 + 1) },
          })
        : responseWithBody("jar");

    const result = await downloadFirstAvailableUrl(referencedFile, fetchLike);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await result.downloadedFile.content.text()).toBe("jar");
    }
  });

  test("fails a referenced file before fetch when manifest fileSize exceeds the single file limit", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/too-large.jar",
      downloads: ["https://cdn.example.com/too-large.jar"],
      fileSize: maxReferencedFileBytes + 1,
    };
    let fetchCount = 0;

    const result = await downloadFirstAvailableUrl(referencedFile, async () => {
      fetchCount += 1;
      return responseWithBody("should not fetch");
    });

    expect(fetchCount).toBe(0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedDownload.path).toBe("mods/too-large.jar");
      expect(result.failedDownload.reasons.join("\n")).toContain(String(maxReferencedFileBytes + 1));
    }
  });

  test("fails while streaming a no-Content-Length referenced file as soon as the single file limit is exceeded", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/streamed-too-large.jar",
      downloads: ["https://cdn.example.com/streamed-too-large.jar"],
    };
    let chunkReadCount = 0;

    const result = await downloadFirstAvailableUrl(referencedFile, async () =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        body: createChunkSizeStream([maxReferencedFileBytes - 1, 2, 1], () => {
          chunkReadCount += 1;
        }),
        blob: async () => {
          throw new Error("blob should not be called");
        },
      }) as unknown as Response,
    );

    expect(chunkReadCount).toBe(2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedDownload.reasons.join("\n")).toMatch(/streamed-too-large\.jar.*exceeds/);
    }
  });

  test("fails while streaming a no-Content-Length referenced file as soon as the remaining total limit is exceeded", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/remaining-limit.jar",
      downloads: ["https://cdn.example.com/remaining-limit.jar"],
    };
    let chunkReadCount = 0;

    const result = await downloadFirstAvailableUrl(
      referencedFile,
      async () =>
        ({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          body: createChunkSizeStream([9, 2, 1], () => {
            chunkReadCount += 1;
          }),
          blob: async () => {
            throw new Error("blob should not be called");
          },
        }) as unknown as Response,
      10,
    );

    expect(chunkReadCount).toBe(2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedDownload.reasons.join("\n")).toContain("remaining total download limit");
    }
  });

  test("fails fast instead of reading a body-less response when the size limit cannot be streamed", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/bodyless.jar",
      downloads: ["https://cdn.example.com/bodyless.jar"],
    };
    let blobReadCount = 0;

    const result = await downloadFirstAvailableUrl(referencedFile, async () =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Length": "3" }),
        body: null,
        blob: async () => {
          blobReadCount += 1;
          return new Blob(["oversized body"]);
        },
      }) as unknown as Response,
    );

    expect(blobReadCount).toBe(0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedDownload.reasons.join("\n")).toContain("not readable");
    }
  });

  test("counts failed URL bodies against the remaining total limit before trying the next URL", async () => {
    const referencedFile: ModrinthIndexFile = {
      path: "mods/retry-limit.jar",
      downloads: ["https://cdn.example.com/bad.jar", "https://cdn.example.com/good.jar"],
      fileSize: 4,
    };
    let goodBlobReadCount = 0;

    const result = await downloadFirstAvailableUrl(
      referencedFile,
      async (url) => {
        if (url.endsWith("bad.jar")) {
          return responseWithBody("bad body");
        }

        return {
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers({ "Content-Length": "4" }),
          body: null,
          blob: async () => {
            goodBlobReadCount += 1;
            return new Blob(["good"]);
          },
        } as unknown as Response;
      },
      10,
    );

    expect(goodBlobReadCount).toBe(0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedDownload.reasons.join("\n")).toContain("remaining total download limit");
    }
  });
});

describe("downloadReferencedFiles", () => {
  test("reports file count progress after each referenced file is processed", async () => {
    const referencedFiles: ModrinthIndexFile[] = [
      { path: "mods/one.jar", downloads: ["https://cdn.example.com/one.jar"] },
      { path: "mods/missing.jar", downloads: ["https://cdn.example.com/missing.jar"] },
    ];
    const fileCountProgressEvents: Array<{
      currentFileCount: number;
      totalFileCount: number;
    }> = [];

    await downloadReferencedFiles(
      referencedFiles,
      async (url) =>
        url.endsWith("missing.jar")
          ? new Response("not found", { status: 404, statusText: "Not Found" })
          : responseWithBody("jar"),
      100,
      (fileCountProgress) => fileCountProgressEvents.push(fileCountProgress),
    );

    expect(fileCountProgressEvents).toEqual([
      { currentFileCount: 1, totalFileCount: 2 },
      { currentFileCount: 2, totalFileCount: 2 },
    ]);
  });

  test("skips a file before reading the body when manifest fileSize exceeds the remaining total limit", async () => {
    const referencedFiles: ModrinthIndexFile[] = [
      {
        path: "mods/one.jar",
        downloads: ["https://cdn.example.com/one.jar"],
        fileSize: 24,
      },
      {
        path: "mods/two.jar",
        downloads: ["https://cdn.example.com/two.jar"],
        fileSize: 24,
      },
      {
        path: "mods/three.jar",
        downloads: ["https://cdn.example.com/three.jar"],
        fileSize: 24,
      },
      {
        path: "mods/four.jar",
        downloads: ["https://cdn.example.com/four.jar"],
        fileSize: 24,
      },
      {
        path: "mods/five.jar",
        downloads: ["https://cdn.example.com/five.jar"],
        fileSize: 10,
      },
    ];
    let fifthFileFetchCount = 0;

    const result = await downloadReferencedFiles(referencedFiles, async (url) => {
      if (url.endsWith("five.jar")) {
        fifthFileFetchCount += 1;
      }

      return responseWithBlobSize(24);
    }, 100);

    expect(fifthFileFetchCount).toBe(0);
    expect(result.downloadedFiles.map((downloadedFile) => downloadedFile.path)).toEqual([
      "mods/one.jar",
      "mods/two.jar",
      "mods/three.jar",
      "mods/four.jar",
    ]);
    expect(result.failedDownloads.map((failedDownload) => failedDownload.path)).toEqual(["mods/five.jar"]);
    expect(result.failedDownloads[0].reasons.join("\n")).toContain("remaining total download limit");
  });

  test("skips a response body when Content-Length exceeds the remaining total limit", async () => {
    const referencedFiles: ModrinthIndexFile[] = [
      { path: "mods/one.jar", downloads: ["https://cdn.example.com/one.jar"] },
      { path: "mods/two.jar", downloads: ["https://cdn.example.com/two.jar"] },
      { path: "mods/three.jar", downloads: ["https://cdn.example.com/three.jar"] },
      { path: "mods/four.jar", downloads: ["https://cdn.example.com/four.jar"] },
      { path: "mods/five.jar", downloads: ["https://cdn.example.com/five.jar"] },
    ];
    let fifthBodyReadCount = 0;

    const result = await downloadReferencedFiles(referencedFiles, async (url) => {
      if (!url.endsWith("five.jar")) {
        return responseWithBlobSize(24);
      }

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Length": "10" }),
        blob: async () => {
          fifthBodyReadCount += 1;
          return new Blob(["should not read"]);
        },
      } as Response;
    }, 100);

    expect(fifthBodyReadCount).toBe(0);
    expect(result.downloadedFiles.map((downloadedFile) => downloadedFile.path)).toEqual([
      "mods/one.jar",
      "mods/two.jar",
      "mods/three.jar",
      "mods/four.jar",
    ]);
    expect(result.failedDownloads.map((failedDownload) => failedDownload.path)).toEqual(["mods/five.jar"]);
    expect(result.failedDownloads[0].reasons.join("\n")).toContain("remaining total download limit");
  });

  test("marks remaining files failed after the total download limit is reached", async () => {
    const referencedFiles: ModrinthIndexFile[] = [
      { path: "mods/one.jar", downloads: ["https://cdn.example.com/one.jar"] },
      { path: "mods/two.jar", downloads: ["https://cdn.example.com/two.jar"] },
      { path: "mods/three.jar", downloads: ["https://cdn.example.com/three.jar"] },
      { path: "mods/four.jar", downloads: ["https://cdn.example.com/four.jar"] },
      { path: "mods/five.jar", downloads: ["https://cdn.example.com/five.jar"] },
      { path: "mods/six.jar", downloads: ["https://cdn.example.com/six.jar"] },
    ];
    const fetchLike = async () => responseWithBlobSize(22);

    const result = await downloadReferencedFiles(referencedFiles, fetchLike, 100);

    expect(result.downloadedFiles.map((downloadedFile) => downloadedFile.path)).toEqual([
      "mods/one.jar",
      "mods/two.jar",
      "mods/three.jar",
      "mods/four.jar",
    ]);
    expect(result.failedDownloads.map((failedDownload) => failedDownload.path)).toEqual([
      "mods/five.jar",
      "mods/six.jar",
    ]);
    expect(result.failedDownloads[0].reasons.join("\n")).toContain("total download limit");
  });
});
