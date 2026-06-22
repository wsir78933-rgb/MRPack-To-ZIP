export function getNextConversionRunId(currentConversionRunId: number) {
  assertConversionRunId("currentConversionRunId", currentConversionRunId);
  return currentConversionRunId + 1;
}

export function isActiveConversionRun({
  activeConversionRunId,
  conversionRunId
}: {
  activeConversionRunId: number;
  conversionRunId: number;
}) {
  assertConversionRunId("activeConversionRunId", activeConversionRunId);
  assertConversionRunId("conversionRunId", conversionRunId);
  return activeConversionRunId === conversionRunId;
}

function assertConversionRunId(fieldName: string, fieldValue: number) {
  if (!Number.isSafeInteger(fieldValue) || fieldValue < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer; received ${fieldValue}.`);
  }
}
