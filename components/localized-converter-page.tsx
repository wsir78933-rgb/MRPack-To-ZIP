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
  Box,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileArchive,
  FileSearch,
  FileText,
  Github,
  HelpCircle,
  Layers3,
  LockKeyhole,
  Loader2,
  Moon,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Sun,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getNextConversionRunId,
  isActiveConversionRun
} from "@/lib/conversion-progress/conversion-run-token";
import { getCompletedProgressPercentText } from "@/lib/conversion-progress/progress-display";
import { getFaqBulkToggleState } from "@/lib/faq/bulk-toggle";
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
  const [isGlowEnabled, setIsGlowEnabled] = useState(false);
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

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
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
    <main
      lang={copy.localeCode}
      className={cn(
        "relative min-h-[100dvh] overflow-x-hidden bg-[#03070b] text-white",
        isGlowEnabled && "selection:bg-lime-300 selection:text-black"
      )}
    >
      <StructuredDataScript structuredData={structuredData} />
      <PageBackground isGlowEnabled={isGlowEnabled} />

      <div className="relative z-10">
        <TopNavigation
          copy={copy}
          isGlowEnabled={isGlowEnabled}
          onGlowToggle={() =>
            setIsGlowEnabled((currentGlowValue) => !currentGlowValue)
          }
        />

        <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-9 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <Hero copy={copy} />
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
        </div>

        <PageFooter copy={copy} />
      </div>
    </main>
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

function PageBackground({ isGlowEnabled }: { isGlowEnabled: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 scale-[1.02] bg-[url('/assets/mrpackzip-voxel-bg.png')] bg-cover bg-center opacity-[0.72] saturate-[1.12] contrast-[1.08]"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[linear-gradient(180deg,rgba(2,6,10,0.82)_0%,rgba(2,7,10,0.55)_38%,rgba(2,5,8,0.86)_100%)]"
      />
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 transition-opacity duration-500",
          "bg-[radial-gradient(circle_at_14%_42%,rgba(76,255,54,0.14),transparent_18%),radial-gradient(circle_at_86%_40%,rgba(92,255,58,0.13),transparent_18%),linear-gradient(90deg,rgba(78,255,61,0.055),transparent_24%,transparent_76%,rgba(78,255,61,0.055))]",
          isGlowEnabled ? "opacity-100" : "opacity-80"
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:76px_76px] opacity-[0.12]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent"
      />
    </>
  );
}

function TopNavigation({
  copy,
  isGlowEnabled,
  onGlowToggle
}: {
  copy: ConverterPageCopy;
  isGlowEnabled: boolean;
  onGlowToggle: () => void;
}) {
  const logoHref = copy.localeCode === "zh-Hans" ? "/zh" : "/";
  const languageHref = copy.localeCode === "zh-Hans" ? "/" : "/zh";
  const languageLabel = copy.localeCode === "zh-Hans" ? "EN" : "中文";

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#03070b]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[62px] w-full max-w-[1120px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          aria-label={`${copy.logoText}${copy.logoAccent}`}
          className="flex min-w-max items-center gap-2"
          href={logoHref}
        >
          <Box className="size-6 text-lime-400 drop-shadow-[0_0_16px_rgba(116,255,70,0.5)] sm:size-7" />
          <span className="text-lg font-black tracking-[-0.03em] text-white sm:text-xl">
            {copy.logoText}
            <span className="text-lime-400">{copy.logoAccent}</span>
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-6 text-sm font-medium text-slate-100 md:flex lg:gap-8">
          {copy.navLinks.map((navigationLink) => (
            <Link
              aria-current={navigationLink.isActive ? "page" : undefined}
              className={cn(
                "relative flex h-full items-center whitespace-nowrap transition-colors hover:text-lime-300",
                navigationLink.isActive && "text-lime-300"
              )}
              href={navigationLink.href}
              key={navigationLink.label}
            >
              {navigationLink.label}
              {navigationLink.isActive ? (
                <span className="absolute inset-x-[-12px] bottom-0 h-[2px] rounded-full bg-lime-400 shadow-[0_0_18px_rgba(116,255,70,0.95)]" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/[0.035] px-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-lime-300/55 hover:text-lime-300 sm:h-10 sm:min-w-10 sm:text-sm"
            href={languageHref}
          >
            {languageLabel}
          </Link>
          <Button
            aria-pressed={isGlowEnabled}
            aria-label={copy.glowToggleLabel}
            className={cn(
              "size-9 rounded-lg border bg-white/[0.035] p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-lime-300/55 hover:bg-white/[0.055] hover:text-lime-300 sm:size-10",
              isGlowEnabled ? "border-lime-300/70 text-lime-300" : "border-white/15"
            )}
            type="button"
            variant="ghost"
            onClick={onGlowToggle}
          >
            {isGlowEnabled ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero({ copy }: { copy: ConverterPageCopy }) {
  return (
    <section className="mx-auto max-w-[860px] text-center">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-lime-300 shadow-[0_0_26px_rgba(116,255,70,0.13)]">
        <PackageOpen className="size-3.5 shrink-0" />
        <span className="truncate">{copy.hero.badge}</span>
      </div>

      <h1 className="mx-auto mt-4 max-w-[760px] text-5xl font-black leading-[0.95] tracking-[-0.035em] text-white drop-shadow-[0_12px_34px_rgba(0,0,0,0.52)] sm:text-6xl sm:tracking-[-0.045em] lg:text-8xl">
        <HeroTitleStart titleStart={copy.hero.titleStart} />
        <span className="block text-lime-400 drop-shadow-[0_0_30px_rgba(116,255,70,0.3)]">
          {copy.hero.titleAccent}
        </span>
      </h1>

      <p className="mx-auto mt-5 max-w-[680px] text-base font-medium leading-7 text-slate-100 sm:text-lg">
        {copy.hero.description}
      </p>
      <p className="mx-auto mt-2 max-w-[620px] text-sm leading-6 text-lime-100/78">
        {copy.hero.note}
      </p>
    </section>
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
  onFileDrop: (event: DragEvent<HTMLDivElement>) => void;
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

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <section
      className="mx-auto mt-8 max-w-[900px]"
      id="converter"
    >
      <InputSourceTabs
        activeInputMode={activeInputMode}
        copy={copy}
        disabled={isConversionRunning}
        onInputModeChange={onActiveInputModeChange}
      />

      <div className="relative rounded-[22px] border border-lime-200/28 bg-[#0b1312]/68 p-3 shadow-[0_0_0_1px_rgba(128,255,82,0.08),0_24px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <span className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-lime-300 to-transparent opacity-90 shadow-[0_0_22px_rgba(124,255,72,0.95)]" />
        <input
          aria-label={copy.converterPanel.modes.upload.inputLabel}
          accept=".mrpack"
          className="sr-only"
          id={inputId}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
          onChange={onFileInputChange}
        />

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
            selectedFileName={selectedFileName}
            onFileDrop={onFileDrop}
            onOpenFilePicker={openFilePicker}
          />
        ) : null}

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
              "group min-h-[128px] rounded-2xl border bg-[#071017]/76 p-4 text-center shadow-[0_16px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition hover:border-lime-300/50 hover:bg-[#0a1714]/82",
              isActiveInputMode
                ? "border-lime-300/70 bg-lime-300/[0.09] shadow-[0_0_0_1px_rgba(139,255,58,0.18),0_18px_48px_rgba(90,255,62,0.08)]"
                : "border-white/12"
            )}
            disabled={disabled}
            key={inputMode}
            type="button"
            onClick={() => onInputModeChange(inputMode)}
          >
            <span
              className={cn(
                "mx-auto grid size-12 place-items-center rounded-xl border transition",
                isActiveInputMode
                  ? "border-lime-300/60 bg-lime-400 text-slate-950 shadow-[0_0_24px_rgba(116,255,70,0.28)]"
                  : "border-white/12 bg-white/[0.06] text-slate-300 group-hover:text-lime-300"
              )}
            >
              <InputModeIcon className="size-6" />
            </span>
            <span
              className={cn(
                "mt-4 block text-lg font-black tracking-[-0.02em]",
                isActiveInputMode ? "text-lime-300" : "text-white"
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
      className="rounded-[18px] border border-dashed border-lime-300/34 bg-[#07100f]/62 px-4 py-6 shadow-[inset_0_0_92px_rgba(96,255,67,0.05)] sm:px-8"
      onSubmit={(event) => {
        event.preventDefault();
        onStartConversion();
      }}
    >
      <label
        className="block text-sm font-black text-lime-200"
        htmlFor={inputId}
      >
        {inputModeCopy.inputLabel}
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <Input
          className="min-h-[52px] rounded-lg border-white/12 bg-black/24 px-4 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] placeholder:text-slate-500 focus-visible:border-lime-300/70 focus-visible:ring-lime-300/20"
          disabled={disabled}
          id={inputId}
          placeholder={inputModeCopy.inputPlaceholder}
          type={inputType}
          value={value}
          onChange={(event) => onValueChange(event.currentTarget.value)}
        />
        <Button
          className="min-h-[52px] w-full min-w-0 rounded-lg bg-gradient-to-b from-lime-300 to-lime-500 px-4 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(105,255,70,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] hover:translate-y-[-1px] hover:from-lime-200 hover:to-lime-400 hover:text-slate-950 sm:w-auto sm:px-7 sm:text-base"
          disabled={disabled}
          size="lg"
          type="submit"
        >
          {disabled ? <Loader2 className="size-5 animate-spin" /> : <FileArchive className="size-5" />}
          {disabled ? convertingButtonLabel : inputModeCopy.actionLabel}
        </Button>
      </div>
    </form>
  );
}

function UploadSourceForm({
  copy,
  disabled,
  inputId,
  invalidFileName,
  onFileDrop,
  onOpenFilePicker,
  selectedFileName
}: {
  copy: ConverterPageCopy;
  disabled: boolean;
  inputId: string;
  invalidFileName: string | null;
  onFileDrop: (event: DragEvent<HTMLDivElement>) => void;
  onOpenFilePicker: () => void;
  selectedFileName: string | null;
}) {
  const uploadStatusId = `${inputId}-status`;
  const invalidFileMessageText = invalidFileName
    ? `${copy.converterPanel.invalidFileMessage}: ${invalidFileName}`
    : null;
  const uploadStatusText = selectedFileName
    ? `${copy.converterPanel.selectedFilePrefix}: ${selectedFileName}. ${copy.converterPanel.readyMessage}`
    : copy.converterPanel.privacyNote;

  return (
    <div
      className="rounded-[18px] border border-dashed border-lime-300/34 bg-[#07100f]/62 px-3 py-7 text-center shadow-[inset_0_0_92px_rgba(96,255,67,0.05)] transition hover:border-lime-300/58 hover:bg-[#0a1613]/72 sm:px-8"
      onDragOver={(event) => event.preventDefault()}
      onDrop={disabled ? undefined : onFileDrop}
    >
      <div className="mx-auto flex size-[104px] flex-col items-center justify-end rounded-2xl border border-white/18 bg-gradient-to-br from-slate-500/42 to-slate-950/88 p-0 shadow-[0_18px_42px_rgba(0,0,0,0.45)]">
        <FileText className="mb-2.5 size-11 text-lime-400 drop-shadow-[0_0_18px_rgba(116,255,70,0.34)]" />
        <span className="w-[90px] rounded-lg bg-lime-400 px-3 py-1.5 text-sm font-black text-slate-950 shadow-[0_0_18px_rgba(116,255,70,0.32)]">
          {copy.converterPanel.fileTypeLabel}
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-white sm:text-3xl">
        {copy.converterPanel.dropTitle}
      </h2>
      <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-slate-300">
        {copy.converterPanel.dropDescription}
      </p>
      <p className="mt-3 text-sm text-slate-400">{copy.converterPanel.separatorLabel}</p>

      <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          className="min-h-[52px] w-full min-w-0 rounded-lg bg-gradient-to-b from-lime-300 to-lime-500 px-4 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(105,255,70,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] hover:translate-y-[-1px] hover:from-lime-200 hover:to-lime-400 hover:text-slate-950 hover:shadow-[0_0_34px_rgba(105,255,70,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] sm:w-auto sm:px-8 sm:text-base"
          disabled={disabled}
          size="lg"
          type="button"
          onClick={onOpenFilePicker}
        >
          {copy.converterPanel.selectButtonLabel}
          <Upload className="size-5" />
        </Button>
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mx-auto mt-5 flex max-w-[620px] items-center justify-center gap-2 text-sm leading-6",
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
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-lime-300/14 bg-lime-300/[0.055] px-4 py-3 text-sm leading-6 text-lime-100/86">
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
        className="mt-4 rounded-xl border border-amber-300/22 bg-amber-300/[0.075] px-4 py-3 text-sm leading-6 text-amber-100"
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
      className="mt-4 rounded-xl border border-lime-300/22 bg-lime-300/[0.075] px-4 py-4 text-sm leading-6 text-lime-50"
    >
      <div className="flex items-start gap-2 font-black text-lime-200">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{copy.converterPanel.resultTitle}</span>
      </div>
      <CompletedConversionProgressBar label={copy.converterPanel.resultTitle} />
      <dl className="mt-3 grid gap-2 text-slate-200 sm:grid-cols-2">
        <ConversionResultValue
          label={copy.converterPanel.outputFileLabel}
          value={conversionRunState.result.outputZipFileName}
        />
        <ConversionResultValue
          label={copy.converterPanel.sourceFileLabel}
          value={conversionRunState.result.sourceFileName}
        />
        <ConversionResultValue
          label={copy.converterPanel.referencedFilesLabel}
          value={`${conversionRunState.result.downloadedFileCount}/${conversionRunState.result.referencedFileCount}`}
        />
        <ConversionResultValue
          label={copy.converterPanel.overrideFilesLabel}
          value={String(conversionRunState.result.overrideFileCount)}
        />
        <ConversionResultValue
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
          className="min-h-11 rounded-lg bg-lime-400 font-black text-slate-950 hover:bg-lime-300 hover:text-slate-950"
          type="button"
          onClick={() => onDownload(conversionRunState.result)}
        >
          {copy.converterPanel.downloadLabel}
          <FileArchive className="size-4" />
        </Button>
        <Button
          className="min-h-11 rounded-lg border-white/12 bg-white/[0.045] font-black text-slate-200 hover:border-lime-300/40 hover:bg-white/[0.07] hover:text-lime-200"
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

function ConversionResultValue({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/18 px-3 py-2">
      <dt className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words font-semibold text-white">{value}</dd>
    </div>
  );
}

function InfoSection({ info }: { info: InfoSectionCopy }) {
  return (
    <ContentSection
      id="mrpack-file"
      icon={FileText}
      title={info.title}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-4 text-base leading-8 text-slate-300">
          {info.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="rounded-2xl border border-lime-300/18 bg-[#071017]/74 p-5 font-mono text-xs leading-6 text-lime-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="mb-3 flex items-center gap-2 text-slate-300">
            <Layers3 className="size-4 text-lime-300" />
            <span>modrinth.index.json</span>
          </div>
          <p>{'{'}</p>
          <p className="pl-4">"formatVersion": 1,</p>
          <p className="pl-4">"files": ["mods/..."],</p>
          <p className="pl-4">"dependencies": {'{'} ... {'}'}</p>
          <p>{'}'}</p>
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
          <article
            className="rounded-2xl border border-white/12 bg-[#071017]/78 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
            key={step.title}
          >
            <span className="grid size-11 place-items-center rounded-full bg-lime-400 text-base font-black text-slate-950 shadow-[0_0_20px_rgba(116,255,70,0.28)]">
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
            className="rounded-2xl border border-amber-300/16 bg-amber-300/[0.055] p-5 text-sm leading-7 text-amber-50/88"
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
      <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#071017]/78 shadow-[0_16px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
        <div className="hidden grid-cols-[1.1fr_0.85fr_0.8fr_1.45fr] border-b border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-400 md:grid">
          <span>{launcherSupport.launcherHeader}</span>
          <span>{launcherSupport.mrpackHeader}</span>
          <span>{launcherSupport.zipHeader}</span>
          <span>{launcherSupport.noteHeader}</span>
        </div>
        <div className="divide-y divide-white/8">
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
    <article className="grid gap-3 px-5 py-4 text-sm text-slate-300 md:grid-cols-[1.1fr_0.85fr_0.8fr_1.45fr] md:items-center">
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
      className="mx-auto mt-12 max-w-[900px] border-t border-white/10 pt-10"
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
              className="overflow-hidden rounded-2xl border border-white/12 bg-black/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
              key={faqItem.question}
              value={faqItem.question}
              onMouseEnter={() => expandQuestionOnHover(faqItem.question)}
              onMouseLeave={() => collapseQuestionAfterHover(faqItem.question)}
            >
              <AccordionTrigger
                aria-controls={faqItemDomIds.contentId}
                className="gap-3 px-5 py-4 text-base font-bold text-white hover:text-lime-300 hover:no-underline [&>svg]:text-slate-300 [&[data-state=open]>svg]:text-lime-300"
                id={faqItemDomIds.triggerId}
              >
                <span className="min-w-0">{faqItem.question}</span>
              </AccordionTrigger>
              <AccordionContent
                aria-labelledby={faqItemDomIds.triggerId}
                className="px-5 pb-5 text-sm leading-7 text-slate-300"
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
    <section
      className="mx-auto mt-12 max-w-[900px] border-t border-white/10 pt-10"
      id={id}
    >
      <div className="mb-6">
        <SectionHeading icon={icon} title={title} />
        {description ? (
          <p className="mt-3 max-w-[680px] text-base leading-7 text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  title
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Icon className="size-7 shrink-0 text-lime-400 drop-shadow-[0_0_16px_rgba(116,255,70,0.24)]" />
      <h2 className="min-w-0 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function PageFooter({ copy }: { copy: ConverterPageCopy }) {
  const logoHref = copy.localeCode === "zh-Hans" ? "/zh" : "/";

  return (
    <footer className="border-t border-white/[0.08] bg-[#05090d]/86 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <Link className="flex items-center gap-2" href={logoHref}>
              <Box className="size-6 text-lime-400" />
              <span className="text-lg font-black tracking-[-0.03em] text-white">
                {copy.logoText}
                <span className="text-lime-400">{copy.logoAccent}</span>
              </span>
            </Link>
            <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-400">
              {copy.footer.tagline}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-400">
            {copy.footer.links.map((footerLink) => (
              <Link
                className="transition hover:text-lime-300"
                href={footerLink.href}
                key={footerLink.label}
              >
                {footerLink.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>{copy.footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-3">
            <p>{copy.footer.disclaimer}</p>
            <span
              aria-hidden="true"
              className="hidden h-3 w-px bg-white/12 md:block"
            />
            <Github className="size-4" />
            <LockKeyhole className="size-4" />
          </div>
        </div>
      </div>
    </footer>
  );
}
