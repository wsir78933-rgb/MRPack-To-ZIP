export function getBoundedProgressPercent(progressPercent: number) {
  if (!Number.isFinite(progressPercent)) {
    throw new Error(`Progress percent must be finite; received ${progressPercent}.`);
  }

  return Math.min(100, Math.max(0, Math.round(progressPercent)));
}

export function getProgressBarAccessibleText({
  label,
  percent
}: {
  label: string;
  percent: number;
}) {
  return `${label} ${getBoundedProgressPercent(percent)}%`;
}

export function getCompletedProgressPercentText() {
  return "100%";
}

export function getFileCountProgressText({
  countLabel,
  currentFileCount,
  totalFileCount
}: {
  countLabel: string;
  currentFileCount?: number;
  totalFileCount?: number;
}) {
  if (currentFileCount === undefined || totalFileCount === undefined) {
    if (currentFileCount !== undefined || totalFileCount !== undefined) {
      throw new Error("Both currentFileCount and totalFileCount are required together.");
    }

    return null;
  }

  assertNonNegativeInteger("currentFileCount", currentFileCount);
  assertNonNegativeInteger("totalFileCount", totalFileCount);

  if (currentFileCount > totalFileCount) {
    throw new Error(
      `currentFileCount cannot exceed totalFileCount; received ${currentFileCount}/${totalFileCount}.`
    );
  }

  return `${countLabel}: ${currentFileCount}/${totalFileCount}`;
}

function assertNonNegativeInteger(fieldName: string, fieldValue: number) {
  if (!Number.isInteger(fieldValue) || fieldValue < 0) {
    throw new Error(`${fieldName} must be a non-negative integer; received ${fieldValue}.`);
  }
}
