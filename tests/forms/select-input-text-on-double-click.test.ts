import { describe, expect, test, vi } from "vitest";

import { selectInputTextOnDoubleClick } from "@/lib/forms/select-input-text-on-double-click";

describe("selectInputTextOnDoubleClick", () => {
  test("selects the whole URL input value on double click", () => {
    const selectWholeInputText = vi.fn();

    const didSelectInputText = selectInputTextOnDoubleClick({
      inputElement: { select: selectWholeInputText },
      inputType: "url"
    });

    expect(didSelectInputText).toBe(true);
    expect(selectWholeInputText).toHaveBeenCalledOnce();
  });

  test("does not change normal text input selection", () => {
    const selectWholeInputText = vi.fn();

    const didSelectInputText = selectInputTextOnDoubleClick({
      inputElement: { select: selectWholeInputText },
      inputType: "text"
    });

    expect(didSelectInputText).toBe(false);
    expect(selectWholeInputText).not.toHaveBeenCalled();
  });
});
