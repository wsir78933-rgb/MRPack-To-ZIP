import { describe, expect, test } from "vitest";

import {
  getBoundedProgressPercent,
  getCompletedProgressPercentText,
  getFileCountProgressText,
  getProgressBarAccessibleText
} from "@/lib/conversion-progress/progress-display";

describe("conversion progress display", () => {
  test("bounds displayed progress percent", () => {
    expect(getBoundedProgressPercent(62.6)).toBe(63);
    expect(getBoundedProgressPercent(-8)).toBe(0);
    expect(getBoundedProgressPercent(128)).toBe(100);
  });

  test("fails fast for non-finite progress percent", () => {
    expect(() => getBoundedProgressPercent(Number.NaN)).toThrow(
      "Progress percent must be finite; received NaN."
    );
  });

  test("formats processed file counts when both values exist", () => {
    expect(
      getFileCountProgressText({
        countLabel: "Processed referenced files",
        currentFileCount: 12,
        totalFileCount: 34
      })
    ).toBe("Processed referenced files: 12/34");
  });

  test("formats progressbar accessible text from stage and percent", () => {
    expect(
      getProgressBarAccessibleText({
        label: "Downloading referenced files...",
        percent: 62.4
      })
    ).toBe("Downloading referenced files... 62%");
  });

  test("formats completed progress percent text", () => {
    expect(getCompletedProgressPercentText()).toBe("100%");
  });

  test("omits file count text before calculable counts exist", () => {
    expect(
      getFileCountProgressText({
        countLabel: "Processed referenced files"
      })
    ).toBeNull();
  });

  test("fails fast when only one file count value exists", () => {
    expect(() =>
      getFileCountProgressText({
        countLabel: "Processed referenced files",
        currentFileCount: 1
      })
    ).toThrow("Both currentFileCount and totalFileCount are required together.");
  });

  test("fails fast for impossible processed file counts", () => {
    expect(() =>
      getFileCountProgressText({
        countLabel: "Processed referenced files",
        currentFileCount: 4,
        totalFileCount: 3
      })
    ).toThrow("currentFileCount cannot exceed totalFileCount; received 4/3.");
  });
});
