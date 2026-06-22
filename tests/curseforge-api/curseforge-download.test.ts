import { afterEach, describe, expect, test, vi } from "vitest";

import { POST } from "@/app/api/curseforge/download/route";
import { downloadCurseForgeFileContent } from "@/lib/curseforge-api/client-download";

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
  test("returns a clear error when the server API key is missing", async () => {
    delete process.env.CURSEFORGE_API_KEY;

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("CURSEFORGE_API_KEY"),
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

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/projectId.*123.*999/),
    });
    expect(response.status).toBe(502);
  });

  test("fails when CurseForge metadata marks the file unavailable", async () => {
    process.env.CURSEFORGE_API_KEY = "server-secret-key";
    const fetchMock = vi.fn(async () =>
      Response.json({
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
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.com/api/curseforge/download", {
        method: "POST",
        body: JSON.stringify({ projectId: 123, fileId: 456 }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/isAvailable.*false.*123.*456/),
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

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/https.*http:\/\/edge\.forgecdn\.net/),
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

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/example\.test.*edge\.forgecdn\.net/),
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

    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/body null.*123.*456.*https:\/\/edge\.forgecdn\.net\/files\/456\/empty\.jar/),
    });
    expect(response.status).toBe(502);
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
});
