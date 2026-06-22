import { afterEach, describe, expect, test, vi } from "vitest";

import { POST } from "@/app/api/curseforge/files/route";
import {
  fetchCurseForgeFileMetadata,
  fetchCurseForgeFilesByIds,
  type CurseForgeFileReference,
} from "@/lib/curseforge-api/files";

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
  test("returns a clear 500 JSON error when CURSEFORGE_API_KEY is missing", async () => {
    delete process.env.CURSEFORGE_API_KEY;

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: 123, fileId: 456 }],
        }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("CURSEFORGE_API_KEY"),
    });
    expect(response.status).toBe(500);
  });

  test("returns 400 when a fileId value is invalid and includes the bad value", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";

    const response = await POST(
      new Request("https://example.com/api/curseforge/files", {
        method: "POST",
        body: JSON.stringify({
          fileReferences: [{ projectId: 123, fileId: "bad-file-id" }],
        }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/fileId.*bad-file-id/),
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

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/projectId.*-2/),
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

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/fileReferences.*3001.*3000/),
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
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
});
