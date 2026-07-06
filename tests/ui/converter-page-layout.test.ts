import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const projectRoot = process.cwd();

describe("converter page layout", () => {
  test("uses wider desktop containers for homepage content sections", () => {
    const componentSource = readFileSync(
      join(projectRoot, "components/localized-converter-page.tsx"),
      "utf8",
    );

    expect(componentSource).toContain("mx-auto mt-8 max-w-[1040px]");
    expect(componentSource).toContain("mx-auto mt-12 max-w-[1040px]");
    expect(componentSource).not.toContain("mx-auto mt-8 max-w-[900px]");
    expect(componentSource).not.toContain("mx-auto mt-12 max-w-[900px]");
  });

  test("uses homepage-width containers for zip to mrpack content sections", () => {
    const componentSource = readFileSync(
      join(projectRoot, "components/localized-zip-to-mrpack-page.tsx"),
      "utf8",
    );

    expect(componentSource).toContain(
      "mx-auto w-full max-w-[1120px] px-4 pb-14 pt-9 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12",
    );
    expect(componentSource.split("mx-auto mt-8 max-w-[1040px]").length - 1).toBe(1);
    expect(componentSource.split("mx-auto mt-12 max-w-[1040px]").length - 1).toBe(2);
    expect(componentSource).not.toContain("mx-auto w-full max-w-[960px]");
    expect(componentSource).not.toContain("mx-auto mt-8 max-w-[820px]");
    expect(componentSource).not.toContain("mx-auto mt-12 max-w-[820px]");
  });

  test("uses visible selection colors for converter text inputs", () => {
    const componentSource = readFileSync(
      join(projectRoot, "components/localized-converter-page.tsx"),
      "utf8",
    );

    expect(componentSource).toContain(
      "selection:bg-lime-300 selection:text-slate-950",
    );
  });
});
