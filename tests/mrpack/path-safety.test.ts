import { describe, expect, test } from "vitest";

import { parseHttpUrl } from "@/lib/mrpack/input-validation";
import { normalizeOverridePath, validateArchivePath } from "@/lib/mrpack/path-safety";

describe("validateArchivePath", () => {
  test("accepts safe relative archive paths", () => {
    expect(validateArchivePath("mods/example.jar")).toBe("mods/example.jar");
    expect(validateArchivePath("config/nested/example.toml")).toBe("config/nested/example.toml");
  });

  test.each([
    "",
    "   ",
    "../mods/example.jar",
    "mods/../example.jar",
    "/mods/example.jar",
    "\\mods\\example.jar",
    "C:/mods/example.jar",
    "C:\\mods\\example.jar",
    "C:mods/example.jar",
    "mods/example\u0000.jar",
    "mods/./example.jar",
    "mods//example.jar",
    "mods/example.jar/",
  ])("rejects unsafe archive path %s", (archivePath) => {
    expect(() => validateArchivePath(archivePath)).toThrow(JSON.stringify(archivePath));
  });
});

describe("normalizeOverridePath", () => {
  test("removes overrides prefix from override files", () => {
    expect(normalizeOverridePath("overrides/config/a.toml")).toBe("config/a.toml");
    expect(normalizeOverridePath("client-overrides/config/client.toml")).toBe("config/client.toml");
    expect(normalizeOverridePath("server-overrides/config/server.toml")).toBe("config/server.toml");
  });

  test("returns null for non-override files", () => {
    expect(normalizeOverridePath("mods/example.jar")).toBeNull();
  });
});

describe("parseHttpUrl", () => {
  test.each(["not a url", "ftp://example.com/file.mrpack", "file:///tmp/file.mrpack"])(
    "rejects invalid or non-http URL %s",
    (urlText) => {
      expect(() => parseHttpUrl(urlText, "download URL")).toThrow(urlText);
    },
  );

  test("accepts http and https URLs", () => {
    expect(parseHttpUrl("https://example.com/file.mrpack", "download URL").href).toBe(
      "https://example.com/file.mrpack",
    );
    expect(parseHttpUrl("http://example.com/file.mrpack", "download URL").href).toBe(
      "http://example.com/file.mrpack",
    );
  });
});
