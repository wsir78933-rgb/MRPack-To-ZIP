import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getBoundedProgressPercent,
  getFileCountProgressText,
  getProgressBarAccessibleText
} from "@/lib/conversion-progress/progress-display";

type ConversionProgressPanelProps = {
  label: string;
  percent: number;
  countLabel: string;
  currentFileCount?: number;
  totalFileCount?: number;
};

export function ConversionProgressPanel({
  countLabel,
  currentFileCount,
  label,
  percent,
  totalFileCount
}: ConversionProgressPanelProps) {
  const boundedProgressPercent = getBoundedProgressPercent(percent);
  const fileCountProgressText = getFileCountProgressText({
    countLabel,
    currentFileCount,
    totalFileCount
  });
  const progressBarAccessibleText = getProgressBarAccessibleText({
    label,
    percent
  });

  return (
    <div
      aria-live="polite"
      className="mt-4 border-2 border-lime-200/25 bg-lime-300/[0.07] px-4 py-3 text-sm leading-6 text-lime-100 shadow-[6px_6px_0_rgba(0,0,0,0.22),inset_0_2px_0_rgba(255,255,255,0.06)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-lime-300" />
          <span className="min-w-0 break-words font-black">{label}</span>
        </div>
        <span className="shrink-0 font-black tabular-nums text-lime-200">
          {boundedProgressPercent}%
        </span>
      </div>

      <div
        aria-label={progressBarAccessibleText}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedProgressPercent}
        className="mt-3 grid h-4 grid-cols-10 gap-1"
        role="progressbar"
      >
        {Array.from({ length: 10 }, (_, segmentIndex) => {
          const segmentThreshold = (segmentIndex + 1) * 10;
          const isFilledSegment = boundedProgressPercent >= segmentThreshold;

          return (
            <span
              aria-hidden="true"
              className={cn(
                "border border-[#f4e6bd1f] bg-[#f4e6bd1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                isFilledSegment &&
                  "border-lime-200/45 bg-[linear-gradient(180deg,#b7f276,#76ca4c)] shadow-[0_0_12px_rgba(118,202,76,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]"
              )}
              key={segmentIndex}
            />
          );
        })}
      </div>

      {fileCountProgressText ? (
        <p className="mt-2 text-xs font-medium text-lime-100/78">
          {fileCountProgressText}
        </p>
      ) : null}
    </div>
  );
}
