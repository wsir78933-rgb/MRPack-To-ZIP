type SelectableInputElement = {
  select: () => void;
};

export function selectInputTextOnDoubleClick({
  inputElement,
  inputType
}: {
  inputElement: SelectableInputElement;
  inputType: "text" | "url";
}) {
  if (inputType !== "url") {
    return false;
  }

  inputElement.select();
  return true;
}
