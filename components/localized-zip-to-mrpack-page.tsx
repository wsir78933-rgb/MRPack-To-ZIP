"use client";

import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  CheckCircle2,
  CircleAlert,
  FileText,
  FileArchive,
  HelpCircle,
  Moon,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Sun,
  Upload,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ConversionProgressPanel } from "@/components/conversion-progress-panel";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getNextConversionRunId,
  isActiveConversionRun,
} from "@/lib/conversion-progress/conversion-run-token";
import { getCompletedProgressPercentText } from "@/lib/conversion-progress/progress-display";
import { getFaqBulkToggleState } from "@/lib/faq/bulk-toggle";
import {
  getHoverExpandedQuestions,
  getNextHoveredQuestionAfterVisibleChange,
  getNextManualExpandedQuestionsAfterVisibleChange,
  getNextHoveredQuestionAfterLeave,
} from "@/lib/faq/hover-expansion";
import { formatConversionErrorForLocale } from "@/lib/i18n/conversion-error-formatting";
import type {
  ZipToMrpackFaqItemCopy,
  ZipToMrpackInfoSectionCopy,
  ZipToMrpackLimitsCopy,
  ZipToMrpackPageCopy,
  ZipToMrpackStepsSectionCopy,
} from "@/lib/i18n/zip-to-mrpack-page-copy";
import {
  buildZipToMrpackStructuredData,
  type PageStructuredData,
} from "@/lib/seo/structured-data";
import type { SiteRoutePath } from "@/lib/seo/site-metadata";
import {
  runZipToMrpackConversionWorkflow,
  type ZipToMrpackConversionResult,
  type ZipToMrpackConversionProgress,
  type ZipToMrpackConversionStage,
} from "@/lib/zip-to-mrpack/conversion-workflow";
import { cn } from "@/lib/utils";

type LocalizedZipToMrpackPageProps = {
  copy: ZipToMrpackPageCopy;
};

type ZipToMrpackRunState =
  | { status: "idle" }
  | { status: "working"; progress: ZipToMrpackConversionProgress }
  | { status: "done"; result: ZipToMrpackConversionResult }
  | { status: "error"; message: string };

export function LocalizedZipToMrpackPage({ copy }: LocalizedZipToMrpackPageProps) {
  const [isGlowEnabled, setIsGlowEnabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invalidFileName, setInvalidFileName] = useState<string | null>(null);
  const [conversionRunState, setConversionRunState] =
    useState<ZipToMrpackRunState>({ status: "idle" });
  const [expandedFaqQuestions, setExpandedFaqQuestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeConversionRunIdRef = useRef(0);

  const logoHref = copy.localeCode === "zh-Hans" ? "/zh" : "/";
  const languageHref = copy.localeCode === "zh-Hans" ? "/zip-to-mrpack" : "/zh/zip-to-mrpack";
  const languageLabel = copy.localeCode === "zh-Hans" ? "EN" : "中文";
  const isConversionRunning = conversionRunState.status === "working";
  const structuredData = buildZipToMrpackStructuredData({
    copy,
    routePath: getZipToMrpackRoutePath(copy.localeCode),
  });

  function resetConversionRunState() {
    activeConversionRunIdRef.current = getNextConversionRunId(
      activeConversionRunIdRef.current,
    );
    setConversionRunState({ status: "idle" });
  }

  function clearConversionResult() {
    resetConversionRunState();
    setSelectedFile(null);
    setInvalidFileName(null);
  }

  function startNewConversionRun() {
    const nextConversionRunId = getNextConversionRunId(
      activeConversionRunIdRef.current,
    );

    activeConversionRunIdRef.current = nextConversionRunId;
    return nextConversionRunId;
  }

  function isCurrentConversionRun(conversionRunId: number) {
    return isActiveConversionRun({
      activeConversionRunId: activeConversionRunIdRef.current,
      conversionRunId,
    });
  }

  function handleSelectedFileForConversion(nextSelectedFile: File | null) {
    resetConversionRunState();

    if (!nextSelectedFile) {
      setSelectedFile(null);
      setInvalidFileName(null);
      return;
    }

    if (!isZipFileName(nextSelectedFile.name)) {
      setSelectedFile(null);
      setInvalidFileName(nextSelectedFile.name);
      return;
    }

    setSelectedFile(nextSelectedFile);
    setInvalidFileName(null);
    void startConversion(nextSelectedFile);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSelectedFile = event.currentTarget.files?.[0] ?? null;
    handleSelectedFileForConversion(nextSelectedFile);
    event.currentTarget.value = "";
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleSelectedFileForConversion(event.dataTransfer.files.item(0));
  }

  async function startConversion(selectedZipFile: File) {
    const conversionRunId = startNewConversionRun();

    try {
      const conversionResult = await runZipToMrpackConversionWorkflow({
        selectedFile: selectedZipFile,
        onProgressChange: (progress) => {
          if (!isCurrentConversionRun(conversionRunId)) {
            return;
          }

          setConversionRunState({
            status: "working",
            progress,
          });
        },
      });

      if (!isCurrentConversionRun(conversionRunId)) {
        return;
      }

      setConversionRunState({
        status: "done",
        result: conversionResult,
      });
    } catch (caughtError) {
      if (!isCurrentConversionRun(conversionRunId)) {
        return;
      }

      setConversionRunState({
        status: "error",
        message: formatConversionErrorForLocale(caughtError, copy.localeCode),
      });
    }
  }

  function toggleAllFaqQuestions() {
    setExpandedFaqQuestions((currentQuestions) =>
      getFaqBulkToggleState({
        closeAllLabel: copy.faq.closeAllLabel,
        expandedQuestions: currentQuestions,
        faqQuestions: copy.faq.items.map((faqItem) => faqItem.question),
        openAllLabel: copy.faq.viewAllLabel,
      }).nextExpandedQuestions,
    );
  }

  return (
    <main
      lang={copy.localeCode}
      className={cn(
        "relative min-h-[100dvh] overflow-x-hidden bg-[#03070b] text-white",
        isGlowEnabled && "selection:bg-lime-300 selection:text-black",
      )}
    >
      <StructuredDataScript structuredData={structuredData} />
      <PageBackground isGlowEnabled={isGlowEnabled} />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#03070b]/82 backdrop-blur-xl">
          <div className="mx-auto flex h-[62px] w-full max-w-[1120px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
            <Link
              aria-label={`${copy.logoText}${copy.logoAccent}`}
              className="flex min-w-max items-center gap-2"
              href={logoHref}
            >
              <Box className="size-6 text-lime-400 drop-shadow-[0_0_16px_rgba(116,255,70,0.5)] sm:size-7" />
              <span className="text-lg font-black text-white sm:text-xl">
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
                    navigationLink.isActive && "text-lime-300",
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
                className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/[0.035] px-2 text-xs font-bold text-white transition hover:border-lime-300/55 hover:text-lime-300 sm:h-10 sm:min-w-10 sm:text-sm"
                href={languageHref}
              >
                {languageLabel}
              </Link>
              <Button
                aria-label={copy.glowToggleLabel}
                aria-pressed={isGlowEnabled}
                className={cn(
                  "size-9 rounded-lg border bg-white/[0.035] p-0 text-white hover:border-lime-300/55 hover:bg-white/[0.055] hover:text-lime-300 sm:size-10",
                  isGlowEnabled ? "border-lime-300/70 text-lime-300" : "border-white/15",
                )}
                type="button"
                variant="ghost"
                onClick={() => setIsGlowEnabled((currentGlowValue) => !currentGlowValue)}
              >
                {isGlowEnabled ? <Moon className="size-5" /> : <Sun className="size-5" />}
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[960px] px-4 pb-14 pt-9 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <section className="mx-auto max-w-[820px] text-center">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-lime-300 shadow-[0_0_26px_rgba(116,255,70,0.13)]">
              <PackageOpen className="size-3.5 shrink-0" />
              <span className="truncate">{copy.hero.badge}</span>
            </div>
            <h1 className="mx-auto mt-4 max-w-[760px] text-5xl font-black leading-[0.98] text-white drop-shadow-[0_12px_34px_rgba(0,0,0,0.52)] sm:text-6xl lg:text-7xl">
              {copy.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-[680px] text-base font-medium leading-7 text-slate-100 sm:text-lg">
              {copy.hero.description}
            </p>
            <p className="mx-auto mt-2 max-w-[620px] text-sm leading-6 text-lime-100/78">
              {copy.hero.note}
            </p>
          </section>

          <section className="mx-auto mt-8 max-w-[820px] rounded-[22px] border border-lime-200/28 bg-[#0b1312]/68 p-3 shadow-[0_0_0_1px_rgba(128,255,82,0.08),0_24px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
            <input
              aria-label={copy.uploadPanel.selectButtonLabel}
              accept=".zip"
              className="sr-only"
              ref={fileInputRef}
              tabIndex={-1}
              type="file"
              onChange={handleFileInputChange}
            />
            <div
              className="rounded-[18px] border border-dashed border-lime-300/34 bg-[#07100f]/62 px-3 py-8 text-center shadow-[inset_0_0_92px_rgba(96,255,67,0.05)] sm:px-8"
              onDragOver={(event) => event.preventDefault()}
              onDrop={isConversionRunning ? undefined : handleFileDrop}
            >
              <div className="mx-auto flex size-[104px] flex-col items-center justify-end rounded-2xl border border-white/18 bg-gradient-to-br from-slate-500/42 to-slate-950/88 p-0 shadow-[0_18px_42px_rgba(0,0,0,0.45)]">
                <FileArchive className="mb-2.5 size-11 text-lime-400 drop-shadow-[0_0_18px_rgba(116,255,70,0.34)]" />
                <span className="w-[90px] rounded-lg bg-lime-400 px-3 py-1.5 text-sm font-black text-slate-950 shadow-[0_0_18px_rgba(116,255,70,0.32)]">
                  {copy.uploadPanel.acceptedFileLabel}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-white sm:text-3xl">
                {copy.uploadPanel.dropTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-slate-300">
                {copy.uploadPanel.dropDescription}
              </p>
              <Button
                className="mt-5 min-h-[52px] rounded-lg bg-gradient-to-b from-lime-300 to-lime-500 px-6 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(105,255,70,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] hover:from-lime-200 hover:to-lime-400 hover:text-slate-950 sm:text-base"
                disabled={isConversionRunning}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                {copy.uploadPanel.selectButtonLabel}
                <Upload className="size-5" />
              </Button>
              <p className="mx-auto mt-5 flex max-w-[620px] items-center justify-center gap-2 text-sm leading-6 text-slate-300">
                {invalidFileName ? (
                  <CircleAlert className="size-4 shrink-0 text-amber-300" />
                ) : selectedFile ? (
                  <CheckCircle2 className="size-4 shrink-0 text-lime-300" />
                ) : (
                  <ShieldCheck className="size-4 shrink-0" />
                )}
                <span className="min-w-0 break-words">
                  {invalidFileName
                    ? `${copy.uploadPanel.invalidFileMessage}: ${invalidFileName}`
                    : selectedFile
                      ? `${copy.uploadPanel.selectedFilePrefix}: ${selectedFile.name}. ${copy.uploadPanel.readyMessage}`
                      : copy.hero.note}
                </span>
              </p>
            </div>
            <ZipToMrpackStatusPanel
              conversionRunState={conversionRunState}
              copy={copy}
              onDownload={(conversionResult) =>
                triggerMrpackDownload(
                  conversionResult.outputMrpackBlob,
                  conversionResult.outputMrpackFileName,
                )
              }
              onResetConversion={clearConversionResult}
            />
          </section>

          <ZipToMrpackInfoSection sectionCopy={copy.whatItConverts} />
          <ZipToMrpackStepsSection sectionCopy={copy.howToConvert} />
          <ZipToMrpackLimitsSection limits={copy.limits} />
          <ZipToMrpackFaqSection
            closeAllLabel={copy.faq.closeAllLabel}
            expandedQuestions={expandedFaqQuestions}
            faqItems={copy.faq.items}
            title={copy.faq.title}
            viewAllLabel={copy.faq.viewAllLabel}
            onExpandedQuestionsChange={setExpandedFaqQuestions}
            onToggleAllQuestions={toggleAllFaqQuestions}
          />
        </div>
      </div>
    </main>
  );
}

function getZipToMrpackRoutePath(localeCode: string): SiteRoutePath {
  return localeCode === "zh-Hans" ? "/zh/zip-to-mrpack" : "/zip-to-mrpack";
}

function StructuredDataScript({
  structuredData,
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

function ZipToMrpackInfoSection({
  sectionCopy,
}: {
  sectionCopy: ZipToMrpackInfoSectionCopy;
}) {
  return (
    <ZipToMrpackContentSection
      id="what-it-converts"
      icon={FileText}
      title={sectionCopy.title}
    >
      <div className="space-y-4 text-base leading-8 text-slate-300">
        {sectionCopy.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </ZipToMrpackContentSection>
  );
}

function ZipToMrpackStepsSection({
  sectionCopy,
}: {
  sectionCopy: ZipToMrpackStepsSectionCopy;
}) {
  return (
    <ZipToMrpackContentSection
      id="how-it-works"
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
    </ZipToMrpackContentSection>
  );
}

function ZipToMrpackLimitsSection({
  limits,
}: {
  limits: ZipToMrpackLimitsCopy;
}) {
  return (
    <ZipToMrpackContentSection
      id="limits"
      icon={CircleAlert}
      title={limits.title}
      description={limits.description}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {limits.items.map((limitItem) => (
          <article
            className="rounded-2xl border border-amber-300/16 bg-amber-300/[0.055] p-5 text-sm leading-7 text-amber-50/88"
            key={limitItem.title}
          >
            <h3 className="text-base font-black text-white">
              {limitItem.title}
            </h3>
            <p className="mt-2">{limitItem.description}</p>
          </article>
        ))}
      </div>
    </ZipToMrpackContentSection>
  );
}

function ZipToMrpackFaqSection({
  closeAllLabel,
  expandedQuestions,
  faqItems,
  onExpandedQuestionsChange,
  onToggleAllQuestions,
  title,
  viewAllLabel,
}: {
  closeAllLabel: string;
  expandedQuestions: string[];
  faqItems: ZipToMrpackFaqItemCopy[];
  onExpandedQuestionsChange: (expandedQuestions: string[]) => void;
  onToggleAllQuestions: () => void;
  title: string;
  viewAllLabel: string;
}) {
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
  const faqBulkToggleState = getFaqBulkToggleState({
    closeAllLabel,
    expandedQuestions,
    faqQuestions: faqItems.map((faqItem) => faqItem.question),
    openAllLabel: viewAllLabel,
  });
  const hoverExpandedQuestions = getHoverExpandedQuestions({
    expandedQuestions,
    hoveredQuestion,
  });

  function expandQuestionOnHover(faqQuestion: string) {
    setHoveredQuestion(faqQuestion);
  }

  function collapseQuestionAfterHover(faqQuestion: string) {
    setHoveredQuestion((currentHoveredQuestion) =>
      getNextHoveredQuestionAfterLeave({
        hoveredQuestion: currentHoveredQuestion,
        leavingQuestion: faqQuestion,
      }),
    );
  }

  function changeManualExpandedQuestions(nextVisibleExpandedQuestions: string[]) {
    const nextManualExpandedQuestions =
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions,
        hoveredQuestion,
        nextVisibleExpandedQuestions,
      });
    const nextHoveredQuestion = getNextHoveredQuestionAfterVisibleChange({
      expandedQuestions,
      hoveredQuestion,
      nextVisibleExpandedQuestions,
    });

    setHoveredQuestion(nextHoveredQuestion);
    onExpandedQuestionsChange(nextManualExpandedQuestions);
  }

  return (
    <section
      className="mx-auto mt-12 max-w-[820px] border-t border-white/10 pt-10"
      id="faq"
    >
      <div className="flex items-center justify-between gap-4">
        <ZipToMrpackSectionHeading icon={HelpCircle} title={title} />
        <Button
          className="h-auto min-w-max p-0 text-sm font-black text-lime-400 hover:bg-transparent hover:text-lime-300"
          type="button"
          variant="ghost"
          onClick={onToggleAllQuestions}
        >
          {faqBulkToggleState.buttonLabel}
        </Button>
      </div>

      <Accordion
        className="mt-6 space-y-3"
        type="multiple"
        value={hoverExpandedQuestions}
        onValueChange={changeManualExpandedQuestions}
      >
        {faqItems.map((faqItem, faqItemIndex) => {
          const triggerId = `zip-to-mrpack-faq-trigger-${faqItemIndex}`;
          const contentId = `zip-to-mrpack-faq-content-${faqItemIndex}`;

          return (
            <AccordionItem
              className="overflow-hidden rounded-2xl border border-white/12 bg-black/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
              key={faqItem.question}
              value={faqItem.question}
              onMouseEnter={() => expandQuestionOnHover(faqItem.question)}
              onMouseLeave={() => collapseQuestionAfterHover(faqItem.question)}
            >
              <AccordionTrigger
                aria-controls={contentId}
                className="gap-3 px-5 py-4 text-base font-bold text-white hover:text-lime-300 hover:no-underline [&>svg]:text-slate-300 [&[data-state=open]>svg]:text-lime-300"
                id={triggerId}
              >
                <span className="min-w-0">{faqItem.question}</span>
              </AccordionTrigger>
              <AccordionContent
                aria-labelledby={triggerId}
                className="px-5 pb-5 text-sm leading-7 text-slate-300"
                id={contentId}
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

function ZipToMrpackContentSection({
  children,
  description,
  icon,
  id,
  title,
}: {
  children: ReactNode;
  description?: string;
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  return (
    <section
      className="mx-auto mt-12 max-w-[820px] border-t border-white/10 pt-10"
      id={id}
    >
      <div className="mb-6">
        <ZipToMrpackSectionHeading icon={icon} title={title} />
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

function ZipToMrpackSectionHeading({
  icon: Icon,
  title,
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

function ZipToMrpackStatusPanel({
  conversionRunState,
  copy,
  onDownload,
  onResetConversion,
}: {
  conversionRunState: ZipToMrpackRunState;
  copy: ZipToMrpackPageCopy;
  onDownload: (conversionResult: ZipToMrpackConversionResult) => void;
  onResetConversion: () => void;
}) {
  if (conversionRunState.status === "idle") {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-lime-300/14 bg-lime-300/[0.055] px-4 py-3 text-sm leading-6 text-lime-100/86">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>{copy.hero.note}</span>
      </p>
    );
  }

  if (conversionRunState.status === "working") {
    return (
      <ConversionProgressPanel
        countLabel={copy.uploadPanel.progressCountLabel}
        currentFileCount={conversionRunState.progress.currentFileCount}
        label={getStageLabel(copy, conversionRunState.progress.stage)}
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
          <span>{copy.uploadPanel.errorTitle}</span>
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
        <span>{copy.uploadPanel.successTitle}</span>
      </div>
      <ZipToMrpackCompletionProgress copy={copy} />
      <dl className="mt-3 grid gap-2 text-slate-200 sm:grid-cols-2">
        <SummaryValue
          label={copy.summaryLabels.matched}
          value={String(conversionRunState.result.matchedFileCount)}
        />
        <SummaryValue
          label={copy.summaryLabels.bundled}
          value={String(conversionRunState.result.bundledFileCount)}
        />
      </dl>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          className="min-h-11 rounded-lg bg-lime-400 font-black text-slate-950 hover:bg-lime-300 hover:text-slate-950"
          type="button"
          onClick={() => onDownload(conversionRunState.result)}
        >
          {copy.uploadPanel.downloadLabel}
          <FileArchive className="size-4" />
        </Button>
        <Button
          className="min-h-11 rounded-lg border-white/12 bg-white/[0.045] font-black text-slate-200 hover:border-lime-300/40 hover:bg-white/[0.07] hover:text-lime-200"
          type="button"
          variant="outline"
          onClick={onResetConversion}
        >
          {copy.uploadPanel.resetLabel}
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ZipToMrpackCompletionProgress({ copy }: { copy: ZipToMrpackPageCopy }) {
  const completedProgressPercentText = getCompletedProgressPercentText();

  return (
    <div className="mt-3 rounded-lg border border-lime-300/16 bg-black/18 px-3 py-3">
      <div className="flex items-start justify-between gap-4">
        <span className="min-w-0 break-words font-semibold text-slate-300">
          {copy.uploadPanel.successDescription}
        </span>
        <span className="shrink-0 font-black tabular-nums text-lime-200">
          {completedProgressPercentText}
        </span>
      </div>
      <div
        aria-label={`${copy.uploadPanel.successTitle}: ${completedProgressPercentText}`}
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

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/18 px-3 py-2">
      <dt className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words font-semibold text-white">{value}</dd>
    </div>
  );
}

function getStageLabel(
  copy: ZipToMrpackPageCopy,
  stage: ZipToMrpackConversionStage,
) {
  if (stage === "reading-zip") {
    return copy.statusLabels.readingZip;
  }

  if (stage === "reading-manifest") {
    return copy.statusLabels.readingManifest;
  }

  if (stage === "resolving-curseforge-files") {
    return copy.statusLabels.resolvingCurseForgeFiles;
  }

  if (stage === "matching-modrinth-files") {
    return copy.statusLabels.matchingModrinthFiles;
  }

  if (stage === "downloading-curseforge-files") {
    return copy.statusLabels.downloadingCurseForgeFiles;
  }

  if (stage === "building-mrpack") {
    return copy.statusLabels.buildingMrpack;
  }

  return assertUnknownZipToMrpackStage(stage);
}

function assertUnknownZipToMrpackStage(stage: never): never {
  throw new Error(`Unknown ZIP to MRPack conversion stage: ${String(stage)}.`);
}

function triggerMrpackDownload(outputMrpackBlob: Blob, outputMrpackFileName: string) {
  const outputMrpackUrl = URL.createObjectURL(outputMrpackBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = outputMrpackUrl;
  downloadLink.download = outputMrpackFileName;
  downloadLink.rel = "noopener";
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => URL.revokeObjectURL(outputMrpackUrl), 0);
}

function isZipFileName(fileName: string) {
  return fileName.trim().toLowerCase().endsWith(".zip");
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
          isGlowEnabled ? "opacity-100" : "opacity-80",
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:76px_76px] opacity-[0.12]"
      />
    </>
  );
}
