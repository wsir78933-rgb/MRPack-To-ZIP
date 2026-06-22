import { describe, expect, test } from "vitest";

import { getFaqBulkToggleState } from "@/lib/faq/bulk-toggle";

describe("getFaqBulkToggleState", () => {
  const faqQuestions = [
    "Is the converter browser-based?",
    "Will my file be uploaded?",
    "Why convert .mrpack to ZIP?"
  ];

  test("shows open label and expands every FAQ when not all questions are open", () => {
    const toggleState = getFaqBulkToggleState({
      closeAllLabel: "Close all",
      expandedQuestions: [faqQuestions[0]],
      faqQuestions,
      openAllLabel: "Open all"
    });

    expect(toggleState.buttonLabel).toBe("Open all");
    expect(toggleState.nextExpandedQuestions).toEqual(faqQuestions);
  });

  test("shows close label and closes every FAQ when all questions are open", () => {
    const toggleState = getFaqBulkToggleState({
      closeAllLabel: "Close all",
      expandedQuestions: faqQuestions,
      faqQuestions,
      openAllLabel: "Open all"
    });

    expect(toggleState.buttonLabel).toBe("Close all");
    expect(toggleState.nextExpandedQuestions).toEqual([]);
  });
});
