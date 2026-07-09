import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Github, LockKeyhole, PackageOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkbenchNavigationLink = {
  href: string;
  label: string;
  isActive: boolean;
};

export type WorkbenchFooterLink = {
  href: string;
  label: string;
};

export const workbenchPanelClass =
  "relative overflow-hidden rounded-[16px] border-[3px] border-[#f4e6bd3d] bg-[linear-gradient(180deg,rgba(47,60,53,0.94),rgba(17,21,21,0.98))] p-4 shadow-[14px_16px_0_rgba(0,0,0,0.34),inset_0_3px_0_rgba(255,255,255,0.08),inset_0_-7px_0_rgba(0,0,0,0.22)] sm:p-5";

export const workbenchInnerSlotClass =
  "rounded-[8px] border-2 border-[#f4e6bd24] bg-[#050c0add] shadow-[inset_0_6px_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]";

export const workbenchPrimaryButtonClass =
  "min-h-[50px] rounded-none border-2 border-[#f4e6bd3d] bg-[linear-gradient(180deg,#b7f276,#76ca4c)] px-4 font-black text-[#08200f] shadow-[0_6px_0_#315d26,inset_0_2px_0_rgba(255,255,255,0.26)] transition hover:translate-y-[-1px] hover:bg-[linear-gradient(180deg,#c8ff8f,#84d75a)] hover:text-[#08200f] active:translate-y-[1px] active:shadow-[0_3px_0_#315d26,inset_0_2px_0_rgba(255,255,255,0.22)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70";

export const workbenchSecondaryButtonClass =
  "min-h-[50px] rounded-none border-2 border-cyan-200/40 bg-cyan-300/[0.14] px-4 font-black text-cyan-50 shadow-[0_6px_0_rgba(24,72,78,0.65),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:translate-y-[-1px] hover:border-cyan-200/60 hover:bg-cyan-300/[0.2] hover:text-cyan-50 active:translate-y-[1px] active:shadow-[0_3px_0_rgba(24,72,78,0.65),inset_0_1px_0_rgba(255,255,255,0.1)]";

export const workbenchInfoPanelClass =
  "rounded-[16px] border-2 border-[#f4e6bd2b] bg-[#111715db] p-6 shadow-[10px_10px_0_rgba(0,0,0,0.24),inset_0_2px_0_rgba(255,255,255,0.06)]";

export const workbenchMiniPanelClass =
  "rounded-[10px] border-2 border-[#f4e6bd21] bg-[#07100fa8] p-5 shadow-[10px_10px_0_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.04)]";

export function MinecraftWorkbenchPage({
  children,
  lang
}: {
  children: ReactNode;
  lang: string;
}) {
  return (
    <main
      lang={lang}
      className="relative isolate min-h-[100dvh] overflow-x-hidden bg-[#06100d] text-[#f4f7ef] selection:bg-lime-300 selection:text-slate-950"
    >
      <MinecraftWorkbenchBackground />
      {children}
    </main>
  );
}

export function MinecraftWorkbenchBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[-4] bg-[linear-gradient(90deg,rgba(6,16,13,0.20),rgba(6,16,13,0.02)_44%,rgba(6,16,13,0.34)),linear-gradient(180deg,rgba(6,16,13,0.02),rgba(6,16,13,0.46)),url('/assets/mrpackzip-voxel-bg.png')] bg-cover bg-center bg-no-repeat opacity-100 saturate-[1.2] contrast-[1.08] brightness-[1.2]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[-3] bg-[radial-gradient(circle_at_78%_28%,rgba(104,217,233,0.13),transparent_27%),radial-gradient(circle_at_20%_18%,rgba(118,202,76,0.14),transparent_32%),radial-gradient(circle_at_50%_115%,rgba(0,0,0,0.58),transparent_42%)] [mask-image:linear-gradient(to_bottom,black_0_82%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-[68px] z-[-2] hidden h-[min(720px,calc(100dvh-68px))] overflow-hidden opacity-[0.88] md:block"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,230,189,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(244,230,189,0.026)_1px,transparent_1px),repeating-linear-gradient(0deg,rgba(255,255,255,0.012)_0_1px,transparent_1px_6px)] bg-[size:42px_42px,42px_42px,auto]" />
        <VoxelCluster className="left-[48%] top-[10%] h-[190px] w-[260px] rotate-[3deg] opacity-[0.78] [--voxel-size:44px]" />
        <VoxelCluster className="left-[76%] top-[8%] h-[240px] w-[340px] rotate-[7deg] opacity-[0.72] [--voxel-size:50px]" />
        <VoxelCluster className="left-[43%] top-[40%] h-[210px] w-[280px] rotate-[-5deg] opacity-50 [--voxel-size:46px]" />
        <VoxelCluster className="left-[4%] top-[68%] h-[230px] w-[360px] rotate-[-2deg] opacity-[0.34] [--voxel-size:54px]" />
        <VoxelCluster className="left-[86%] top-[62%] h-[220px] w-[300px] rotate-[4deg] opacity-[0.42] [--voxel-size:48px]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_14%_42%,rgba(76,255,54,0.11),transparent_18%),radial-gradient(circle_at_86%_40%,rgba(104,217,233,0.11),transparent_18%)] opacity-70 transition-opacity duration-500"
      />
    </>
  );
}

function VoxelCluster({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute drop-shadow-[14px_18px_0_rgba(0,0,0,0.18)] before:absolute before:inset-0 before:border-2 before:border-lime-200/15 before:bg-[linear-gradient(135deg,rgba(182,240,117,0.26),rgba(70,116,48,0.16)_42%,transparent_43%),linear-gradient(45deg,rgba(244,230,189,0.08)_0_25%,transparent_25%_50%,rgba(244,230,189,0.05)_50%_75%,transparent_75%)] before:bg-[length:var(--voxel-size)_var(--voxel-size)] before:[clip-path:polygon(8%_22%,74%_5%,98%_30%,88%_88%,21%_98%,0_70%)] before:shadow-[inset_0_2px_0_rgba(255,255,255,0.08),0_0_36px_rgba(118,202,76,0.08)] after:absolute after:inset-0 after:translate-x-7 after:translate-y-[34px] after:border-2 after:border-cyan-200/15 after:bg-[linear-gradient(135deg,rgba(104,217,233,0.18),rgba(23,72,78,0.12)_42%,transparent_43%),linear-gradient(45deg,rgba(104,217,233,0.16)_0_25%,transparent_25%_50%,rgba(104,217,233,0.08)_50%_75%,transparent_75%)] after:bg-[length:var(--voxel-size)_var(--voxel-size)] after:opacity-45 after:[clip-path:polygon(8%_22%,74%_5%,98%_30%,88%_88%,21%_98%,0_70%)]",
        className
      )}
    />
  );
}

export function MinecraftWorkbenchTopNavigation({
  languageHref,
  languageLabel,
  logoAccent,
  logoHref,
  logoText,
  navLinks
}: {
  languageHref: string;
  languageLabel: string;
  logoAccent: string;
  logoHref: string;
  logoText: string;
  navLinks: WorkbenchNavigationLink[];
}) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-[#f4e6bd1f] bg-[#06100ce6] shadow-[0_14px_0_rgba(0,0,0,0.18),inset_0_-1px_0_rgba(118,202,76,0.13)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] w-[min(1180px,calc(100%-24px))] items-center justify-between gap-3 py-2 sm:w-[min(1180px,calc(100%-32px))]">
        <Link
          aria-label={`${logoText}${logoAccent}`}
          className="flex min-w-max items-center gap-2"
          href={logoHref}
        >
          <Box className="size-6 text-lime-400 drop-shadow-[0_0_16px_rgba(116,255,70,0.5)] sm:size-7" />
          <span className="text-lg font-black tracking-[-0.03em] text-white sm:text-xl">
            {logoText}
            <span className="text-lime-400">{logoAccent}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium text-[#b8c3b2] md:flex">
          {navLinks.map((navigationLink) => (
            <Link
              aria-current={navigationLink.isActive ? "page" : undefined}
              className={cn(
                "border border-[#f4e6bd24] bg-[#18211ebd] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:translate-y-[-1px] hover:border-lime-300/50 hover:text-white",
                navigationLink.isActive &&
                  "border-lime-300/60 bg-lime-700/20 text-[#b7f276]"
              )}
              href={navigationLink.href}
              key={navigationLink.label}
            >
              {navigationLink.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            className="grid h-10 min-w-10 place-items-center border border-[#f4e6bd24] bg-[#18211ebd] px-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:translate-y-[-1px] hover:border-lime-300/50 hover:text-[#b7f276] sm:text-sm"
            href={languageHref}
          >
            {languageLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MinecraftWorkbenchHeroShell({
  children,
  converter
}: {
  children: ReactNode;
  converter: ReactNode;
}) {
  return (
    <section className="relative mx-auto grid min-h-[calc(100dvh-68px)] w-[min(1180px,calc(100%-24px))] grid-cols-1 items-center gap-8 py-8 sm:w-[min(1180px,calc(100%-32px))] md:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(430px,1.1fr)] lg:gap-10 lg:py-12">
      <HeroBlockArt />
      <div>{children}</div>
      <div>{converter}</div>
    </section>
  );
}

function HeroBlockArt() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[min(42%,520px)] top-[18%] z-[-1] hidden h-[360px] w-[min(28vw,360px)] opacity-90 lg:block"
    >
      <BlockPiece className="left-[7%] top-[10%] size-24 rotate-[-3deg] border-lime-200/20" />
      <BlockPiece className="left-[43%] top-0 size-[122px] rotate-[4deg] border-cyan-200/25 bg-[radial-gradient(circle_at_66%_34%,rgba(104,217,233,0.48),transparent_0_13%,transparent_14%),radial-gradient(circle_at_34%_70%,rgba(104,217,233,0.3),transparent_0_10%,transparent_11%),linear-gradient(135deg,rgba(104,217,233,0.16),rgba(9,27,29,0.32))]" />
      <BlockPiece className="left-[22%] top-[34%] size-[138px] rotate-[1deg] border-lime-200/15" />
      <BlockPiece className="left-[67%] top-[42%] size-[86px] rotate-[-5deg] border-lime-200/20" />
      <BlockPiece className="left-0 top-[68%] size-[78px] rotate-[5deg] border-cyan-200/20 bg-[radial-gradient(circle_at_66%_34%,rgba(104,217,233,0.48),transparent_0_13%,transparent_14%),linear-gradient(135deg,rgba(104,217,233,0.16),rgba(9,27,29,0.32))]" />
    </div>
  );
}

function BlockPiece({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "absolute border-2 bg-[linear-gradient(135deg,rgba(182,240,117,0.24),rgba(42,74,35,0.24)_45%,rgba(7,16,13,0.08)_46%),linear-gradient(45deg,rgba(244,230,189,0.07)_0_25%,transparent_25%_50%,rgba(244,230,189,0.04)_50%_75%,transparent_75%)] bg-[length:auto,22px_22px] shadow-[10px_12px_0_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08),0_0_26px_rgba(118,202,76,0.08)]",
        className
      )}
    />
  );
}

export function MinecraftWorkbenchHeroCopy({
  badge,
  children,
  chipListAriaLabel,
  description,
  chips,
  note
}: {
  badge: string;
  children: ReactNode;
  chipListAriaLabel?: string;
  chips?: string[];
  description: string;
  note: string;
}) {
  const visibleChipLabels = chips ?? [];
  const hasVisibleChips = visibleChipLabels.length > 0;

  return (
    <div>
      <div className="inline-flex max-w-full items-center gap-2 border-2 border-[#f4e6bd3d] bg-[linear-gradient(180deg,rgba(92,63,37,0.96),rgba(68,47,31,0.96))] px-3 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#f4e6bd] shadow-[5px_5px_0_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.12)]">
        <PackageOpen className="size-3.5 shrink-0 text-[#b7f276]" />
        <span className="truncate">{badge}</span>
      </div>
      {children}
      <p className="mt-6 max-w-[58ch] text-base font-medium leading-7 text-[#d7dfd2] sm:text-lg">
        {description}
      </p>
      <p className="mt-5 max-w-[560px] border-2 border-[#f4e6bd2e] bg-[linear-gradient(90deg,rgba(138,91,53,0.22),rgba(24,33,30,0.86)),rgba(24,33,30,0.82)] px-4 py-3 text-sm leading-6 text-[#f4e6bd] shadow-[6px_6px_0_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.07)]">
        {note}
      </p>
      {hasVisibleChips ? (
        <div
          aria-label={chipListAriaLabel}
          className="mt-5 flex flex-wrap gap-2"
        >
          {visibleChipLabels.map((chipLabel) => (
            <span
              className="inline-flex items-center border border-cyan-200/40 bg-cyan-300/[0.12] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-100 shadow-[0_3px_0_rgba(24,72,78,0.58),inset_0_1px_0_rgba(255,255,255,0.08)]"
              key={chipLabel}
            >
              {chipLabel}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MinecraftWorkbenchContentSection({
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
      className="mx-auto w-[min(1180px,calc(100%-24px))] py-7 sm:w-[min(1180px,calc(100%-32px))]"
      id={id}
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <MinecraftWorkbenchSectionHeading icon={icon} title={title} />
        {description ? (
          <p className="max-w-[48ch] text-base leading-7 text-[#b8c3b2]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function MinecraftWorkbenchSectionHeading({
  icon: Icon,
  title
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Icon className="size-7 shrink-0 text-[#b7f276] drop-shadow-[0_0_16px_rgba(118,202,76,0.26)]" />
      <h2 className="min-w-0 text-3xl font-black leading-none tracking-[-0.055em] text-[#f4f7ef] sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

export function MinecraftWorkbenchSummaryValue({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-2 border-[#f4e6bd21] bg-black/20 px-3 py-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.04)]">
      <dt className="text-xs font-black uppercase tracking-[0.08em] text-[#b8c3b2]">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words font-semibold text-white">{value}</dd>
    </div>
  );
}

export function MinecraftWorkbenchFooter({
  copyright,
  disclaimer,
  links,
  logoAccent,
  logoHref,
  logoText,
  tagline
}: {
  copyright: string;
  disclaimer: string;
  links: WorkbenchFooterLink[];
  logoAccent: string;
  logoHref: string;
  logoText: string;
  tagline: string;
}) {
  return (
    <footer className="mx-auto mb-12 mt-4 w-[min(1180px,calc(100%-24px))] rounded-[16px] border-2 border-[#f4e6bd2b] bg-[#111715db] p-6 shadow-[10px_10px_0_rgba(0,0,0,0.24),inset_0_2px_0_rgba(255,255,255,0.06)] sm:w-[min(1180px,calc(100%-32px))]">
      <div className="flex flex-col justify-between gap-5 border-b border-[#f4e6bd1f] pb-5 md:flex-row md:items-start">
        <div>
          <Link className="flex items-center gap-2" href={logoHref}>
            <Box className="size-6 text-lime-400" />
            <span className="text-lg font-black tracking-[-0.03em] text-white">
              {logoText}
              <span className="text-lime-400">{logoAccent}</span>
            </span>
          </Link>
          <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#b8c3b2]">
            {tagline}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm font-medium text-cyan-100">
          {links.map((footerLink) => (
            <Link
              className="border border-cyan-200/25 bg-cyan-300/[0.07] px-3 py-2 transition hover:border-cyan-200/50 hover:text-white"
              href={footerLink.href}
              key={footerLink.label}
            >
              {footerLink.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-3 pt-4 text-xs text-[#b8c3b2] md:flex-row md:items-center md:justify-between">
        <p>{copyright}</p>
        <div className="flex flex-wrap items-center gap-3">
          <p>{disclaimer}</p>
          <Github className="size-4" />
          <LockKeyhole className="size-4" />
        </div>
      </div>
    </footer>
  );
}
