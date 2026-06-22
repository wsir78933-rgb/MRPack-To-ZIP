import { describe, expect, test } from "vitest";

import { fetchModrinthVersionsBySha1 } from "@/lib/zip-to-mrpack/modrinth-version-files";

describe("fetchModrinthVersionsBySha1", () => {
  test("posts sha1 hashes to the Modrinth version_files endpoint", async () => {
    const fetchLike = async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://api.modrinth.com/v2/version_files");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        "Content-Type": "application/json",
      });
      expect(init?.body).toBe(
        JSON.stringify({
          hashes: ["sha1-a", "sha1-b"],
          algorithm: "sha1",
        }),
      );

      return Response.json({
        "sha1-a": {
          files: [
            {
              filename: "demo-a.jar",
              url: "https://cdn.modrinth.com/data/demo/demo-a.jar",
              size: 123,
              hashes: {
                sha1: "sha1-a",
                sha512: "sha512-a",
              },
            },
          ],
        },
      });
    };

    await expect(fetchModrinthVersionsBySha1(["sha1-a", "sha1-b"], fetchLike)).resolves.toEqual({
      "sha1-a": {
        files: [
          {
            filename: "demo-a.jar",
            url: "https://cdn.modrinth.com/data/demo/demo-a.jar",
            size: 123,
            hashes: {
              sha1: "sha1-a",
              sha512: "sha512-a",
            },
          },
        ],
      },
    });
  });

  test("fails fast when the Modrinth response contains an invalid file URL value", async () => {
    const fetchLike = async () =>
      Response.json({
        "sha1-a": {
          files: [
            {
              filename: "demo-a.jar",
              url: null,
              size: 123,
              hashes: { sha1: "sha1-a" },
            },
          ],
        },
      });

    await expect(fetchModrinthVersionsBySha1(["sha1-a"], fetchLike)).rejects.toThrow(
      /files\.sha1-a\.files\[0\]\.url.*null/,
    );
  });
});
