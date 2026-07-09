"use client";

import type { ChangeEvent, DragEvent, ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  FileArchive,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
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
  workbenchSecondaryButtonClass,
} from "@/components/minecraft-workbench-layout";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invalidFileName, setInvalidFileName] = useState<string | null>(null);
  const [conversionRunState, setConversionRunState] =
    useState<ZipToMrpackRunState>({ status: "idle" });
  const [expandedFaqQuestions, setExpandedFaqQuestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeConversionRunIdRef = useRef(0);

  const logoHref = copy.localeCode === "zh-Hans" ? "/zh" : "/";
  const languageHref = copy.localeCode === "zh-Hans" ? "/zip-to-mrpack" : "/zh/zip-to-mrpack";
  const languageLabel = copy.languageSwitchLabel;
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

  function handleFileDrop(event: DragEvent<HTMLElement>) {
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
    <MinecraftWorkbenchPage lang={copy.localeCode}>
      <StructuredDataScript structuredData={structuredData} />
      <div className="relative z-10">
        <MinecraftWorkbenchTopNavigation
          languageHref={languageHref}
          languageLabel={languageLabel}
          logoAccent={copy.logoAccent}
          logoHref={logoHref}
          logoText={copy.logoText}
          navLinks={copy.navLinks}
        />

        <MinecraftWorkbenchHeroShell
          converter={
            <ZipToMrpackPreviewPanel
              conversionRunState={conversionRunState}
              copy={copy}
              fileInputRef={fileInputRef}
              invalidFileName={invalidFileName}
              isConversionRunning={isConversionRunning}
              selectedFileName={selectedFile?.name ?? null}
              onFileDrop={handleFileDrop}
              onFileInputChange={handleFileInputChange}
              onResetConversion={clearConversionResult}
              onDownload={(conversionResult) =>
                triggerMrpackDownload(
                  conversionResult.outputMrpackBlob,
                  conversionResult.outputMrpackFileName,
                )
              }
            />
          }
        >
          <ZipToMrpackHero copy={copy} />
        </MinecraftWorkbenchHeroShell>

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

        <MinecraftWorkbenchFooter
          copyright={copy.footer.copyright}
          disclaimer={copy.footer.disclaimer}
          links={copy.footer.links}
          logoAccent={copy.logoAccent}
          logoHref={logoHref}
          logoText={copy.logoText}
          tagline={copy.footer.tagline}
        />
      </div>
    </MinecraftWorkbenchPage>
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

function ZipToMrpackHero({ copy }: { copy: ZipToMrpackPageCopy }) {
  return (
    <MinecraftWorkbenchHeroCopy
      badge={copy.hero.badge}
      chips={getZipToMrpackHeroChips(copy)}
      description={copy.hero.description}
      note={copy.hero.note}
    >
      <h1 className="mt-5 max-w-[11ch] text-[clamp(44px,5.6vw,76px)] font-black leading-[0.92] tracking-[-0.075em] text-[#f4f7ef] drop-shadow-[0_5px_0_rgba(0,0,0,0.34)]">
        {copy.hero.title}
      </h1>
    </MinecraftWorkbenchHeroCopy>
  );
}

function getZipToMrpackHeroChips(copy: ZipToMrpackPageCopy) {
  return copy.hero.chips;
}

function ZipToMrpackPreviewPanel({
  conversionRunState,
  copy,
  fileInputRef,
  invalidFileName,
  isConversionRunning,
  onDownload,
  onFileDrop,
  onFileInputChange,
  onResetConversion,
  selectedFileName,
}: {
  conversionRunState: ZipToMrpackRunState;
  copy: ZipToMrpackPageCopy;
  fileInputRef: RefObject<HTMLInputElement | null>;
  invalidFileName: string | null;
  isConversionRunning: boolean;
  onDownload: (conversionResult: ZipToMrpackConversionResult) => void;
  onFileDrop: (event: DragEvent<HTMLElement>) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onResetConversion: () => void;
  selectedFileName: string | null;
}) {
  const [isZipPanelDropActive, setIsZipPanelDropActive] = useState(false);

  function activateZipPanelDropZone(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    if (isConversionRunning) {
      event.dataTransfer.dropEffect = "none";
      setIsZipPanelDropActive(false);
      return;
    }

    event.dataTransfer.dropEffect = "copy";
    setIsZipPanelDropActive(true);
  }

  function keepZipPanelDropZoneActive(event: DragEvent<HTMLElement>) {
    activateZipPanelDropZone(event);
  }

  function deactivateZipPanelDropZone(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    if (isDragStillInsideZipPanel(event.currentTarget, event.relatedTarget)) {
      return;
    }

    setIsZipPanelDropActive(false);
  }

  function dropZipFile(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsZipPanelDropActive(false);

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
        "zip-panel transition-[border-color,box-shadow,background-color] duration-150",
        isZipPanelDropActive &&
          "border-lime-300/85 bg-[linear-gradient(180deg,rgba(56,78,52,0.98),rgba(17,26,21,0.98))] shadow-[0_0_38px_rgba(118,202,76,0.24),14px_16px_0_rgba(0,0,0,0.34),inset_0_3px_0_rgba(255,255,255,0.1),inset_0_-7px_0_rgba(0,0,0,0.2)]"
      )}
      onDragEnter={activateZipPanelDropZone}
      onDragLeave={deactivateZipPanelDropZone}
      onDragOver={keepZipPanelDropZoneActive}
      onDrop={dropZipFile}
    >
      <span className="pointer-events-none absolute inset-3 rounded-[12px] border border-dashed border-[#f4e6bd1f]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <h2 className="text-lg font-black uppercase tracking-[0.09em] text-[#f4e6bd]">
            {copy.previewPanel.title}
          </h2>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#b7f276]">
            <span className="size-2.5 bg-[#76ca4c] shadow-[0_0_14px_rgba(118,202,76,0.72)]" />
            {isConversionRunning
              ? copy.statusLabels.buildingMrpack
              : copy.previewPanel.idleStatusLabel}
          </span>
        </div>

        <input
          aria-label={copy.uploadPanel.selectButtonLabel}
          accept=".zip"
          className="sr-only"
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
          disabled={isConversionRunning}
          onChange={onFileInputChange}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_58px_minmax(220px,0.78fr)] lg:items-stretch">
          <ZipToMrpackSourceSlot
            copy={copy}
            invalidFileName={invalidFileName}
            isZipDropActive={isZipPanelDropActive}
            isConversionRunning={isConversionRunning}
            selectedFileName={selectedFileName}
            onOpenFilePicker={() => fileInputRef.current?.click()}
          />

          <div className="flex min-h-9 items-center justify-center text-5xl font-black text-[#b7f276] drop-shadow-[0_0_18px_rgba(118,202,76,0.42)] lg:min-h-0">
            <span className="rotate-90 lg:rotate-0">›</span>
          </div>

          <ZipToMrpackOutputSlot copy={copy} />
        </div>

        <ZipToMrpackStatusPanel
          conversionRunState={conversionRunState}
          copy={copy}
          onDownload={onDownload}
          onResetConversion={onResetConversion}
        />
      </div>
    </section>
  );
}

function ZipToMrpackSourceSlot({
  copy,
  invalidFileName,
  isZipDropActive,
  isConversionRunning,
  onOpenFilePicker,
  selectedFileName,
}: {
  copy: ZipToMrpackPageCopy;
  invalidFileName: string | null;
  isZipDropActive: boolean;
  isConversionRunning: boolean;
  onOpenFilePicker: () => void;
  selectedFileName: string | null;
}) {
  const hasUploadFeedback = invalidFileName || selectedFileName;
  const uploadStatusText = hasUploadFeedback
    ? getZipUploadStatusText({
        copy,
        invalidFileName,
        selectedFileName,
      })
    : null;

  return (
    <div className={cn(workbenchInnerSlotClass, "flex flex-col p-4")}>
      <div className="inline-flex w-fit items-center border border-lime-300/28 bg-lime-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-lime-100">
        {copy.hero.badge}
      </div>
      <div
        className={cn(
          "mt-4 flex-1 border-2 bg-[linear-gradient(135deg,rgba(104,217,233,0.08),rgba(7,16,13,0.82))] p-4 shadow-[inset_0_4px_0_rgba(0,0,0,0.34)] transition",
          isZipDropActive
            ? "border-lime-300 bg-[linear-gradient(135deg,rgba(118,202,76,0.22),rgba(7,16,13,0.88))] shadow-[0_0_30px_rgba(118,202,76,0.22),inset_0_4px_0_rgba(0,0,0,0.28)]"
            : "border-cyan-200/30 hover:border-lime-300/45"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center border bg-white/5 text-[#b7f276] transition",
              isZipDropActive
                ? "border-lime-300/70 bg-lime-300/20 text-lime-200 shadow-[0_0_18px_rgba(118,202,76,0.34)]"
                : "border-white/20"
            )}
          >
            <FileArchive className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.09em] text-[#f4e6bd]">
              {copy.uploadPanel.acceptedFileLabel}
            </p>
            <strong className="mt-1 block text-lg font-black leading-6 tracking-[-0.02em] text-white">
              {isZipDropActive
                ? getZipDropActiveText(copy)
                : selectedFileName ?? copy.uploadPanel.dropTitle}
            </strong>
          </div>
        </div>
      </div>
      <Button
        className={cn(workbenchPrimaryButtonClass, "mt-4 w-full justify-center gap-2 px-4")}
        disabled={isConversionRunning}
        type="button"
        onClick={onOpenFilePicker}
      >
        {copy.uploadPanel.selectButtonLabel}
        <Upload className="size-5" />
      </Button>
      {hasUploadFeedback ? (
        <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#c8d3c2]">
          {invalidFileName ? (
            <CircleAlert className="mt-1 size-4 shrink-0 text-red-300" />
          ) : (
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-lime-300" />
          )}
          <span className="min-w-0 break-words">{uploadStatusText}</span>
        </p>
      ) : null}
    </div>
  );
}

function isDragStillInsideZipPanel(
  zipPanelElement: HTMLElement,
  nextDragTarget: EventTarget | null,
) {
  return nextDragTarget instanceof Node && zipPanelElement.contains(nextDragTarget);
}

function getZipDropActiveText(copy: ZipToMrpackPageCopy) {
  return copy.previewPanel.dropActiveLabel;
}

function ZipToMrpackOutputSlot({ copy }: { copy: ZipToMrpackPageCopy }) {
  return (
    <div className={cn(workbenchInnerSlotClass, "flex flex-col justify-between p-4")}>
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.09em] text-[#f4e6bd]">
          {copy.previewPanel.outputSlotLabel}
        </p>
        <div className="flex min-h-[54px] items-center justify-between border-2 border-cyan-200/45 bg-[linear-gradient(135deg,rgba(104,217,233,0.28),rgba(7,16,13,0.55)),#081214] px-3 text-sm font-bold text-cyan-50 opacity-85 shadow-[inset_0_4px_0_rgba(0,0,0,0.34)]">
          <span>{copy.previewPanel.outputFileLabel}</span>
          <span className="size-7 border-2 border-white/30 bg-[linear-gradient(135deg,#baf8ff,#68d9e9_55%,#237a85_56%)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]" />
        </div>
      </div>
    </div>
  );
}

function getZipUploadStatusText({
  copy,
  invalidFileName,
  selectedFileName,
}: {
  copy: ZipToMrpackPageCopy;
  invalidFileName: string | null;
  selectedFileName: string | null;
}) {
  if (invalidFileName) {
    return `${copy.uploadPanel.invalidFileMessage}: ${invalidFileName}`;
  }

  if (selectedFileName) {
    return `${copy.uploadPanel.selectedFilePrefix}: ${selectedFileName}. ${copy.uploadPanel.readyMessage}`;
  }

  throw new Error(
    `Missing ZIP upload feedback source: invalidFileName=${String(invalidFileName)}, selectedFileName=${String(selectedFileName)}.`
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
      <div className={cn(workbenchInfoPanelClass, "space-y-4 text-base leading-8 text-[#c8d3c2]")}>
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
          <article className={workbenchMiniPanelClass} key={step.title}>
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
            className="border-2 border-red-300/25 bg-red-500/[0.08] p-5 text-sm leading-7 text-red-50/90 shadow-[8px_8px_0_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.04)]"
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
      className="mx-auto mt-12 max-w-[1040px] border-t border-white/10 pt-10"
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
              className="overflow-hidden border-2 border-[#f4e6bd21] bg-[#18211ec2] shadow-[inset_0_2px_0_rgba(255,255,255,0.04),8px_8px_0_rgba(0,0,0,0.18)]"
              key={faqItem.question}
              value={faqItem.question}
              onMouseEnter={() => expandQuestionOnHover(faqItem.question)}
              onMouseLeave={() => collapseQuestionAfterHover(faqItem.question)}
            >
              <AccordionTrigger
                aria-controls={contentId}
                className="gap-3 px-5 py-4 text-base font-black text-[#f4e6bd] hover:text-[#b7f276] hover:no-underline [&>svg]:text-[#b8c3b2] [&[data-state=open]>svg]:text-[#b7f276]"
                id={triggerId}
              >
                <span className="min-w-0">{faqItem.question}</span>
              </AccordionTrigger>
              <AccordionContent
                aria-labelledby={triggerId}
                className="px-5 pb-5 text-sm leading-7 text-[#c8d3c2]"
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

function ZipToMrpackSectionHeading({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return <MinecraftWorkbenchSectionHeading icon={Icon} title={title} />;
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
      <p className="mt-3 flex items-start gap-2 border-2 border-lime-200/20 bg-lime-300/[0.07] px-3 py-2 text-xs leading-5 text-lime-100 shadow-[6px_6px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.05)]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>{copy.uploadPanel.dropDescription}</span>
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
        className="mt-4 border-2 border-red-300/35 bg-red-500/[0.10] px-4 py-3 text-sm leading-6 text-red-50 shadow-[6px_6px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.05)]"
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
      className="mt-4 border-2 border-cyan-200/35 bg-cyan-300/[0.10] px-4 py-4 text-sm leading-6 text-cyan-50 shadow-[6px_6px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.05)]"
    >
      <div className="flex items-start gap-2 font-black text-cyan-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{copy.uploadPanel.successTitle}</span>
      </div>
      <ZipToMrpackCompletionProgress copy={copy} />
      <dl className="mt-3 grid gap-2 text-slate-200 sm:grid-cols-2">
        <MinecraftWorkbenchSummaryValue
          label={copy.summaryLabels.matched}
          value={String(conversionRunState.result.matchedFileCount)}
        />
        <MinecraftWorkbenchSummaryValue
          label={copy.summaryLabels.bundled}
          value={String(conversionRunState.result.bundledFileCount)}
        />
      </dl>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          className={workbenchPrimaryButtonClass}
          type="button"
          onClick={() => onDownload(conversionRunState.result)}
        >
          {copy.uploadPanel.downloadLabel}
          <FileArchive className="size-4" />
        </Button>
        <Button
          className={workbenchSecondaryButtonClass}
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
