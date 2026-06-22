export type FailedDownload = {
  path: string;
  attemptedUrls: string[];
  reasons: string[];
};

export function formatFailedDownloadsReport(failedDownloads: FailedDownload[]) {
  const reportLines = [
    "Some referenced files could not be downloaded.",
    "Download these files manually and place them at the listed output paths.",
    "",
  ];

  for (const failedDownload of failedDownloads) {
    reportLines.push(`Path: ${failedDownload.path}`);
    reportLines.push("Attempted URLs:");
    for (const attemptedUrl of failedDownload.attemptedUrls) {
      reportLines.push(`- ${attemptedUrl}`);
    }
    reportLines.push("Reasons:");
    for (const reason of failedDownload.reasons) {
      reportLines.push(`- ${reason}`);
    }
    reportLines.push("");
  }

  return reportLines.join("\n");
}
