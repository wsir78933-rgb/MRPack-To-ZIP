import { describe, expect, test } from "vitest";

import {
  getFaqItemDomIds,
  uploadInputId,
} from "@/lib/mrpack/converter-dom-ids";

describe("converter DOM ids", () => {
  test("uses a stable file input id", () => {
    expect(uploadInputId).toBe("mrpack-upload-input");
  });

  test("builds stable FAQ trigger and content ids", () => {
    expect(getFaqItemDomIds(2)).toEqual({
      triggerId: "mrpack-faq-item-2-trigger",
      contentId: "mrpack-faq-item-2-content",
    });
  });

  test("fails fast for an invalid FAQ index", () => {
    expect(() => getFaqItemDomIds(-1)).toThrow("Invalid FAQ item index: -1");
  });
});
