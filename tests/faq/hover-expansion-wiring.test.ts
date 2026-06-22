import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const componentDirectory = join(process.cwd(), "components");

function readComponentSource(componentFileName: string): string {
  return readFileSync(join(componentDirectory, componentFileName), "utf8");
}

describe("FAQ hover expansion wiring", () => {
  test.each([
    "localized-converter-page.tsx",
    "localized-zip-to-mrpack-page.tsx",
  ])("%s wires hover expansion into FAQ accordion items", (componentFileName) => {
    const componentSource = readComponentSource(componentFileName);

    expect(componentSource).toContain("getHoverExpandedQuestions");
    expect(componentSource).toContain("getNextHoveredQuestionAfterLeave");
    expect(componentSource).toContain("hoverExpandedQuestions");
    expect(componentSource).toContain("onMouseEnter");
    expect(componentSource).toContain("onMouseLeave");
  });
});
