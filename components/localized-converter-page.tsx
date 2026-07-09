"use client";

import type {
  ChangeEvent,
  DragEvent,
  ReactNode
} from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileArchive,
  FileSearch,
  FileText,
  HelpCircle,
  Loader2,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Upload,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { ConversionProgressPanel } from "@/components/conversion-progress-panel";
import {
  MinecraftWorkbenchContentSection,
  MinecraftWorkbenchFooter,
  MinecraftWorkbenchHeroCopy,
  MinecraftWorkbenchHeroShell,
  MinecraftWorkbenchPage,
  MinecraftWorkbenchSectionHeading,
  MinecraftWorkbenchSummaryValue,
  MinecraftWorkbenchTopNavigation,
  workbenchInfoPanelClass,
  workbenchInnerSlotClass,
  workbenchMiniPanelClass,
  workbenchPanelClass,
  workbenchPrimaryButtonClass,
  workbenchSecondaryButtonClass
} from "@/components/minecraft-workbench-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getNextConversionRunId,
  isActiveConversionRun
} from "@/lib/conversion-progress/conversion-run-token";
import { getCompletedProgressPercentText } from "@/lib/conversion-progress/progress-display";
import { getFaqBulkToggleState } from "@/lib/faq/bulk-toggle";
import { selectInputTextOnDoubleClick } from "@/lib/forms/select-input-text-on-double-click";
import {
  getHoverExpandedQuestions,
  getNextHoveredQuestionAfterVisibleChange,
  getNextManualExpandedQuestionsAfterVisibleChange,
  getNextHoveredQuestionAfterLeave
} from "@/lib/faq/hover-expansion";
import { formatConversionErrorForLocale } from "@/lib/i18n/conversion-error-formatting";
import type {
  ConverterModeCopy,
  ConverterPageCopy,
  FaqItemCopy,
  InfoSectionCopy,
  LauncherSupportCopy,
  LauncherSupportLevel,
  LauncherSupportRowCopy,
  StepsSectionCopy
} from "@/lib/i18n/converter-page-copy";
import {
  converterInputModes,
  runMrpackConversionWorkflow,
  type CompletedConversionResult,
  type ConverterInputMode,
  type ConversionWorkflowProgress
} from "@/lib/mrpack/conversion-workflow";
import {
  getFaqItemDomIds,
  uploadInputId
} from "@/lib/mrpack/converter-dom-ids";
import { isMrpackFileName } from "@/lib/mrpack/input-validation";
import {
  buildConverterStructuredData,
  type PageStructuredData
} from "@/lib/seo/structured-data";
import type { SiteRoutePath } from "@/lib/seo/site-metadata";
import { cn } from "@/lib/utils";

type LocalizedConverterPageProps = {
  copy: ConverterPageCopy;
};

const supportLevelClasses: Record<LauncherSupportLevel, string> = {
  yes: "border-lime-300/30 bg-lime-300/10 text-lime-200",
  partial: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  no: "border-slate-400/25 bg-slate-300/8 text-slate-200"
};

const converterInputModeIcons: Record<ConverterInputMode, LucideIcon> = {
  project: FileSearch,
  url: ExternalLink,
  upload: Upload
};

type ConversionRunState =
  | { status: "idle" }
  | { status: "working"; progress: ConversionWorkflowProgress }
  | { status: "done"; result: CompletedConversionResult }
  | { status: "error"; message: string };

type StartConversionOptions = {
  inputMode?: ConverterInputMode;
  selectedUploadFile?: File | null;
};

function getEmptyInputMessage({
  activeInputMode,
  copy,
  mrpackDownloadUrl,
  projectIdOrSlug,
  selectedFile
}: {
  activeInputMode: ConverterInputMode;
  copy: ConverterPageCopy;
  mrpackDownloadUrl: string;
  projectIdOrSlug: string;
  selectedFile: File | null;
}) {
  if (activeInputMode === "project" && projectIdOrSlug.trim().length === 0) {
    return copy.converterPanel.emptyInputMessages.project;
  }

  if (activeInputMode === "url" && mrpackDownloadUrl.trim().length === 0) {
    return copy.converterPanel.emptyInputMessages.url;
  }

  if (activeInputMode === "upload" && !selectedFile) {
    return copy.converterPanel.emptyInputMessages.upload;
  }

  return null;
}

function triggerZipDownload(outputZipBlob: Blob, outputZipFileName: string) {
  const outputZipUrl = URL.createObjectURL(outputZipBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = outputZipUrl;
  downloadLink.download = outputZipFileName;
  downloadLink.rel = "noopener";
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => URL.revokeObjectURL(outputZipUrl), 0);
}

export function LocalizedConverterPage({ copy }: LocalizedConverterPageProps) {
  const [activeInputMode, setActiveInputMode] =
    useState<ConverterInputMode>("project");
  const [projectIdOrSlug, setProjectIdOrSlug] = useState("");
  const [mrpackDownloadUrl, setMrpackDownloadUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invalidFileName, setInvalidFileName] = useState<string | null>(null);
  const [conversionRunState, setConversionRunState] =
    useState<ConversionRunState>({ status: "idle" });
  const [expandedFaqQuestions, setExpandedFaqQuestions] = useState<string[]>([]);
  const activeConversionRunIdRef = useRef(0);

  const selectedFileName = selectedFile?.name ?? null;
  const structuredData = buildConverterStructuredData({
    copy,
    routePath: getConverterRoutePath(copy.localeCode)
  });

  function resetConversionRunState() {
    activeConversionRunIdRef.current = getNextConversionRunId(
      activeConversionRunIdRef.current
    );
    setConversionRunState({ status: "idle" });
  }

  function clearConversionResult() {
    resetConversionRunState();

    if (activeInputMode === "upload") {
      setSelectedFile(null);
      setInvalidFileName(null);
    }
  }

  function startNewConversionRun() {
    const nextConversionRunId = getNextConversionRunId(
      activeConversionRunIdRef.current
    );

    activeConversionRunIdRef.current = nextConversionRunId;
    return nextConversionRunId;
  }

  function isCurrentConversionRun(conversionRunId: number) {
    return isActiveConversionRun({
      activeConversionRunId: activeConversionRunIdRef.current,
      conversionRunId
    });
  }

  function updateActiveInputMode(nextInputMode: ConverterInputMode) {
    setActiveInputMode(nextInputMode);
    setInvalidFileName(null);
    resetConversionRunState();
  }

  function updateProjectIdOrSlug(nextProjectIdOrSlug: string) {
    setProjectIdOrSlug(nextProjectIdOrSlug);
    resetConversionRunState();
  }

  function updateMrpackDownloadUrl(nextMrpackDownloadUrl: string) {
    setMrpackDownloadUrl(nextMrpackDownloadUrl);
    resetConversionRunState();
  }

  function applySelectedUploadFile(nextSelectedFile: File | null) {
    resetConversionRunState();

    if (!nextSelectedFile) {
      setSelectedFile(null);
      setInvalidFileName(null);
      return null;
    }

    if (!isMrpackFileName(nextSelectedFile.name)) {
      setSelectedFile(null);
      setInvalidFileName(nextSelectedFile.name);
      return null;
    }

    setSelectedFile(nextSelectedFile);
    setInvalidFileName(null);
    return nextSelectedFile;
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSelectedFile = event.currentTarget.files?.[0] ?? null;
    const validSelectedFile = applySelectedUploadFile(nextSelectedFile);

    if (nextSelectedFile) {
      event.currentTarget.value = "";
    }

    if (validSelectedFile) {
      void startConversion({
        inputMode: "upload",
        selectedUploadFile: validSelectedFile
      });
    }
  }

  function handleFileDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files.item(0);
    const validDroppedFile = applySelectedUploadFile(droppedFile);

    if (validDroppedFile) {
      void startConversion({
        inputMode: "upload",
        selectedUploadFile: validDroppedFile
      });
    }
  }

  async function startConversion(
    startConversionOptions: StartConversionOptions = {}
  ) {
    const conversionRunId = startNewConversionRun();
    const conversionInputMode = startConversionOptions.inputMode ?? activeInputMode;
    const selectedUploadFile =
      conversionInputMode === "upload"
        ? "selectedUploadFile" in startConversionOptions
          ? startConversionOptions.selectedUploadFile ?? null
          : selectedFile
        : null;
    const emptyInputMessage = getEmptyInputMessage({
      activeInputMode: conversionInputMode,
      copy,
      projectIdOrSlug,
      mrpackDownloadUrl,
      selectedFile: selectedUploadFile
    });

    if (emptyInputMessage) {
      if (isCurrentConversionRun(conversionRunId)) {
        setConversionRunState({ status: "error", message: emptyInputMessage });
      }
      return;
    }

    try {
      const completedConversionResult = await runMrpackConversionWorkflow({
        inputMode: conversionInputMode,
        mrpackDownloadUrl,
        projectIdOrSlug,
        selectedFile: selectedUploadFile,
        onProgress: (progress) => {
          if (!isCurrentConversionRun(conversionRunId)) {
            return;
          }

          setConversionRunState({
            status: "working",
            progress
          });
        }
      });

      if (!isCurrentConversionRun(conversionRunId)) {
        return;
      }

      setConversionRunState({
        status: "done",
        result: completedConversionResult
      });
    } catch (caughtError) {
      if (!isCurrentConversionRun(conversionRunId)) {
        return;
      }

      setConversionRunState({
        status: "error",
        message: formatConversionErrorForLocale(caughtError, copy.localeCode)
      });
    }
  }

  function toggleAllFaqQuestions() {
    setExpandedFaqQuestions((currentQuestions) =>
      getFaqBulkToggleState({
        closeAllLabel: copy.faq.closeAllLabel,
        expandedQuestions: currentQuestions,
        faqQuestions: copy.faq.items.map((faqItem) => faqItem.question),
        openAllLabel: copy.faq.viewAllLabel
      }).nextExpandedQuestions
    );
  }

  return (
    <MinecraftWorkbenchPage lang={copy.localeCode}>
      <StructuredDataScript structuredData={structuredData} />
      <div className="relative z-10">
        <TopNavigation copy={copy} />

        <MinecraftWorkbenchHeroShell
          converter={
            <ConverterPanel
              copy={copy}
              activeInputMode={activeInputMode}
              conversionRunState={conversionRunState}
              inputId={uploadInputId}
              invalidFileName={invalidFileName}
              mrpackDownloadUrl={mrpackDownloadUrl}
              projectIdOrSlug={projectIdOrSlug}
              selectedFileName={selectedFileName}
              onActiveInputModeChange={updateActiveInputMode}
              onFileDrop={handleFileDrop}
              onFileInputChange={handleFileInputChange}
              onMrpackDownloadUrlChange={updateMrpackDownloadUrl}
              onProjectIdOrSlugChange={updateProjectIdOrSlug}
              onResetConversion={clearConversionResult}
              onStartConversion={startConversion}
            />
          }
        >
          <Hero copy={copy} />
        </MinecraftWorkbenchHeroShell>

        <ConversionStatesSection copy={copy} />
        <InfoSection info={copy.mrpackInfo} />
        <HowToConvertSection sectionCopy={copy.howToConvert} />
        <ConverterLimitsSection info={copy.converterLimits} />
        <LauncherSupportSection launcherSupport={copy.launcherSupport} />
        <FaqSection
          expandedQuestions={expandedFaqQuestions}
          closeAllLabel={copy.faq.closeAllLabel}
          faqItems={copy.faq.items}
          title={copy.faq.title}
          viewAllLabel={copy.faq.viewAllLabel}
          onToggleAllQuestions={toggleAllFaqQuestions}
          onExpandedQuestionsChange={setExpandedFaqQuestions}
        />

        <PageFooter copy={copy} />
      </div>
    </MinecraftWorkbenchPage>
  );
}

function getConverterRoutePath(localeCode: string): SiteRoutePath {
  return localeCode === "zh-Hans" ? "/zh" : "/";
}

function StructuredDataScript({
  structuredData
}: {
  structuredData: PageStructuredData;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function TopNavigation({
  copy
}: {
  copy: ConverterPageCopy;
}) {
  const logoHref = copy.localeCode === "zh-Hans" ? "/zh" : "/";
  const languageHref = copy.localeCode === "zh-Hans" ? "/" : "/zh";

  return (
    <MinecraftWorkbenchTopNavigation
      languageHref={languageHref}
      languageLabel={copy.languageSwitchLabel}
      logoAccent={copy.logoAccent}
      logoHref={logoHref}
      logoText={copy.logoText}
      navLinks={copy.navLinks}
    />
  );
}

function Hero({ copy }: { copy: ConverterPageCopy }) {
  return (
    <MinecraftWorkbenchHeroCopy
      badge={copy.hero.badge}
      chipListAriaLabel={copy.hero.chipListAriaLabel}
      chips={copy.hero.chips}
      description={copy.hero.description}
      note={copy.hero.note}
    >
      <h1 className="mt-5 max-w-[10ch] text-[clamp(50px,6.6vw,86px)] font-black leading-[0.88] tracking-[-0.075em] text-[#f4f7ef] drop-shadow-[0_5px_0_rgba(0,0,0,0.34)]">
        <HeroTitleStart titleStart={copy.hero.titleStart} />
        <span className="block text-[#b7f276]">{copy.hero.titleAccent}</span>
      </h1>
    </MinecraftWorkbenchHeroCopy>
  );
}

function HeroTitleStart({ titleStart }: { titleStart: string }) {
  const [firstWord, ...remainingWords] = titleStart.split(" ");
  const remainingTitle = remainingWords.join(" ");

  if (!remainingTitle) {
    return <span className="block">{titleStart}</span>;
  }

  return (
    <span className="block">
      <span className="block sm:inline">{firstWord}</span>
      {" "}
      <span className="block sm:inline sm:pl-[0.22em]">{remainingTitle}</span>
    </span>
  );
}

function ConverterPanel({
  activeInputMode,
  conversionRunState,
  copy,
  inputId,
  invalidFileName,
  mrpackDownloadUrl,
  onActiveInputModeChange,
  onFileDrop,
  onFileInputChange,
  onMrpackDownloadUrlChange,
  onProjectIdOrSlugChange,
  onResetConversion,
  onStartConversion,
  projectIdOrSlug,
  selectedFileName
}: {
  activeInputMode: ConverterInputMode;
  conversionRunState: ConversionRunState;
  copy: ConverterPageCopy;
  inputId: string;
  invalidFileName: string | null;
  mrpackDownloadUrl: string;
  onActiveInputModeChange: (inputMode: ConverterInputMode) => void;
  onFileDrop: (event: DragEvent<HTMLElement>) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMrpackDownloadUrlChange: (mrpackDownloadUrl: string) => void;
  onProjectIdOrSlugChange: (projectIdOrSlug: string) => void;
  onResetConversion: () => void;
  onStartConversion: () => void;
  projectIdOrSlug: string;
  selectedFileName: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isConversionRunning = conversionRunState.status === "working";
  const [isMrpackPanelDropActive, setIsMrpackPanelDropActive] = useState(false);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function activateMrpackPanelDropZone(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    if (isConversionRunning) {
      event.dataTransfer.dropEffect = "none";
      setIsMrpackPanelDropActive(false);
      return;
    }

    event.dataTransfer.dropEffect = "copy";
    setIsMrpackPanelDropActive(true);
  }

  function keepMrpackPanelDropZoneActive(event: DragEvent<HTMLElement>) {
    activateMrpackPanelDropZone(event);
  }

  function deactivateMrpackPanelDropZone(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    if (isDragStillInsideMrpackPanel(event.currentTarget, event.relatedTarget)) {
      return;
    }

    setIsMrpackPanelDropActive(false);
  }

  function dropMrpackFile(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsMrpackPanelDropActive(false);

    if (isConversionRunning) {
      return;
    }

    onFileDrop(event);
  }

  return (
    <section
      id="converter"
      className={cn(
        workbenchPanelClass,
        "mrpack-panel transition-[border-color,box-shadow,background-color] duration-150",
        isMrpackPanelDropActive &&
          "border-lime-300/85 bg-[linear-gradient(180deg,rgba(56,78,52,0.98),rgba(17,26,21,0.98))] shadow-[0_0_38px_rgba(118,202,76,0.24),14px_16px_0_rgba(0,0,0,0.34),inset_0_3px_0_rgba(255,255,255,0.1),inset_0_-7px_0_rgba(0,0,0,0.2)]"
      )}
      onDragEnter={activateMrpackPanelDropZone}
      onDragLeave={deactivateMrpackPanelDropZone}
      onDragOver={keepMrpackPanelDropZoneActive}
      onDrop={dropMrpackFile}
    >
      <span className="pointer-events-none absolute inset-3 rounded-[12px] border border-dashed border-[#f4e6bd1f]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <h2 className="text-lg font-black uppercase tracking-[0.09em] text-[#f4e6bd]">
            {copy.converterPanel.previewPanel.title}
          </h2>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#b7f276]">
            <span className="size-2.5 bg-[#76ca4c] shadow-[0_0_14px_rgba(118,202,76,0.72)]" />
            {isConversionRunning
              ? copy.converterPanel.convertingButtonLabel
              : copy.converterPanel.previewPanel.idleStatusLabel}
          </span>
        </div>

        <input
          aria-label={copy.converterPanel.modes.upload.inputLabel}
          accept=".mrpack"
          className="sr-only"
          disabled={isConversionRunning}
          id={inputId}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
          onChange={onFileInputChange}
        />

        <InputSourceTabs
          activeInputMode={activeInputMode}
          copy={copy}
          disabled={isConversionRunning}
          onInputModeChange={onActiveInputModeChange}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_58px_minmax(0,0.78fr)] lg:items-stretch">
          <div className={cn(workbenchInnerSlotClass, "p-4")}>
            {activeInputMode === "project" ? (
              <TextSourceForm
                convertingButtonLabel={copy.converterPanel.convertingButtonLabel}
                disabled={isConversionRunning}
                inputId="source-input-project"
                inputModeCopy={copy.converterPanel.modes.project}
                inputType="text"
                value={projectIdOrSlug}
                onStartConversion={onStartConversion}
                onValueChange={onProjectIdOrSlugChange}
              />
            ) : null}

            {activeInputMode === "url" ? (
              <TextSourceForm
                convertingButtonLabel={copy.converterPanel.convertingButtonLabel}
                disabled={isConversionRunning}
                inputId="source-input-url"
                inputModeCopy={copy.converterPanel.modes.url}
                inputType="url"
                value={mrpackDownloadUrl}
                onStartConversion={onStartConversion}
                onValueChange={onMrpackDownloadUrlChange}
              />
            ) : null}

            {activeInputMode === "upload" ? (
              <UploadSourceForm
                copy={copy}
                disabled={isConversionRunning}
                inputId={inputId}
                invalidFileName={invalidFileName}
                isMrpackDropActive={isMrpackPanelDropActive}
                selectedFileName={selectedFileName}
                onOpenFilePicker={openFilePicker}
              />
            ) : null}
          </div>

          <div className="flex min-h-9 items-center justify-center text-5xl font-black text-[#b7f276] drop-shadow-[0_0_18px_rgba(118,202,76,0.42)] lg:min-h-0">
            <span className="rotate-90 lg:rotate-0">›</span>
          </div>

          <div className={cn(workbenchInnerSlotClass, "flex flex-col justify-between p-4")}>
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.09em] text-[#f4e6bd]">
                {copy.converterPanel.previewPanel.outputSlotLabel}
              </p>
              <div className="flex min-h-[54px] items-center justify-between border-2 border-cyan-200/45 bg-[linear-gradient(135deg,rgba(104,217,233,0.28),rgba(7,16,13,0.55)),#081214] px-3 text-sm font-bold text-cyan-50 opacity-75 shadow-[inset_0_4px_0_rgba(0,0,0,0.34)]">
                <span>{copy.converterPanel.previewPanel.outputFileLabel}</span>
                <span className="size-7 border-2 border-white/30 bg-[linear-gradient(135deg,#baf8ff,#68d9e9_55%,#237a85_56%)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]" />
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#b8c3b2]">
              {copy.converterPanel.privacyNote}
            </p>
          </div>
        </div>

        <ConversionStatusPanel
          conversionRunState={conversionRunState}
          copy={copy}
          onDownload={(completedConversionResult) =>
            triggerZipDownload(
              completedConversionResult.outputZipBlob,
              completedConversionResult.outputZipFileName
            )
          }
          onResetConversion={onResetConversion}
        />
      </div>
    </section>
  );
}

function isDragStillInsideMrpackPanel(
  mrpackPanelElement: HTMLElement,
  nextDragTarget: EventTarget | null
) {
  return nextDragTarget instanceof Node && mrpackPanelElement.contains(nextDragTarget);
}

function InputSourceTabs({
  activeInputMode,
  copy,
  disabled,
  onInputModeChange
}: {
  activeInputMode: ConverterInputMode;
  copy: ConverterPageCopy;
  disabled: boolean;
  onInputModeChange: (inputMode: ConverterInputMode) => void;
}) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      {converterInputModes.map((inputMode) => {
        const inputModeCopy = copy.converterPanel.modes[inputMode];
        const InputModeIcon = converterInputModeIcons[inputMode];
        const isActiveInputMode = activeInputMode === inputMode;

        return (
          <button
            aria-pressed={isActiveInputMode}
            className={cn(
              "group min-h-[72px] border-2 border-[#f4e6bd26] bg-[#07100f9e] p-3 text-left shadow-[inset_0_3px_0_rgba(255,255,255,0.04),inset_0_-5px_0_rgba(0,0,0,0.22)] transition hover:border-lime-300/50 hover:bg-[#0a1714]/80 disabled:cursor-not-allowed disabled:opacity-70",
              isActiveInputMode &&
                "border-lime-300/70 bg-[linear-gradient(180deg,rgba(118,202,76,0.20),rgba(7,16,13,0.64))] text-lime-100"
            )}
            disabled={disabled}
            key={inputMode}
            type="button"
            onClick={() => onInputModeChange(inputMode)}
          >
            <span
              className={cn(
                "mb-3 grid size-10 place-items-center border border-[#f4e6bd24] bg-white/[0.05] transition",
                isActiveInputMode
                  ? "border-lime-300/60 bg-[#76ca4c] text-[#08200f] shadow-[0_0_18px_rgba(118,202,76,0.28)]"
                  : "text-[#b8c3b2] group-hover:text-[#b7f276]"
              )}
            >
              <InputModeIcon className="size-6" />
            </span>
            <span
              className={cn(
                "block text-lg font-black tracking-[-0.02em]",
                isActiveInputMode ? "text-lime-100" : "text-white"
              )}
            >
              {inputModeCopy.title}
            </span>
            <span className="mt-1 block text-sm font-medium text-slate-300">
              {inputModeCopy.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TextSourceForm({
  convertingButtonLabel,
  disabled,
  inputId,
  inputModeCopy,
  inputType,
  onStartConversion,
  onValueChange,
  value
}: {
  convertingButtonLabel: string;
  disabled: boolean;
  inputId: string;
  inputModeCopy: ConverterModeCopy;
  inputType: "text" | "url";
  onStartConversion: () => void;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onStartConversion();
      }}
    >
      <label
        className="block text-xs font-black uppercase tracking-[0.09em] text-[#f4e6bd]"
        htmlFor={inputId}
      >
        {inputModeCopy.inputLabel}
      </label>
      <Input
        className="min-h-[54px] rounded-none border-2 border-[#f4e6bd2e] bg-[#050c0ae6] px-4 text-base font-semibold text-white shadow-[inset_0_4px_0_rgba(0,0,0,0.34)] selection:bg-lime-300 selection:text-slate-950 placeholder:text-[#b8c3b2]/55 focus-visible:border-lime-300/70 focus-visible:ring-lime-300/20"
        disabled={disabled}
        id={inputId}
        placeholder={inputModeCopy.inputPlaceholder}
        type={inputType}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onDoubleClick={(event) =>
          selectInputTextOnDoubleClick({
            inputElement: event.currentTarget,
            inputType
          })
        }
      />
      <Button
        className={cn(workbenchPrimaryButtonClass, "w-full")}
        disabled={disabled}
        size="lg"
        type="submit"
      >
        {disabled ? <Loader2 className="size-5 animate-spin" /> : <FileArchive className="size-5" />}
        {disabled ? convertingButtonLabel : inputModeCopy.actionLabel}
      </Button>
    </form>
  );
}

function UploadSourceForm({
  copy,
  disabled,
  inputId,
  invalidFileName,
  isMrpackDropActive,
  onOpenFilePicker,
  selectedFileName
}: {
  copy: ConverterPageCopy;
  disabled: boolean;
  inputId: string;
  invalidFileName: string | null;
  isMrpackDropActive: boolean;
  onOpenFilePicker: () => void;
  selectedFileName: string | null;
}) {
  const uploadStatusId = `${inputId}-status`;
  const invalidFileMessageText = invalidFileName
    ? `${copy.converterPanel.invalidFileMessage}: ${invalidFileName}`
    : null;
  const uploadStatusText = selectedFileName
    ? `${copy.converterPanel.selectedFilePrefix}: ${selectedFileName}. ${copy.converterPanel.readyMessage}`
    : copy.converterPanel.modes.upload.inputPlaceholder;

  return (
    <div
      className={cn(
        "space-y-3 transition-[filter]",
        isMrpackDropActive && "drop-shadow-[0_0_18px_rgba(118,202,76,0.22)]"
      )}
    >
      <label
        className="block text-xs font-black uppercase tracking-[0.09em] text-[#f4e6bd]"
        htmlFor={inputId}
      >
        {copy.converterPanel.modes.upload.inputLabel}
      </label>
      <div
        aria-describedby={uploadStatusId}
        className={cn(
          "flex min-h-[54px] items-center justify-between gap-3 border-2 bg-[#050c0ae6] px-4 text-base font-semibold shadow-[inset_0_4px_0_rgba(0,0,0,0.34)] transition",
          isMrpackDropActive
            ? "border-lime-300 bg-[linear-gradient(135deg,rgba(118,202,76,0.22),rgba(7,16,13,0.88))] text-lime-50 shadow-[0_0_30px_rgba(118,202,76,0.22),inset_0_4px_0_rgba(0,0,0,0.28)]"
            : invalidFileMessageText
            ? "border-amber-300/55 text-amber-100"
            : "border-[#f4e6bd2e] text-white"
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            selectedFileName ? "text-white" : "text-[#b8c3b2]/55"
          )}
        >
          {selectedFileName ?? copy.converterPanel.modes.upload.inputPlaceholder}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex size-10 shrink-0 items-center justify-center text-lime-300"
        >
          <FileText className="size-5" />
        </span>
      </div>
      <Button
        className={cn(workbenchPrimaryButtonClass, "w-full")}
        disabled={disabled}
        size="lg"
        type="button"
        onClick={onOpenFilePicker}
      >
        <Upload className="size-5" />
        {copy.converterPanel.selectButtonLabel}
      </Button>

      <p
        aria-live="polite"
        className={cn(
          "flex items-start gap-2 text-sm leading-6",
          invalidFileMessageText ? "text-amber-200" : "text-slate-300"
        )}
        id={uploadStatusId}
      >
        {invalidFileMessageText ? (
          <CircleAlert className="size-4 shrink-0 text-amber-300" />
        ) : selectedFileName ? (
          <CheckCircle2 className="size-4 shrink-0 text-lime-300" />
        ) : (
          <ShieldCheck className="size-4 shrink-0 text-slate-300" />
        )}
        <span className="min-w-0 break-words">
          {invalidFileMessageText ?? uploadStatusText}
        </span>
      </p>
    </div>
  );
}

function ConversionStatusPanel({
  conversionRunState,
  copy,
  onDownload,
  onResetConversion
}: {
  conversionRunState: ConversionRunState;
  copy: ConverterPageCopy;
  onDownload: (completedConversionResult: CompletedConversionResult) => void;
  onResetConversion: () => void;
}) {
  if (conversionRunState.status === "idle") {
    return (
      <p className="mt-4 flex items-start gap-2 border-2 border-lime-200/20 bg-lime-300/[0.07] px-4 py-3 text-sm leading-6 text-lime-100 shadow-[6px_6px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.05)]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>{copy.converterPanel.privacyNote}</span>
      </p>
    );
  }

  if (conversionRunState.status === "working") {
    return (
      <ConversionProgressPanel
        countLabel={copy.converterPanel.progressCountLabel}
        currentFileCount={conversionRunState.progress.currentFileCount}
        label={copy.converterPanel.stageLabels[conversionRunState.progress.stage]}
        percent={conversionRunState.progress.percent}
        totalFileCount={conversionRunState.progress.totalFileCount}
      />
    );
  }

  if (conversionRunState.status === "error") {
    return (
      <div
        aria-live="polite"
        className="mt-4 border-2 border-red-300/35 bg-red-500/[0.10] px-4 py-3 text-sm leading-6 text-red-50 shadow-[6px_6px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.05)]"
      >
        <div className="flex items-start gap-2 font-black">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{copy.converterPanel.errorTitle}</span>
        </div>
        <p className="mt-2 break-words text-amber-50/90">{conversionRunState.message}</p>
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      className="mt-4 border-2 border-cyan-200/35 bg-cyan-300/[0.10] px-4 py-4 text-sm leading-6 text-cyan-50 shadow-[6px_6px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.05)]"
    >
      <div className="flex items-start gap-2 font-black text-cyan-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{copy.converterPanel.resultTitle}</span>
      </div>
      <CompletedConversionProgressBar label={copy.converterPanel.resultTitle} />
      <dl className="mt-3 grid gap-2 text-slate-200 sm:grid-cols-2">
        <MinecraftWorkbenchSummaryValue
          label={copy.converterPanel.outputFileLabel}
          value={conversionRunState.result.outputZipFileName}
        />
        <MinecraftWorkbenchSummaryValue
          label={copy.converterPanel.sourceFileLabel}
          value={conversionRunState.result.sourceFileName}
        />
        <MinecraftWorkbenchSummaryValue
          label={copy.converterPanel.referencedFilesLabel}
          value={`${conversionRunState.result.downloadedFileCount}/${conversionRunState.result.referencedFileCount}`}
        />
        <MinecraftWorkbenchSummaryValue
          label={copy.converterPanel.overrideFilesLabel}
          value={String(conversionRunState.result.overrideFileCount)}
        />
        <MinecraftWorkbenchSummaryValue
          label={copy.converterPanel.failedDownloadsLabel}
          value={String(conversionRunState.result.failedDownloadCount)}
        />
      </dl>
      <p className="mt-3 text-slate-300">
        {conversionRunState.result.failedDownloadCount > 0
          ? copy.converterPanel.failedDownloadsNote
          : copy.converterPanel.successNote}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          className={workbenchPrimaryButtonClass}
          type="button"
          onClick={() => onDownload(conversionRunState.result)}
        >
          {copy.converterPanel.downloadLabel}
          <FileArchive className="size-4" />
        </Button>
        <Button
          className={workbenchSecondaryButtonClass}
          type="button"
          variant="outline"
          onClick={onResetConversion}
        >
          {copy.converterPanel.resetLabel}
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CompletedConversionProgressBar({ label }: { label: string }) {
  const completedProgressPercentText = getCompletedProgressPercentText();

  return (
    <div className="mt-3 rounded-lg border border-lime-300/16 bg-black/18 px-3 py-3">
      <div className="flex items-start justify-between gap-4">
        <span className="min-w-0 break-words font-semibold text-slate-300">
          {label}
        </span>
        <span className="shrink-0 font-black tabular-nums text-lime-200">
          {completedProgressPercentText}
        </span>
      </div>
      <div
        aria-label={`${label}: ${completedProgressPercentText}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={100}
        className="mt-3 h-2 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10"
        role="progressbar"
      >
        <div className="h-full w-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 shadow-[0_0_18px_rgba(116,255,70,0.55)]" />
      </div>
    </div>
  );
}

function ConversionStatesSection({ copy }: { copy: ConverterPageCopy }) {
  const conversionStateCards = [
    {
      title: copy.converterPanel.previewPanel.idleStatusLabel,
      description: copy.converterPanel.emptyInputMessages.project,
      dotClassName: "bg-[#76ca4c] shadow-[0_0_14px_rgba(118,202,76,0.52)]"
    },
    {
      title: copy.converterPanel.convertingButtonLabel,
      description: [
        copy.converterPanel.stageLabels["fetching-source"],
        copy.converterPanel.stageLabels["reading-index"],
        copy.converterPanel.stageLabels["downloading-files"],
        copy.converterPanel.stageLabels["building-zip"]
      ].join(" "),
      dotClassName: "bg-[#ffc766] shadow-[0_0_14px_rgba(255,199,102,0.52)]"
    },
    {
      title: copy.converterPanel.resultTitle,
      description: copy.converterPanel.successNote,
      dotClassName: "bg-[#68d9e9] shadow-[0_0_14px_rgba(104,217,233,0.52)]"
    },
    {
      title: copy.converterPanel.errorTitle,
      description:
        copy.converterLimits.paragraphs[1] ?? copy.converterPanel.invalidFileMessage,
      dotClassName: "bg-[#ff6259] shadow-[0_0_14px_rgba(255,98,89,0.52)]"
    }
  ];

  return (
    <section
      aria-label={copy.conversionStates.ariaLabel}
      className="mx-auto mt-12 max-w-[1040px]"
    >
      <div className="state-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {conversionStateCards.map((conversionStateCard) => (
          <article
            className={cn(workbenchMiniPanelClass, "state-card min-h-[188px]")}
            key={conversionStateCard.title}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[#f4e6bd]">
                {conversionStateCard.title}
              </span>
              <span
                aria-hidden="true"
                className={cn("size-3 shrink-0 rounded-full", conversionStateCard.dotClassName)}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {conversionStateCard.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InfoSection({ info }: { info: InfoSectionCopy }) {
  const leadingParagraphs = info.paragraphs.slice(0, 2);
  const trailingParagraphs = info.paragraphs.slice(2);

  return (
    <ContentSection
      id="mrpack-file"
      icon={FileText}
      title={info.title}
    >
      <div className="two-col grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className={cn(workbenchInfoPanelClass, "space-y-4 text-base leading-8 text-[#c8d3c2]")}>
          {leadingParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className={cn(workbenchInfoPanelClass, "space-y-4 text-base leading-8 text-[#c8d3c2]")}>
          {trailingParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </ContentSection>
  );
}

function HowToConvertSection({
  sectionCopy
}: {
  sectionCopy: StepsSectionCopy;
}) {
  return (
    <ContentSection
      id="how-to-convert"
      icon={Workflow}
      title={sectionCopy.title}
      description={sectionCopy.description}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {sectionCopy.steps.map((step, stepIndex) => (
          <article className={workbenchMiniPanelClass} key={step.title}>
            <span className="grid size-11 place-items-center bg-[linear-gradient(180deg,#b7f276,#76ca4c)] text-base font-black text-[#08200f] shadow-[0_0_20px_rgba(118,202,76,0.28)]">
              {stepIndex + 1}
            </span>
            <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </ContentSection>
  );
}

function ConverterLimitsSection({ info }: { info: InfoSectionCopy }) {
  return (
    <ContentSection
      id="converter-limits"
      icon={CircleAlert}
      title={info.title}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {info.paragraphs.map((paragraph) => (
          <p
            className="border-2 border-red-300/25 bg-red-500/[0.08] p-5 text-sm leading-7 text-red-50/90 shadow-[8px_8px_0_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.04)]"
            key={paragraph}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </ContentSection>
  );
}

function LauncherSupportSection({
  launcherSupport
}: {
  launcherSupport: LauncherSupportCopy;
}) {
  return (
    <ContentSection
      id="launcher-support"
      icon={FileArchive}
      title={launcherSupport.title}
      description={launcherSupport.description}
    >
      <div
        aria-label={launcherSupport.tableAriaLabel}
        className="support-table overflow-hidden border-2 border-[#f4e6bd2b] bg-[#07100fb8] shadow-[10px_10px_0_rgba(0,0,0,0.22),inset_0_2px_0_rgba(255,255,255,0.05)]"
        role="table"
      >
        <div
          className="hidden grid-cols-[1.1fr_0.85fr_0.8fr_1.45fr] border-b border-[#f4e6bd1f] bg-[#24302bb3] px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-[#f4e6bd] md:grid"
          role="row"
        >
          <span>{launcherSupport.launcherHeader}</span>
          <span>{launcherSupport.mrpackHeader}</span>
          <span>{launcherSupport.zipHeader}</span>
          <span>{launcherSupport.noteHeader}</span>
        </div>
        <div>
          {launcherSupport.rows.map((launcherRow) => (
            <LauncherSupportRow
              launcherSupport={launcherSupport}
              launcherRow={launcherRow}
              key={launcherRow.targetName}
            />
          ))}
        </div>
      </div>
    </ContentSection>
  );
}

function LauncherSupportRow({
  launcherRow,
  launcherSupport
}: {
  launcherRow: LauncherSupportRowCopy;
  launcherSupport: LauncherSupportCopy;
}) {
  return (
    <article
      className="support-row grid gap-3 border-b border-[#f4e6bd1f] px-5 py-4 text-sm text-[#cbd6c6] last:border-b-0 md:grid-cols-[1.1fr_0.85fr_0.8fr_1.45fr] md:items-center"
      role="row"
    >
      <h3 className="font-black text-white">{launcherRow.targetName}</h3>
      <LabeledValue
        label={launcherSupport.mrpackHeader}
        value={launcherRow.mrpackSupport}
        supportLevel={launcherRow.supportLevel}
      />
      <LabeledValue
        label={launcherSupport.zipHeader}
        value={launcherRow.zipNeed}
        supportLevel={launcherRow.supportLevel}
      />
      <p className="leading-6 text-slate-300">{launcherRow.note}</p>
    </article>
  );
}

function LabeledValue({
  label,
  supportLevel,
  value
}: {
  label: string;
  supportLevel: LauncherSupportLevel;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 md:hidden">
        {label}
      </div>
      <span
        className={cn(
          "inline-flex rounded-full border px-3 py-1 text-xs font-black",
          supportLevelClasses[supportLevel]
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FaqSection({
  closeAllLabel,
  expandedQuestions,
  faqItems,
  onExpandedQuestionsChange,
  onToggleAllQuestions,
  title,
  viewAllLabel
}: {
  closeAllLabel: string;
  expandedQuestions: string[];
  faqItems: FaqItemCopy[];
  onExpandedQuestionsChange: (expandedQuestions: string[]) => void;
  onToggleAllQuestions: () => void;
  title: string;
  viewAllLabel: string;
}) {
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
  const faqQuestions = faqItems.map((faqItem) => faqItem.question);
  const faqBulkToggleState = getFaqBulkToggleState({
    closeAllLabel,
    expandedQuestions,
    faqQuestions,
    openAllLabel: viewAllLabel
  });
  const hoverExpandedQuestions = getHoverExpandedQuestions({
    expandedQuestions,
    hoveredQuestion
  });

  function expandQuestionOnHover(faqQuestion: string) {
    setHoveredQuestion(faqQuestion);
  }

  function collapseQuestionAfterHover(faqQuestion: string) {
    setHoveredQuestion((currentHoveredQuestion) =>
      getNextHoveredQuestionAfterLeave({
        hoveredQuestion: currentHoveredQuestion,
        leavingQuestion: faqQuestion
      })
    );
  }

  function changeManualExpandedQuestions(nextVisibleExpandedQuestions: string[]) {
    const nextManualExpandedQuestions =
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions,
        hoveredQuestion,
        nextVisibleExpandedQuestions
      });
    const nextHoveredQuestion = getNextHoveredQuestionAfterVisibleChange({
      expandedQuestions,
      hoveredQuestion,
      nextVisibleExpandedQuestions
    });

    setHoveredQuestion(nextHoveredQuestion);
    onExpandedQuestionsChange(nextManualExpandedQuestions);
  }

  return (
    <section
      className="mx-auto mt-12 max-w-[1040px] border-t border-white/10 pt-10"
      id="faq"
    >
      <div className="flex items-center justify-between gap-4">
        <SectionHeading icon={HelpCircle} title={title} />
        <Button
          className="h-auto min-w-max gap-2 p-0 text-sm font-black text-lime-400 hover:bg-transparent hover:text-lime-300"
          type="button"
          variant="ghost"
          onClick={onToggleAllQuestions}
        >
          {faqBulkToggleState.buttonLabel}
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Accordion
        className="mt-6 space-y-3"
        type="multiple"
        value={hoverExpandedQuestions}
        onValueChange={changeManualExpandedQuestions}
      >
        {faqItems.map((faqItem, faqItemIndex) => {
          const faqItemDomIds = getFaqItemDomIds(faqItemIndex);

          return (
            <AccordionItem
              className="overflow-hidden border-2 border-[#f4e6bd21] bg-[#18211ec2] shadow-[inset_0_2px_0_rgba(255,255,255,0.04),8px_8px_0_rgba(0,0,0,0.18)]"
              key={faqItem.question}
              value={faqItem.question}
              onMouseEnter={() => expandQuestionOnHover(faqItem.question)}
              onMouseLeave={() => collapseQuestionAfterHover(faqItem.question)}
            >
              <AccordionTrigger
                aria-controls={faqItemDomIds.contentId}
                className="gap-3 px-5 py-4 text-base font-black text-[#f4e6bd] hover:text-[#b7f276] hover:no-underline [&>svg]:text-[#b8c3b2] [&[data-state=open]>svg]:text-[#b7f276]"
                id={faqItemDomIds.triggerId}
              >
                <span className="min-w-0">{faqItem.question}</span>
              </AccordionTrigger>
              <AccordionContent
                aria-labelledby={faqItemDomIds.triggerId}
                className="px-5 pb-5 text-sm leading-7 text-[#c8d3c2]"
                id={faqItemDomIds.contentId}
              >
                <p>{faqItem.answer}</p>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}

function ContentSection({
  children,
  description,
  icon,
  id,
  title
}: {
  children: ReactNode;
  description?: string;
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  return (
    <MinecraftWorkbenchContentSection
      description={description}
      icon={icon}
      id={id}
      title={title}
    >
      {children}
    </MinecraftWorkbenchContentSection>
  );
}

function SectionHeading({
  icon,
  title
}: {
  icon: LucideIcon;
  title: string;
}) {
  return <MinecraftWorkbenchSectionHeading icon={icon} title={title} />;
}

function PageFooter({ copy }: { copy: ConverterPageCopy }) {
  const logoHref = copy.localeCode === "zh-Hans" ? "/zh" : "/";

  return (
    <MinecraftWorkbenchFooter
      copyright={copy.footer.copyright}
      disclaimer={copy.footer.disclaimer}
      links={copy.footer.links}
      logoAccent={copy.logoAccent}
      logoHref={logoHref}
      logoText={copy.logoText}
      tagline={copy.footer.tagline}
    />
  );
}
