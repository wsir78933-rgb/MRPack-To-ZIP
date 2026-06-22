import { describe, expect, test } from "vitest";

import {
  buildOutputZipFileName,
  downloadMrpackFromProject,
  downloadMrpackFromUrl,
} from "@/lib/mrpack/conversion-source";
import { maxMrpackSourceBytes } from "@/lib/mrpack/limits";

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

describe("buildOutputZipFileName", () => {
  test("replaces the .mrpack extension with .zip", () => {
    expect(buildOutputZipFileName("demo-pack.mrpack")).toBe("demo-pack.zip");
  });

  test("sanitizes characters that are unsafe in downloaded filenames", () => {
    expect(buildOutputZipFileName("Demo: Pack?.mrpack")).toBe("Demo- Pack-.zip");
  });
});

describe("downloadMrpackFromUrl", () => {
  test("downloads an mrpack archive from a direct URL", async () => {
    const fetchLike = async (url: string) => {
      expect(url).toBe("https://cdn.example.com/demo-pack.mrpack");
      return new Response("mrpack bytes", { status: 200 });
    };

    const source = await downloadMrpackFromUrl("https://cdn.example.com/demo-pack.mrpack", fetchLike);

    expect(source.sourceFileName).toBe("demo-pack.mrpack");
    expect(source.outputZipFileName).toBe("demo-pack.zip");
    expect(await new Blob([source.mrpackBuffer]).text()).toBe("mrpack bytes");
  });

  test("uses a fallback filename when a URL path segment has malformed percent encoding", async () => {
    const malformedPercentUrl = "https://cdn.example.com/%E0%A4%A.mrpack";
    const fetchLike = async (url: string) => {
      expect(url).toBe(malformedPercentUrl);
      return new Response("mrpack bytes", { status: 200 });
    };

    const source = await downloadMrpackFromUrl(malformedPercentUrl, fetchLike);

    expect(source.sourceFileName).toBe("downloaded-pack.mrpack");
    expect(source.outputZipFileName).toBe("downloaded-pack.zip");
    expect(await new Blob([source.mrpackBuffer]).text()).toBe("mrpack bytes");
  });

  test("fails before reading the body when the mrpack Content-Length is too large", async () => {
    const fetchLike = async () =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Length": String(100 * 1024 * 1024 + 1) }),
        arrayBuffer: async () => {
          throw new Error("arrayBuffer should not be called");
        },
      }) as unknown as Response;

    await expect(downloadMrpackFromUrl("https://cdn.example.com/too-large.mrpack", fetchLike)).rejects.toThrow(
      "https://cdn.example.com/too-large.mrpack",
    );
  });

  test("fails while streaming a no-Content-Length mrpack body as soon as the size limit is exceeded", async () => {
    let chunkReadCount = 0;
    const fetchLike = async () =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        body: createChunkSizeStream([maxMrpackSourceBytes - 1, 2, 1], () => {
          chunkReadCount += 1;
        }),
        arrayBuffer: async () => {
          throw new Error("arrayBuffer should not be called");
        },
      }) as unknown as Response;

    await expect(
      downloadMrpackFromUrl("https://cdn.example.com/streamed-too-large.mrpack", fetchLike),
    ).rejects.toThrow(/streamed-too-large\.mrpack.*exceeds/);

    expect(chunkReadCount).toBe(2);
  });

  test("fails fast when the URL cannot be downloaded", async () => {
    const fetchLike = async () => new Response("not found", { status: 404, statusText: "Not Found" });

    await expect(downloadMrpackFromUrl("https://cdn.example.com/missing.mrpack", fetchLike)).rejects.toThrow(
      "https://cdn.example.com/missing.mrpack",
    );
  });
});

describe("downloadMrpackFromProject", () => {
  test("finds and downloads the first mrpack file for a Modrinth project", async () => {
    const fetchLike = async (url: string) => {
      if (url.includes("/v2/project/demo/version")) {
        return Response.json([
          {
            files: [{ filename: "demo-pack.mrpack", url: "https://cdn.example.com/demo-pack.mrpack" }],
          },
        ]);
      }

      return new Response("mrpack bytes", { status: 200 });
    };

    const source = await downloadMrpackFromProject("demo", fetchLike);

    expect(source.sourceFileName).toBe("demo-pack.mrpack");
    expect(source.outputZipFileName).toBe("demo-pack.zip");
    expect(await new Blob([source.mrpackBuffer]).text()).toBe("mrpack bytes");
  });

  test("fails fast when a project has no mrpack file", async () => {
    const fetchLike = async () => Response.json([{ files: [{ filename: "readme.txt", url: "https://example.com" }] }]);

    await expect(downloadMrpackFromProject("demo", fetchLike)).rejects.toThrow("demo");
  });
});
