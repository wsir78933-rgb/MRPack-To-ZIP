import { describe, expect, test } from "vitest";

import nextConfig from "@/next.config";

describe("security response headers", () => {
  test("applies conservative browser security headers to all routes", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("nextConfig.headers must be a function.");
    }

    await expect(nextConfig.headers()).resolves.toEqual([
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()",
          },
        ],
      },
    ]);
  });
});
