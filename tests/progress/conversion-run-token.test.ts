import { describe, expect, test } from "vitest";

import {
  getNextConversionRunId,
  isActiveConversionRun
} from "@/lib/conversion-progress/conversion-run-token";

describe("conversion run token", () => {
  test("creates the next conversion run id", () => {
    expect(getNextConversionRunId(0)).toBe(1);
    expect(getNextConversionRunId(41)).toBe(42);
  });

  test("checks whether a conversion run is still active", () => {
    expect(
      isActiveConversionRun({
        activeConversionRunId: 3,
        conversionRunId: 3
      })
    ).toBe(true);
    expect(
      isActiveConversionRun({
        activeConversionRunId: 4,
        conversionRunId: 3
      })
    ).toBe(false);
  });

  test("fails fast for invalid run ids", () => {
    expect(() => getNextConversionRunId(-1)).toThrow(
      "currentConversionRunId must be a non-negative safe integer; received -1."
    );
  });
});
