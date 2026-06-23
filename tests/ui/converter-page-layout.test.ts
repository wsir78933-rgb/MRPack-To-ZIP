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
