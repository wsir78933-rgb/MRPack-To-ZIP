import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

function expectSourceToContainEach(
  sourceText: string,
  requiredSourceFragments: string[],
) {
  for (const requiredSourceFragment of requiredSourceFragments) {
    expect(sourceText).toContain(requiredSourceFragment);
  }
}

function readSourceBetween(
  sourceText: string,
  startFragment: string,
  endFragment: string,
) {
  const startIndex = sourceText.indexOf(startFragment);
  const endIndex = sourceText.indexOf(endFragment, startIndex);

  if (startIndex === -1) {
    throw new Error(`Missing source fragment: ${startFragment}`);
  }

  if (endIndex === -1) {
    throw new Error(`Missing source fragment after ${startFragment}: ${endFragment}`);
  }

  return sourceText.slice(startIndex, endIndex);
}

describe("converter page layout", () => {
  test("uses the shared Minecraft workbench shell on both converter pages", () => {
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");

    expect(mrpackPageSource).toContain("MinecraftWorkbenchPage");
    expect(mrpackPageSource).toContain("MinecraftWorkbenchHeroShell");
    expect(mrpackPageSource).toContain("workbenchPanelClass");
    expect(zipPageSource).toContain("MinecraftWorkbenchPage");
    expect(zipPageSource).toContain("MinecraftWorkbenchHeroShell");
    expect(zipPageSource).toContain("workbenchPanelClass");
  });

  test("keeps the Box logo and supported conversion chips in the shared workbench chrome", () => {
    const sharedLayoutSource = readProjectFile("components/minecraft-workbench-layout.tsx");

    expect(sharedLayoutSource).toContain(
      'import { Box, Github, LockKeyhole, PackageOpen } from "lucide-react";',
    );
    expect(sharedLayoutSource).toContain(
      '<Box className="size-6 text-lime-400 drop-shadow-[0_0_16px_rgba(116,255,70,0.5)] sm:size-7" />',
    );
    expect(sharedLayoutSource).not.toContain("brand-mark");
    expect(sharedLayoutSource).toContain("chipListAriaLabel?: string");
    expect(sharedLayoutSource).toContain("aria-label={chipListAriaLabel}");
    expect(sharedLayoutSource).not.toContain('aria-label="Supported conversion flows"');
  });

  test("removes the glow toggle from shared converter navigation", () => {
    const sharedLayoutSource = readProjectFile("components/minecraft-workbench-layout.tsx");
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");

    expect(sharedLayoutSource).not.toContain("glowToggle");
    expect(sharedLayoutSource).not.toContain("isGlowEnabled &&");
    expect(mrpackPageSource).not.toContain("onGlowToggle");
    expect(mrpackPageSource).not.toContain("setIsGlowEnabled");
    expect(zipPageSource).not.toContain("setIsGlowEnabled");
  });

  test("keeps the MRPack state preview grid and launcher support row semantics", () => {
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");

    expect(mrpackPageSource).toMatch(/ConversionStatesSection|state-grid/);
    expect(mrpackPageSource).toMatch(/support-table|support-row/);
  });

  test("reads MRPack hero chips from localized copy", () => {
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");
    const mrpackCopySource = readProjectFile("lib/i18n/converter-page-copy.ts");

    expectSourceToContainEach(mrpackPageSource, [
      "chipListAriaLabel={copy.hero.chipListAriaLabel}",
      "chips={copy.hero.chips}",
    ]);
    expectSourceToContainEach(mrpackCopySource, [
      "'MRPack to ZIP'",
      "'CurseForge ZIP to MRPack'",
      "'Browser-first conversion'",
      "'MRPack 转 ZIP'",
      "'CurseForge ZIP 转 MRPack'",
      "'浏览器内转换'",
    ]);
    expect(mrpackPageSource).not.toContain('"CurseForge ZIP to MRPack"');
    expect(mrpackPageSource).not.toContain('"Browser-first conversion"');
  });

  test("keeps ZIP to MRPack hero chips descriptive without duplicated nav labels", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");
    const zipCopySource = readProjectFile("lib/i18n/zip-to-mrpack-page-copy.ts");

    expectSourceToContainEach(zipPageSource, [
      "getZipToMrpackHeroChips",
      "copy.hero.chips",
    ]);
    expectSourceToContainEach(zipCopySource, [
      "ZIP to MRPack",
      "CurseForge exports",
      "Browser conversion",
      "ZIP 转 MRPack",
      "CurseForge 导出",
      "浏览器内转换",
    ]);
    expect(zipPageSource).not.toContain("getEnglishZipToMrpackHeroChips");
    expect(zipPageSource).not.toContain("getChineseZipToMrpackHeroChips");
    expect(zipPageSource).not.toContain('"CurseForge exports"');
    expect(zipPageSource).not.toContain('"Browser conversion"');
    expect(zipPageSource).not.toContain('"CurseForge 导出"');
    expect(zipPageSource).not.toContain('"浏览器内转换"');
    expect(zipPageSource).not.toContain("copy.navLinks[0]?.label ?? copy.whatItConverts.title");
    expect(zipPageSource).not.toContain("copy.navLinks[1]?.label ?? copy.howToConvert.title");
  });

  test("reads ZIP language switch labels from localized copy", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");

    expect(zipPageSource).toContain("copy.languageSwitchLabel");
    expect(zipPageSource).not.toContain('const languageLabel = copy.localeCode === "zh-Hans" ? "EN" : "中文"');
  });

  test("reads MRPack preview and state labels from localized copy", () => {
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");

    expectSourceToContainEach(mrpackPageSource, [
      "copy.converterPanel.previewPanel.title",
      "copy.converterPanel.previewPanel.idleStatusLabel",
      "copy.converterPanel.previewPanel.outputSlotLabel",
      "copy.converterPanel.previewPanel.outputFileLabel",
      "copy.conversionStates.ariaLabel",
    ]);
    expect(mrpackPageSource).not.toContain("Crafting Converter");
    expect(mrpackPageSource).not.toContain('"Idle"');
    expect(mrpackPageSource).not.toContain("Output Slot");
    expect(mrpackPageSource).not.toContain("ZIP archive");
    expect(mrpackPageSource).not.toContain("Conversion states");
    expect(mrpackPageSource).not.toContain('title: copy.navLinks[0]?.label ?? "Idle"');
  });

  test("keeps launcher support table and rows with explicit table semantics", () => {
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");

    expect(mrpackPageSource).toContain('role="table"');
    expect(mrpackPageSource).toContain('role="row"');
  });

  test("uses the approved two-column MRPack info prose layout without the JSON mock panel", () => {
    const mrpackPageSource = readProjectFile("components/localized-converter-page.tsx");

    expect(mrpackPageSource).toContain("two-col");
    expect(mrpackPageSource).toContain("info.paragraphs.slice(0, 2)");
    expect(mrpackPageSource).toContain("info.paragraphs.slice(2)");
    expect(mrpackPageSource).not.toContain("modrinth.index.json");
  });

  test("keeps ZIP upload input, select button, and drag-drop wiring protected", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");

    expectSourceToContainEach(zipPageSource, [
      "ZipToMrpackPreviewPanel",
      "fileInputRef={fileInputRef}",
      "onFileDrop={handleFileDrop}",
      "onFileInputChange={handleFileInputChange}",
      'accept=".zip"',
      'type="file"',
      "onOpenFilePicker={() => fileInputRef.current?.click()}",
      "onClick={onOpenFilePicker}",
      "onDragOver={keepZipPanelDropZoneActive}",
      "onDrop={dropZipFile}",
      "disabled={isConversionRunning}",
    ]);
  });

  test("keeps ZIP idle, working, error, and success states protected", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");

    expectSourceToContainEach(zipPageSource, [
      'conversionRunState.status === "idle"',
      'conversionRunState.status === "working"',
      'conversionRunState.status === "error"',
      "ConversionProgressPanel",
      "getStageLabel(copy, conversionRunState.progress.stage)",
      "copy.uploadPanel.errorTitle",
      "conversionRunState.message",
      "copy.uploadPanel.successTitle",
      'role="progressbar"',
      "conversionRunState.result.matchedFileCount",
      "conversionRunState.result.bundledFileCount",
    ]);
  });

  test("keeps ZIP download, reset, invalid file, and selected file feedback protected", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");

    expectSourceToContainEach(zipPageSource, [
      "triggerMrpackDownload(",
      "conversionResult.outputMrpackBlob",
      "conversionResult.outputMrpackFileName",
      "onClick={() => onDownload(conversionRunState.result)}",
      "onClick={onResetConversion}",
      "onResetConversion={clearConversionResult}",
      "invalidFileName",
      "selectedFileName",
      "copy.uploadPanel.invalidFileMessage",
      "copy.uploadPanel.selectedFilePrefix",
      "copy.uploadPanel.readyMessage",
    ]);
  });

  test("keeps the ZIP to MRPack first-screen converter focused on upload and output slots", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");
    const previewPanelSource = readSourceBetween(
      zipPageSource,
      "function ZipToMrpackPreviewPanel",
      "function ZipToMrpackInfoSection",
    );
    const previewPanelShellSource = readSourceBetween(
      zipPageSource,
      "function ZipToMrpackPreviewPanel",
      "function ZipToMrpackSourceSlot",
    );
    const sourceSlotSource = readSourceBetween(
      zipPageSource,
      "function ZipToMrpackSourceSlot",
      "function getZipDropActiveText",
    );

    expectSourceToContainEach(previewPanelSource, [
      "function ZipToMrpackSourceSlot",
      "function ZipToMrpackOutputSlot",
      "lg:grid-cols-[minmax(0,1fr)_58px_minmax(220px,0.78fr)]",
      "isZipDropActive={isZipPanelDropActive}",
      "getZipDropActiveText(copy)",
      "copy.previewPanel.dropActiveLabel",
      "const hasUploadFeedback = invalidFileName || selectedFileName",
      "{hasUploadFeedback ? (",
      "ZipToMrpackStatusPanel",
    ]);
    expectSourceToContainEach(previewPanelShellSource, [
      "const [isZipPanelDropActive, setIsZipPanelDropActive] = useState(false)",
      "function activateZipPanelDropZone",
      "function keepZipPanelDropZoneActive",
      "function deactivateZipPanelDropZone",
      "function dropZipFile",
      'event.dataTransfer.dropEffect = "copy"',
      "workbenchPanelClass",
      '"zip-panel transition-[border-color,box-shadow,background-color] duration-150"',
      "onDragEnter={activateZipPanelDropZone}",
      "onDrop={dropZipFile}",
      "onDragLeave={deactivateZipPanelDropZone}",
      "onDragOver={keepZipPanelDropZoneActive}",
      "onFileDrop(event)",
    ]);
    expect(sourceSlotSource).not.toContain("const [isZipDropActive, setIsZipDropActive]");
    expect(sourceSlotSource).not.toContain("function activateZipDropZone");
    expect(sourceSlotSource).not.toContain("function keepZipDropZoneActive");
    expect(sourceSlotSource).not.toContain("function deactivateZipDropZone");
    expect(sourceSlotSource).not.toContain("onDragEnter=");
    expect(sourceSlotSource).not.toContain("onDragLeave=");
    expect(sourceSlotSource).not.toContain("onDragOver=");
    expect(sourceSlotSource).not.toContain("onDrop=");
    expect(previewPanelSource).not.toContain("workbenchMiniPanelClass");
    expect(previewPanelSource).not.toContain("copy.whatItConverts.paragraphs.map");
    expect(previewPanelSource).not.toContain("copy.howToConvert.steps.map");
    expect(previewPanelSource).not.toContain("<span>MRPack</span>");
  });

  test("reads ZIP preview panel labels from localized copy", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");
    const previewPanelSource = readSourceBetween(
      zipPageSource,
      "function ZipToMrpackPreviewPanel",
      "function ZipToMrpackInfoSection",
    );

    expectSourceToContainEach(previewPanelSource, [
      "copy.previewPanel.title",
      "copy.previewPanel.idleStatusLabel",
      "copy.previewPanel.dropActiveLabel",
      "copy.previewPanel.outputSlotLabel",
      "copy.previewPanel.outputFileLabel",
    ]);
    expect(previewPanelSource).not.toContain("Crafting Converter");
    expect(previewPanelSource).not.toContain('"Idle"');
    expect(previewPanelSource).not.toContain("Output Slot");
    expect(previewPanelSource).not.toContain("MRPack output");
    expect(previewPanelSource).not.toContain("Release to upload ZIP");
    expect(previewPanelSource).not.toContain("松开即可上传 ZIP");
  });

  test("uses the ZIP upload description for the idle status panel copy", () => {
    const zipPageSource = readProjectFile("components/localized-zip-to-mrpack-page.tsx");
    const sourceSlotSource = readSourceBetween(
      zipPageSource,
      "function ZipToMrpackSourceSlot",
      "function isDragStillInsideZipPanel",
    );
    const statusPanelSource = readSourceBetween(
      zipPageSource,
      "function ZipToMrpackStatusPanel",
      "function getStageLabel",
    );

    expect(sourceSlotSource).not.toContain("copy.uploadPanel.dropDescription");
    expect(statusPanelSource).toContain("copy.uploadPanel.dropDescription");
    expect(statusPanelSource).not.toContain("copy.hero.note");
  });

  test("keeps the approved split first-screen layout available on desktop", () => {
    const layoutSource = readProjectFile("components/minecraft-workbench-layout.tsx");

    expect(layoutSource).toContain("relative isolate min-h-[100dvh]");
    expect(layoutSource).toContain("min-h-[calc(100dvh-68px)]");
    expect(layoutSource).toContain("lg:grid-cols-[minmax(0,0.9fr)_minmax(430px,1.1fr)]");
    expect(layoutSource).toContain("grid-cols-1");
  });

  test("keeps the voxel cave background visible behind the workbench hero", () => {
    const layoutSource = readProjectFile("components/minecraft-workbench-layout.tsx");

    expect(layoutSource).toContain("url('/assets/mrpackzip-voxel-bg.png')");
    expect(layoutSource).toContain("brightness-[1.2]");
    expect(layoutSource).not.toContain("opacity-80 saturate-[1.2] contrast-[1.08] brightness-[1.08]");
  });

  test("uses visible selection colors for converter text inputs", () => {
    const componentSource = readProjectFile("components/localized-converter-page.tsx");

    expect(componentSource).toContain(
      "selection:bg-lime-300 selection:text-slate-950",
    );
  });

  test("keeps the MRPack upload mode aligned with the compact source slot layout", () => {
    const componentSource = readProjectFile("components/localized-converter-page.tsx");

    expectSourceToContainEach(componentSource, [
      "function UploadSourceForm",
      "copy.converterPanel.modes.upload.inputLabel",
      "copy.converterPanel.modes.upload.inputPlaceholder",
      "copy.converterPanel.selectButtonLabel",
      "isMrpackDropActive",
      "onClick={onOpenFilePicker}",
      "inline-flex size-10 shrink-0 items-center justify-center",
      "invalidFileMessageText ?? uploadStatusText",
    ]);
    expect(componentSource).toContain(
      'accept=".mrpack"\n          className="sr-only"\n          disabled={isConversionRunning}',
    );
    expect(componentSource).not.toContain('rounded-[18px] border border-dashed border-lime-300/34');
    expect(componentSource).not.toContain('size-[104px]');
    expect(componentSource).not.toContain("copy.converterPanel.dropTitle");
    expect(componentSource).not.toContain("copy.converterPanel.dropDescription");
  });

  test("keeps the full MRPack editor visually active while a file is dragged over it", () => {
    const componentSource = readProjectFile("components/localized-converter-page.tsx");
    const converterPanelSource = readSourceBetween(
      componentSource,
      "function ConverterPanel",
      "function InputSourceTabs",
    );
    const uploadSourceFormSource = readSourceBetween(
      componentSource,
      "function UploadSourceForm",
      "function ConversionStatusPanel",
    );

    expectSourceToContainEach(converterPanelSource, [
      "const [isMrpackPanelDropActive, setIsMrpackPanelDropActive] = useState(false)",
      "function activateMrpackPanelDropZone",
      "function keepMrpackPanelDropZoneActive",
      "function deactivateMrpackPanelDropZone",
      "function dropMrpackFile",
      "function isDragStillInsideMrpackPanel",
      'event.dataTransfer.dropEffect = "none"',
      'event.dataTransfer.dropEffect = "copy"',
      '"mrpack-panel transition-[border-color,box-shadow,background-color] duration-150"',
      "isMrpackPanelDropActive &&",
      "onDragEnter={activateMrpackPanelDropZone}",
      "onDragLeave={deactivateMrpackPanelDropZone}",
      "onDragOver={keepMrpackPanelDropZoneActive}",
      "onDrop={dropMrpackFile}",
      "isMrpackDropActive={isMrpackPanelDropActive}",
      "onFileDrop(event)",
    ]);
    expectSourceToContainEach(uploadSourceFormSource, [
      "isMrpackDropActive",
      "border-lime-300 bg-[linear-gradient(135deg,rgba(118,202,76,0.22),rgba(7,16,13,0.88))]",
      "shadow-[0_0_30px_rgba(118,202,76,0.22),inset_0_4px_0_rgba(0,0,0,0.28)]",
    ]);
    expect(uploadSourceFormSource).not.toContain("onDrop=");
    expect(uploadSourceFormSource).not.toContain("onDragOver=");
  });

  test("keeps SEO title and description metadata in i18n copy", () => {
    const seoCopySource = readProjectFile("lib/i18n/site-metadata-copy.ts");
    const seoSource = readProjectFile("lib/seo/site-metadata.ts");

    expect(seoCopySource).toContain(
      'title: "MRPack to ZIP Converter - Free Online Modrinth Modpack Tool"',
    );
    expect(seoCopySource).toContain(
      '"Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser."',
    );
    expect(seoCopySource).toContain(
      'title: "CurseForge ZIP to MRPack Converter - Free Online Tool"',
    );
    expect(seoCopySource).toContain(
      '"Convert CurseForge modpack ZIP exports into Modrinth-compatible MRPack files."',
    );
    expect(seoSource).toContain("getSiteMetadataCopy(routePath)");
    expect(seoSource).not.toContain(
      'title: "MRPack to ZIP Converter - Free Online Modrinth Modpack Tool"',
    );
    expect(seoSource).not.toContain(
      'title: "CurseForge ZIP to MRPack Converter - Free Online Tool"',
    );
  });

  test("keeps the existing English hero title and description copy references", () => {
    const mrpackCopySource = readProjectFile("lib/i18n/converter-page-copy.ts");
    const zipCopySource = readProjectFile("lib/i18n/zip-to-mrpack-page-copy.ts");

    expect(mrpackCopySource).toContain("titleStart: 'MRPack to ZIP'");
    expect(mrpackCopySource).toContain("titleAccent: 'Converter'");
    expect(mrpackCopySource).toContain(
      "'Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.'",
    );
    expect(zipCopySource).toContain(
      'title: "Convert CurseForge ZIP to MRPack"',
    );
    expect(zipCopySource).toContain(
      '"Convert CurseForge modpack exports into Modrinth-compatible .mrpack files."',
    );
  });
});
