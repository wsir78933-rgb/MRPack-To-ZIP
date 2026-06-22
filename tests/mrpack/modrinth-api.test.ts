import { describe, expect, test } from "vitest";

import {
  buildProjectVersionsUrl,
  fetchProjectVersions,
  findFirstMrpackFile,
} from "@/lib/mrpack/modrinth-api";
import { conversionErrorCodes } from "@/lib/mrpack/errors";

describe("buildProjectVersionsUrl", () => {
  test("builds the Modrinth versions endpoint for a project slug", () => {
    expect(buildProjectVersionsUrl("demo-pack").href).toBe(
      "https://api.modrinth.com/v2/project/demo-pack/version?include_changelog=false",
    );
  });

  test("fails fast for a blank project value", () => {
    expect(() => buildProjectVersionsUrl(" ")).toThrow("project");
  });
});

describe("findFirstMrpackFile", () => {
  test("finds the first .mrpack file in project versions", () => {
    const firstMrpackFile = findFirstMrpackFile([
      {
        files: [
          { filename: "readme.txt", url: "https://example.com/readme.txt" },
          { filename: "pack.mrpack", url: "https://example.com/pack.mrpack" },
        ],
      },
      {
        files: [{ filename: "newer.mrpack", url: "https://example.com/newer.mrpack" }],
      },
    ]);

    expect(firstMrpackFile).toEqual({
      filename: "pack.mrpack",
      url: "https://example.com/pack.mrpack",
    });
  });

  test("returns null when no .mrpack file exists", () => {
    expect(
      findFirstMrpackFile([
        {
          files: [{ filename: "readme.txt", url: "https://example.com/readme.txt" }],
        },
      ]),
    ).toBeNull();
  });
});

describe("fetchProjectVersions", () => {
  test("wraps fetch rejection with project and reason context", async () => {
    const fetchLike = async () => {
      throw new Error("network offline");
    };

    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toThrow(
      /demo-project.*network offline/,
    );
  });

  test("wraps response JSON rejection with project and reason context", async () => {
    const fetchLike = async () =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => {
          throw new Error("invalid json body");
        },
      }) as unknown as Response;

    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toThrow(
      /demo-project.*invalid json body/,
    );
  });

  test("fails fast when a version files field is not an array", async () => {
    const fetchLike = async () =>
      Response.json([
        {
          files: "not-files-array",
        },
      ]);

    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.modrinthApiError,
    });
    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toThrow(
      /demo-project.*versions\[0\]\.files.*not-files-array/,
    );
  });

  test("fails fast when a version file filename is not a string", async () => {
    const fetchLike = async () =>
      Response.json([
        {
          files: [{ filename: 123, url: "https://cdn.example.com/pack.mrpack" }],
        },
      ]);

    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.modrinthApiError,
    });
    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toThrow(
      /demo-project.*versions\[0\]\.files\[0\]\.filename.*123/,
    );
  });

  test("fails fast when a version file url is not a string", async () => {
    const fetchLike = async () =>
      Response.json([
        {
          files: [{ filename: "pack.mrpack", url: null }],
        },
      ]);

    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toMatchObject({
      code: conversionErrorCodes.modrinthApiError,
    });
    await expect(fetchProjectVersions("demo-project", fetchLike)).rejects.toThrow(
      /demo-project.*versions\[0\]\.files\[0\]\.url.*null/,
    );
  });
});
