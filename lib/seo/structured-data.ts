import type { ConverterPageCopy } from "@/lib/i18n/converter-page-copy";
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
  return buildPageStructuredData({
    applicationName:
      copy.localeCode === "zh-Hans"
        ? "ZIP 转 MRPack 转换器"
        : "ZIP to MRPack Converter",
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
