import Link from "next/link";
import {
  FileText,
  Info,
  Mail,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  MinecraftWorkbenchContentSection,
  MinecraftWorkbenchFooter,
  MinecraftWorkbenchHeroCopy,
  MinecraftWorkbenchHeroShell,
  MinecraftWorkbenchPage,
  MinecraftWorkbenchTopNavigation,
  workbenchInfoPanelClass,
  workbenchMiniPanelClass,
  workbenchPanelClass,
} from "@/components/minecraft-workbench-layout";
import type {
  TrustPageCopy,
  TrustPageSectionCopy,
} from "@/lib/i18n/trust-page-copy";
import { cn } from "@/lib/utils";

type LocalizedTrustPageProps = {
  copy: TrustPageCopy;
};

const trustSectionIcons: LucideIcon[] = [
  ShieldCheck,
  FileText,
  ScrollText,
  Mail,
  Info,
];

export function LocalizedTrustPage({ copy }: LocalizedTrustPageProps) {
  return (
    <MinecraftWorkbenchPage lang={copy.localeCode}>
      <div className="relative z-10">
        <MinecraftWorkbenchTopNavigation
          languageHref={copy.languageHref}
          languageLabel={copy.languageLabel}
          logoAccent={copy.logoAccent}
          logoHref={copy.logoHref}
          logoText={copy.logoText}
          navLinks={copy.navLinks}
        />

        <MinecraftWorkbenchHeroShell converter={<TrustSummaryPanel copy={copy} />}>
          <TrustHero copy={copy} />
        </MinecraftWorkbenchHeroShell>

        {copy.sections.map((sectionCopy, sectionIndex) => (
          <TrustContentSection
            icon={getTrustSectionIcon(sectionIndex)}
            key={sectionCopy.id}
            sectionCopy={sectionCopy}
          />
        ))}

        <MinecraftWorkbenchFooter
          copyright={copy.footer.copyright}
          disclaimer={copy.footer.disclaimer}
          links={copy.footer.links}
          logoAccent={copy.logoAccent}
          logoHref={copy.logoHref}
          logoText={copy.logoText}
          tagline={copy.footer.tagline}
        />
      </div>
    </MinecraftWorkbenchPage>
  );
}

function TrustHero({ copy }: { copy: TrustPageCopy }) {
  return (
    <MinecraftWorkbenchHeroCopy
      badge={copy.hero.badge}
      chipListAriaLabel={copy.hero.chipListAriaLabel}
      chips={copy.hero.chips}
      description={copy.hero.description}
      note={copy.hero.note}
    >
      <h1 className="mt-5 max-w-[12ch] text-[clamp(42px,5vw,72px)] font-black leading-[0.94] text-[#f4f7ef] drop-shadow-[0_5px_0_rgba(0,0,0,0.34)]">
        {copy.hero.title}
      </h1>
    </MinecraftWorkbenchHeroCopy>
  );
}

function TrustSummaryPanel({ copy }: { copy: TrustPageCopy }) {
  return (
    <aside className={cn(workbenchPanelClass, "space-y-4")}>
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-7 text-[#b7f276]" />
        <h2 className="text-2xl font-black leading-none text-white">
          {copy.hero.summaryTitle}
        </h2>
      </div>
      <dl className="grid gap-3">
        {copy.hero.summaryItems.map((summaryItem) => (
          <div className={workbenchMiniPanelClass} key={summaryItem.label}>
            <dt className="text-xs font-black uppercase tracking-[0.08em] text-[#b8c3b2]">
              {summaryItem.label}
            </dt>
            <dd className="mt-2 break-words text-sm font-semibold leading-6 text-[#f4f7ef]">
              {summaryItem.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function TrustContentSection({
  icon,
  sectionCopy,
}: {
  icon: LucideIcon;
  sectionCopy: TrustPageSectionCopy;
}) {
  return (
    <MinecraftWorkbenchContentSection
      icon={icon}
      id={sectionCopy.id}
      title={sectionCopy.title}
    >
      <div className={workbenchInfoPanelClass}>
        <div className="space-y-4 text-base leading-7 text-[#d7dfd2]">
          {sectionCopy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {sectionCopy.links ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {sectionCopy.links.map((sectionLink) => (
              <Link
                className="border border-cyan-200/35 bg-cyan-300/[0.1] px-3 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
                href={sectionLink.href}
                key={sectionLink.href}
              >
                {sectionLink.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </MinecraftWorkbenchContentSection>
  );
}

function getTrustSectionIcon(sectionIndex: number): LucideIcon {
  return trustSectionIcons[sectionIndex] ?? Info;
}
