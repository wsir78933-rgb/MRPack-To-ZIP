import { describe, expect, test } from "vitest";

import EnglishZipToMrpackRedirectPage from "@/app/(en)/en/zip-to-mrpack/page";
import EnglishRedirectPage from "@/app/(en)/en/page";

function getRedirectDigest(caughtError: unknown) {
  if (
    caughtError &&
    typeof caughtError === "object" &&
    "digest" in caughtError &&
    typeof caughtError.digest === "string"
  ) {
    return caughtError.digest;
  }

  return null;
}

describe("/en redirect", () => {
  test("permanently redirects to the English root route", () => {
    let caughtError: unknown;

    try {
      EnglishRedirectPage();
    } catch (error) {
      caughtError = error;
    }

    expect(getRedirectDigest(caughtError)).toBe("NEXT_REDIRECT;replace;/;308;");
  });

  test("permanently redirects the English ZIP to MRPack route to the default English path", () => {
    let caughtError: unknown;

    try {
      EnglishZipToMrpackRedirectPage();
    } catch (error) {
      caughtError = error;
    }

    expect(getRedirectDigest(caughtError)).toBe(
      "NEXT_REDIRECT;replace;/zip-to-mrpack;308;",
    );
  });
});
