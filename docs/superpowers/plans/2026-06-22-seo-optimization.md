# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the confirmed P1 and key P2 technical/content SEO issues for the MRPack to ZIP site.

**Architecture:** Keep SEO configuration in small public interfaces, keep page copy in existing i18n modules, and keep rendering changes limited to route/layout boundaries. Avoid new abstractions beyond the current SEO, locale, and copy needs.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest.

---

### Task 1: SEO Constants, Metadata, Robots, Sitemap

**Files:**
- Create: `lib/seo/site-metadata.ts`
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/zh/page.tsx`
- Modify: `app/zip-to-mrpack/page.tsx`
- Modify: `app/zh/zip-to-mrpack/page.tsx`
- Test: `tests/seo/site-metadata.test.ts`

- [ ] Write failing tests for site URL normalization, sitemap route coverage, and x-default language alternates.
- [ ] Run the focused SEO metadata tests and confirm they fail.
- [ ] Implement `lib/seo/site-metadata.ts` with precise names and fail-fast URL validation.
- [ ] Add `metadataBase`, Open Graph, Twitter, absolute alternates, `x-default`, `app/robots.ts`, and `app/sitemap.ts`.
- [ ] Run focused tests until green.

### Task 2: Static Locale Layout

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/zh/layout.tsx`
- Modify: `components/localized-converter-page.tsx`
- Modify: `components/localized-zip-to-mrpack-page.tsx`
- Test: `tests/i18n/layout-locale.test.ts`

- [ ] Write failing tests proving the root layout does not import `headers` and that the zh layout declares `zh-Hans`.
- [ ] Run the focused layout tests and confirm they fail.
- [ ] Remove request-header language wiring from the root layout.
- [ ] Add a zh route layout that statically sets the Chinese document language for zh pages.
- [ ] Remove client-side document language effects when they are no longer needed.
- [ ] Run focused tests until green.

### Task 3: Content Depth, FAQ Semantics, JSON-LD

**Files:**
- Create: `lib/seo/structured-data.ts`
- Modify: `lib/i18n/converter-page-copy.ts`
- Modify: `lib/i18n/zip-to-mrpack-page-copy.ts`
- Modify: `components/localized-converter-page.tsx`
- Modify: `components/localized-zip-to-mrpack-page.tsx`
- Test: `tests/seo/structured-data.test.ts`
- Test: `tests/i18n/converter-page-copy.test.ts`
- Test: `tests/i18n/zip-to-mrpack-page-copy.test.ts`

- [ ] Write failing tests for keyword coverage, visible limits copy, FAQ heading semantics, and JSON-LD output shape.
- [ ] Run focused tests and confirm they fail.
- [ ] Add concise, natural homepage copy for search-intent variants and known limits.
- [ ] Strengthen `/zip-to-mrpack` with what/how/limits/FAQ content without changing conversion behavior.
- [ ] Add SoftwareApplication/WebApplication and FAQ JSON-LD derived from existing page copy.
- [ ] Run focused tests until green.

### Task 4: Verification

**Files:**
- No production files unless a verification failure exposes a scoped fix.

- [ ] Run `pnpm exec tsc --noEmit --incremental false`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Start a local production server.
- [ ] Verify `/`, `/zh`, `/zip-to-mrpack`, `/zh/zip-to-mrpack`, `/robots.txt`, and `/sitemap.xml` with curl.
- [ ] Stop the local server.
