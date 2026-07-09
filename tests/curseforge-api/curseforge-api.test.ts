import { afterEach, describe, expect, test, vi } from "vitest";

import { POST } from "@/app/api/curseforge/files/route";
import {
  fetchCurseForgeFileMetadata,
  fetchCurseForgeFilesByIds,
  type CurseForgeFileReference,
} from "@/lib/curseforge-api/files";
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

describe("fetchCurseForgeFilesByIds", () => {
  test("posts fileIds to the official CurseForge files endpoint with the server API key", async () => {
    const fetchLike = async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://api.curseforge.com/v1/mods/files");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": "server-secret-key",
      });
      expect(init?.body).toBe(JSON.stringify({ fileIds: [456, 789] }));

      return Response.json({
        data: [
          {
            modId: 123,
            id: 456,
            fileName: "demo.jar",
            fileLength: 2048,
            downloadUrl: "https://edge.forgecdn.net/files/456/demo.jar",
            hashes: [{ value: "hash-value", algo: 1 }],
            isAvailable: true,
            extraIgnoredField: "not needed by the frontend",
          },
        ],
      });
    };

    await expect(fetchCurseForgeFilesByIds([456, 789], "server-secret-key", fetchLike)).resolves.toEqual([
      {
        modId: 123,
        fileId: 456,
        fileName: "demo.jar",
        fileLength: 2048,
        downloadUrl: "https://edge.forgecdn.net/files/456/demo.jar",
        hashes: [{ value: "hash-value", algo: 1 }],
        isAvailable: true,
      },
    ]);
  });
});

describe("POST /api/curseforge/files", () => {
  test("returns a structured 500 JSON error when CURSEFORGE_API_KEY is missing", async () => {
    delete process.env.CURSEFORGE_API_KEY;

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: 123, fileId: 456 }],
        }),
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

  test("returns structured 400 details when a fileId value is invalid", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: 123, fileId: "bad-file-id" }],
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "invalid_request",
      details: {
        expectedDescription: "a positive integer no larger than 2147483647",
        fieldPath: "fileReferences[0].fileId",
        problemValue: "bad-file-id",
      },
    });
    expect(response.status).toBe(400);
  });

  test("returns 400 when a projectId value is invalid and includes the bad value", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: -2, fileId: 456 }],
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "invalid_request",
      details: {
        expectedDescription: "a positive integer no larger than 2147483647",
        fieldPath: "fileReferences[0].projectId",
        problemValue: -2,
      },
    });
    expect(response.status).toBe(400);
  });

  test("returns 400 when too many file references are requested at once", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fileReferences = Array.from({ length: 3001 }, (_, fileReferenceIndex) => ({
      projectId: 123,
      fileId: fileReferenceIndex + 1,
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({ fileReferences }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "invalid_request",
      details: {
        expectedDescription: "no more than 3000 file references",
        fieldPath: "fileReferences.length",
        problemValue: 3001,
      },
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns structured unexpected errors without exposing raw cause text", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    vi.stubGlobal("fetch", async () => {
      throw new Error("raw secret upstream failure");
    });

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: 123, fileId: 456 }],
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      errorCode: "curseforge_api_error",
      reason: "curseforge_files_fetch_failed",
      details: {},
    });
    expect(response.status).toBe(502);
  });

  test("returns minimal file metadata from CurseForge for valid file references", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://api.curseforge.com/v1/mods/files");
      expect(init?.headers).toMatchObject({ "x-api-key": "server-secret-key" });

      return Response.json({
        data: [
          {
            modId: 123,
            id: 456,
            fileName: "demo.jar",
            fileLength: 2048,
            downloadUrl: "https://edge.forgecdn.net/files/456/demo.jar",
            hashes: [{ value: "hash-value", algo: 1 }],
            isAvailable: true,
          },
        ],
      });
    });

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: 123, fileId: 456 }],
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      files: [
        {
          modId: 123,
          fileId: 456,
          fileName: "demo.jar",
          fileLength: 2048,
          downloadUrl: "https://edge.forgecdn.net/files/456/demo.jar",
          hashes: [{ value: "hash-value", algo: 1 }],
          isAvailable: true,
        },
      ],
    });
    expect(response.status).toBe(200);
  });
});

describe("fetchCurseForgeFileMetadata", () => {
  test("fetches file metadata through the local CurseForge route", async () => {
    const fileReferences: CurseForgeFileReference[] = [{ projectId: 123, fileId: 456 }];
    const fetchLike = async (url: string, init?: RequestInit) => {
      expect(url).toBe("/api/curseforge/files");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
      expect(init?.body).toBe(JSON.stringify({ fileReferences }));

      return Response.json({
        files: [
          {
            modId: 123,
            fileId: 456,
            fileName: "demo.jar",
            fileLength: 2048,
            downloadUrl: "https://edge.forgecdn.net/files/456/demo.jar",
            hashes: [{ value: "hash-value", algo: 1 }],
            isAvailable: true,
          },
        ],
      });
    };

    await expect(fetchCurseForgeFileMetadata(fileReferences, fetchLike)).resolves.toEqual([
      {
        modId: 123,
        fileId: 456,
        fileName: "demo.jar",
        fileLength: 2048,
        downloadUrl: "https://edge.forgecdn.net/files/456/demo.jar",
        hashes: [{ value: "hash-value", algo: 1 }],
        isAvailable: true,
      },
    ]);
  });

  test("throws a structured ConversionError for local route errors", async () => {
    const fileReferences: CurseForgeFileReference[] = [{ projectId: 123, fileId: 456 }];
    const fetchLike = async () =>
      Response.json(
        {
          errorCode: "curseforge_api_error",
          reason: "missing_api_key",
          details: {
            service: "curseforge",
          },
        },
        { status: 500, statusText: "Internal Server Error" },
      );

    await expect(fetchCurseForgeFileMetadata(fileReferences, fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/files",
        routeReason: "missing_api_key",
        status: 500,
      },
      details: {
        service: "curseforge",
      },
    });
  });

  test("wraps legacy local route JSON errors in a structured ConversionError", async () => {
    const fileReferences: CurseForgeFileReference[] = [{ projectId: 123, fileId: 456 }];
    const fetchLike = async () =>
      Response.json(
        {
          error: "Legacy CurseForge route failure.",
        },
        { status: 502, statusText: "Bad Gateway" },
      );

    await expect(fetchCurseForgeFileMetadata(fileReferences, fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/files",
        routeReason: "legacy_route_error",
        status: 502,
      },
      details: {
        error: "Legacy CurseForge route failure.",
      },
    });
  });

  test("includes status and statusText when local route error JSON cannot be parsed", async () => {
    const fileReferences: CurseForgeFileReference[] = [{ projectId: 123, fileId: 456 }];
    const fetchLike = async () =>
      new Response("not json", {
        status: 502,
        statusText: "Bad Gateway",
      });

    await expect(fetchCurseForgeFileMetadata(fileReferences, fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      message: expect.stringMatching(/502 Bad Gateway/),
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/files",
        routeReason: "unparseable_route_error",
        status: 502,
      },
      details: {
        status: 502,
        statusText: "Bad Gateway",
      },
    });
  });

  test("wraps malformed successful local route responses in a structured ConversionError", async () => {
    const fileReferences: CurseForgeFileReference[] = [{ projectId: 123, fileId: 456 }];
    const fetchLike = async () =>
      Response.json({
        files: "bad-files",
      });

    await expect(fetchCurseForgeFileMetadata(fileReferences, fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.downloadFailed,
      context: {
        reason: "curseforge_route_error",
        route: "/api/curseforge/files",
        routeReason: "invalid_route_response",
        status: 200,
      },
      details: {
        expectedDescription: "an array",
        fieldPath: "files",
        problemValue: "bad-files",
      },
    });
  });
});
