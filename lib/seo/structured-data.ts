import type { ConverterPageCopy } from "@/lib/i18n/converter-page-copy";
import { getSiteMetadataCopy } from "@/lib/i18n/site-metadata-copy";
import type { ZipToMrpackPageCopy } from "@/lib/i18n/zip-to-mrpack-page-copy";
import {
  buildAbsoluteUrl,
  resolveProductionSiteUrl,
  type SiteRoutePath,
} from "@/lib/seo/site-metadata";

type FaqItemCopy = {
  question: string;
  answer: string;
};

type StructuredDataInput<TCopy> = {
  routePath: SiteRoutePath;
  copy: TCopy;
  siteUrl?: URL;
};

type JsonLdGraphEntry = Record<string, unknown>;

export type PageStructuredData = {
  "@context": "https://schema.org";
  "@graph": JsonLdGraphEntry[];
};

const siteName = "MRPack to ZIP";

export function buildConverterStructuredData({
  copy,
  routePath,
  siteUrl = resolveProductionSiteUrl(),
}: StructuredDataInput<ConverterPageCopy>): PageStructuredData {
  return buildPageStructuredData({
    applicationName:
      copy.localeCode === "zh-Hans"
        ? "MRPack 转 ZIP 转换器"
        : "MRPack to ZIP Converter",
    description: copy.hero.description,
    faqItems: copy.faq.items,
    routePath,
    siteUrl,
  });
}

export function buildZipToMrpackStructuredData({
  copy,
  routePath,
  siteUrl = resolveProductionSiteUrl(),
}: StructuredDataInput<ZipToMrpackPageCopy>): PageStructuredData {
  const routeMetadataCopy = getSiteMetadataCopy(routePath);

  return buildPageStructuredData({
    applicationName: routeMetadataCopy.title,
    description: copy.hero.description,
    faqItems: copy.faq.items,
    routePath,
    siteUrl,
  });
}

function buildPageStructuredData({
  applicationName,
  description,
  faqItems,
  routePath,
  siteUrl,
}: {
  applicationName: string;
  description: string;
  faqItems: FaqItemCopy[];
  routePath: SiteRoutePath;
  siteUrl: URL;
}): PageStructuredData {
  const canonicalUrl = buildAbsoluteUrl(routePath, siteUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationData(siteUrl),
      buildWebSiteData(siteUrl),
      buildBreadcrumbListData({ routePath, siteUrl }),
      {
        "@type": "WebApplication",
        name: applicationName,
        url: canonicalUrl,
        description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web browser",
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((faqItem) => ({
          "@type": "Question",
          name: faqItem.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faqItem.answer,
          },
        })),
      },
    ],
  };
}

function buildOrganizationData(siteUrl: URL): JsonLdGraphEntry {
  return {
    "@type": "Organization",
    "@id": buildSiteFragmentUrl("organization", siteUrl),
    name: siteName,
    url: buildAbsoluteUrl("/", siteUrl),
  };
}

function buildWebSiteData(siteUrl: URL): JsonLdGraphEntry {
  return {
    "@type": "WebSite",
    "@id": buildSiteFragmentUrl("website", siteUrl),
    name: siteName,
    url: buildAbsoluteUrl("/", siteUrl),
    inLanguage: ["en", "zh-Hans"],
    publisher: {
      "@id": buildSiteFragmentUrl("organization", siteUrl),
    },
  };
}

function buildBreadcrumbListData({
  routePath,
  siteUrl,
}: {
  routePath: SiteRoutePath;
  siteUrl: URL;
}): JsonLdGraphEntry {
  const itemListElement = [
    buildBreadcrumbItem({
      position: 1,
      name: siteName,
      item: buildAbsoluteUrl("/", siteUrl),
    }),
  ];

  if (routePath !== "/") {
    itemListElement.push(
      buildBreadcrumbItem({
        position: 2,
        name: getSiteMetadataCopy(routePath).title,
        item: buildAbsoluteUrl(routePath, siteUrl),
      }),
    );
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

function buildBreadcrumbItem({
  position,
  name,
  item,
}: {
  position: number;
  name: string;
  item: string;
}): JsonLdGraphEntry {
  return {
    "@type": "ListItem",
    position,
    name,
    item,
  };
}

function buildSiteFragmentUrl(fragmentId: string, siteUrl: URL): string {
  return new URL(`/#${fragmentId}`, siteUrl).toString();
}
