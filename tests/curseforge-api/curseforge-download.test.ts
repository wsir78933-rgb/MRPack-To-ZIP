import { afterEach, describe, expect, test, vi } from "vitest";

import { POST } from "@/app/api/curseforge/download/route";
import { downloadCurseForgeFileContent } from "@/lib/curseforge-api/client-download";
import { conversionErrorCodes } from "@/lib/mrpack/errors";

const originalCurseForgeApiKey = process.env.CURSEFORGE_API_KEY;

afterEach(() => {
  if (originalCurseForgeApiKey === undefined) {
    delete process.env.CURSEFORGE_API_KEY;
  } else {
    process.env.CURSEFORGE_API_KEY = originalCurseForgeApiKey;
  }

  vi.unstubAllGlobals();
});

describe("POST /api/curseforge/download", () => {
  test("returns a structured error when the server API key is missing", async () => {
    delete process.env.CURSEFORGE_API_KEY;

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "missing_api_key",
      details: {
        service: "curseforge",
      },
    });
    expect(response.status).toBe(500);
  });

  test("downloads a CurseForge file after validating projectId and fileId", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";

    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (url === "https://api.curseforge.com/v1/mods/files") {
        expect(init?.headers).toMatchObject({ "x-api-key": "server-secret-key" });
        return Response.json({
          data: [
            {
              modId: 123,
              id: 456,
              fileName: "curse-only.jar",
              fileLength: 14,
              downloadUrl: "https://edge.forgecdn.net/files/456/curse-only.jar",
              hashes: [{ value: "sha1-a", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      expect(url).toBe("https://edge.forgecdn.net/files/456/curse-only.jar");
      expect(init?.headers).toMatchObject({ "x-api-key": "server-secret-key" });
      return new Response("curse jar bytes", {
        headers: { "Content-Type": "application/java-archive" },
      });
    });

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.text()).resolves.toBe("curse jar bytes");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/java-archive");
    expect(response.headers.get("X-CurseForge-File-Name")).toBe("curse-only.jar");
  });

  test("fails when CurseForge metadata belongs to a different project", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    vi.stubGlobal("fetch", async () =>
      Response.json({
        data: [
          {
            modId: 999,
            id: 456,
            fileName: "wrong-project.jar",
            fileLength: 14,
            downloadUrl: "https://edge.forgecdn.net/files/456/wrong-project.jar",
            hashes: [{ value: "sha1-a", algo: 1 }],
            isAvailable: true,
          },
        ],
      }),
    );

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "project_id_mismatch",
      details: {
        actualProjectId: 999,
        expectedProjectId: 123,
        fileId: 456,
      },
    });
    expect(response.status).toBe(502);
  });

  test("downloads a CurseForge file when metadata marks it unavailable but exposes an allowed URL", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "https://api.curseforge.com/v1/mods/files") {
        expect(init?.headers).toMatchObject({ "x-api-key": "server-secret-key" });
        return Response.json({
          data: [
            {
              modId: 123,
              id: 456,
              fileName: "unavailable.jar",
              fileLength: 14,
              downloadUrl: "https://edge.forgecdn.net/files/456/unavailable.jar",
              hashes: [{ value: "sha1-a", algo: 1 }],
              isAvailable: false,
            },
          ],
        });
      }

      expect(url).toBe("https://edge.forgecdn.net/files/456/unavailable.jar");
      expect(init?.headers).toMatchObject({ "x-api-key": "server-secret-key" });
      return new Response("unavailable jar bytes", {
        headers: { "Content-Type": "application/java-archive" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.text()).resolves.toBe("unavailable jar bytes");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/java-archive");
    expect(response.headers.get("X-CurseForge-File-Name")).toBe("unavailable.jar");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("fails before download when CurseForge metadata has no download URL", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("https://api.curseforge.com/v1/mods/files");
      return Response.json({
        data: [
          {
            modId: 123,
            id: 456,
            fileName: "missing-download-url.jar",
            fileLength: 14,
            downloadUrl: null,
            hashes: [{ value: "sha1-a", algo: 1 }],
            isAvailable: false,
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "download_url_missing",
      details: {
        fileId: 456,
        projectId: 123,
      },
    });
    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("fails before download when the CurseForge download URL is not HTTPS", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [
          {
            modId: 123,
            id: 456,
            fileName: "http-url.jar",
            fileLength: 14,
            downloadUrl: "http://edge.forgecdn.net/files/456/http-url.jar",
            hashes: [{ value: "sha1-a", algo: 1 }],
            isAvailable: true,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "download_url_not_https",
      details: {
        actualProtocol: "http:",
        downloadUrl: "http://edge.forgecdn.net/files/456/http-url.jar",
        fileId: 456,
        projectId: 123,
      },
    });
    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("fails with structured details when the CurseForge download URL is invalid", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [
          {
            modId: 123,
            id: 456,
            fileName: "invalid-url.jar",
            fileLength: 14,
            downloadUrl: "not a url",
            hashes: [{ value: "sha1-a", algo: 1 }],
            isAvailable: true,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "download_url_invalid",
      details: {
        downloadUrl: "not a url",
        fileId: 456,
        projectId: 123,
      },
    });
    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("fails before download when the CurseForge download URL host is not allowed", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [
          {
            modId: 123,
            id: 456,
            fileName: "hostile.jar",
            fileLength: 14,
            downloadUrl: "https://example.test/files/456/hostile.jar",
            hashes: [{ value: "sha1-a", algo: 1 }],
            isAvailable: true,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "download_url_not_allowed",
      details: {
        actualHost: "example.test",
        expectedHost: "edge.forgecdn.net",
        fileId: 456,
        projectId: 123,
      },
    });
    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("fails when the CurseForge CDN returns no response body", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";

    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "https://api.curseforge.com/v1/mods/files") {
        return Response.json({
          data: [
            {
              modId: 123,
              id: 456,
              fileName: "empty.jar",
              fileLength: 14,
              downloadUrl: "https://edge.forgecdn.net/files/456/empty.jar",
              hashes: [{ value: "sha1-a", algo: 1 }],
              isAvailable: true,
            },
          ],
        });
      }

      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "application/java-archive" },
      });
    });

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "download_body_missing",
      details: {
        downloadUrl: "https://edge.forgecdn.net/files/456/empty.jar",
        fileId: 456,
        projectId: 123,
      },
    });
    expect(response.status).toBe(502);
  });

  test("returns structured 400 details when a fileId value is invalid", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: "bad-file-id" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "invalid_request",
      details: {
        expectedDescription: "a positive integer no larger than 2147483647",
        fieldPath: "fileReference.fileId",
        problemValue: "bad-file-id",
      },
    });
    expect(response.status).toBe(400);
  });
});

describe("downloadCurseForgeFileContent", () => {
  test("downloads file content through the local route", async () => {
    const fetchLike = async (url: string, init?: RequestInit) => {
      expect(url).toBe("/api/curseforge/download");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ projectId: 123, fileId: 456 }));
      return new Response("curse jar bytes");
    };

    const fileContent = await downloadCurseForgeFileContent(
      { projectId: 123, fileId: 456 },
      fetchLike,
    );

    await expect(fileContent.text()).resolves.toBe("curse jar bytes");
  });

  test("throws a structured ConversionError for local route errors", async () => {
    const fetchLike = async () =>
      Response.json(
        {
          errorCode: "curseforge_api_error",
          reason: "download_url_not_allowed",
          details: {
            actualHost: "example.test",
            expectedHost: "edge.forgecdn.net",
            fileId: 456,
            projectId: 123,
          },
        },
        { status: 502, statusText: "Bad Gateway" },
      );

    await expect(
      downloadCurseForgeFileContent({ projectId: 123, fileId: 456 }, fetchLike),
    ).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/download",
        routeReason: "download_url_not_allowed",
        status: 502,
      },
      details: {
        actualHost: "example.test",
        expectedHost: "edge.forgecdn.net",
        fileId: 456,
        projectId: 123,
      },
    });
  });

  test("wraps legacy local route JSON errors in a structured ConversionError", async () => {
    const fetchLike = async () =>
      Response.json(
        {
          error: "Legacy CurseForge download failure.",
        },
        { status: 502, statusText: "Bad Gateway" },
      );

    await expect(
      downloadCurseForgeFileContent({ projectId: 123, fileId: 456 }, fetchLike),
    ).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/download",
        routeReason: "legacy_route_error",
        status: 502,
      },
      details: {
        error: "Legacy CurseForge download failure.",
      },
    });
  });

  test("includes status and statusText when local route error JSON cannot be parsed", async () => {
    const fetchLike = async () =>
      new Response("not json", {
        status: 502,
        statusText: "Bad Gateway",
      });

    await expect(
      downloadCurseForgeFileContent({ projectId: 123, fileId: 456 }, fetchLike),
    ).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      message: expect.stringMatching(/502 Bad Gateway/),
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/download",
        routeReason: "unparseable_route_error",
        status: 502,
      },
      details: {
        status: 502,
        statusText: "Bad Gateway",
      },
    });
  });
});
