import { Loader2 } from "lucide-react";

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
      className="mt-4 rounded-xl border border-lime-300/20 bg-lime-300/[0.065] px-4 py-3 text-sm leading-6 text-lime-100"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-lime-300" />
          <span className="min-w-0 break-words font-semibold">{label}</span>
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
        className="mt-3 h-2 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 shadow-[0_0_18px_rgba(116,255,70,0.55)] transition-[width] duration-300"
          style={{ width: `${boundedProgressPercent}%` }}
        />
      </div>

      {fileCountProgressText ? (
        <p className="mt-2 text-xs font-medium text-lime-100/78">
          {fileCountProgressText}
        </p>
      ) : null}
    </div>
  );
}
