import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LocalizedConverterPage } from "@/components/localized-converter-page";
import { LocalizedZipToMrpackPage } from "@/components/localized-zip-to-mrpack-page";
import { englishConverterPageCopy } from "@/lib/i18n/converter-page-copy";
import { englishZipToMrpackPageCopy } from "@/lib/i18n/zip-to-mrpack-page-copy";

describe("structured data", () => {
  test("builds converter JSON-LD from page copy FAQ", async () => {
    const { buildConverterStructuredData } = await import(
      "@/lib/seo/structured-data"
    );
    const structuredData = buildConverterStructuredData({
      copy: englishConverterPageCopy,
      routePath: "/",
    });
    const graph = structuredData["@graph"];
    const applicationData = graph.find(
      (graphEntry: Record<string, unknown>) =>
        graphEntry["@type"] === "WebApplication",
    );
    const faqData = graph.find(
      (graphEntry: Record<string, unknown>) => graphEntry["@type"] === "FAQPage",
    );
    const faqItems = readFaqMainEntity(faqData);

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(applicationData).toMatchObject({
      name: "MRPack to ZIP Converter",
      url: "https://mrpacktozip.pro/",
    });
    expect(faqItems).toHaveLength(englishConverterPageCopy.faq.items.length);
    expect(faqItems[0].name).toBe(
      englishConverterPageCopy.faq.items[0].question,
    );
    expect(faqItems[0].acceptedAnswer.text).toBe(
      englishConverterPageCopy.faq.items[0].answer,
    );
  });

  test("builds ZIP to MRPack JSON-LD from page copy FAQ", async () => {
    const { buildZipToMrpackStructuredData } = await import(
      "@/lib/seo/structured-data"
    );
    const structuredData = buildZipToMrpackStructuredData({
      copy: englishZipToMrpackPageCopy,
      routePath: "/zip-to-mrpack",
    });
    const graph = structuredData["@graph"];
    const applicationData = graph.find(
      (graphEntry: Record<string, unknown>) =>
        graphEntry["@type"] === "WebApplication",
    );
    const faqData = graph.find(
      (graphEntry: Record<string, unknown>) => graphEntry["@type"] === "FAQPage",
    );
    const faqItems = readFaqMainEntity(faqData);

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(applicationData).toMatchObject({
      name: "ZIP to MRPack Converter",
      url: "https://mrpacktozip.pro/zip-to-mrpack",
    });
    expect(faqItems).toHaveLength(englishZipToMrpackPageCopy.faq.items.length);
    expect(faqItems.at(-1)?.name).toBe(
      englishZipToMrpackPageCopy.faq.items.at(-1)?.question,
    );
  });

  test("builds JSON-LD URLs from the supplied site URL", async () => {
    const { buildConverterStructuredData } = await import(
      "@/lib/seo/structured-data"
    );
    const structuredData = buildConverterStructuredData({
      copy: englishConverterPageCopy,
      routePath: "/",
      siteUrl: new URL("https://preview.example.com"),
    });
    const applicationData = structuredData["@graph"].find(
      (graphEntry: Record<string, unknown>) =>
        graphEntry["@type"] === "WebApplication",
    );

    expect(applicationData).toMatchObject({
      url: "https://preview.example.com/",
    });
  });

  test("renders parseable converter JSON-LD in the page markup", () => {
    const pageMarkup = renderToStaticMarkup(
      createElement(LocalizedConverterPage, {
        copy: englishConverterPageCopy,
      }),
    );
    const structuredData = readSingleJsonLdScript(pageMarkup);
    const applicationData = structuredData["@graph"].find(
      (graphEntry: Record<string, unknown>) =>
        graphEntry["@type"] === "WebApplication",
    );
    const faqData = structuredData["@graph"].find(
      (graphEntry: Record<string, unknown>) => graphEntry["@type"] === "FAQPage",
    );

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(applicationData).toMatchObject({
      url: "https://mrpacktozip.pro/",
    });
    expect(readFaqMainEntity(faqData)).toHaveLength(
      englishConverterPageCopy.faq.items.length,
    );
  });

  test("renders parseable ZIP to MRPack JSON-LD in the page markup", () => {
    const pageMarkup = renderToStaticMarkup(
      createElement(LocalizedZipToMrpackPage, {
        copy: englishZipToMrpackPageCopy,
      }),
    );
    const structuredData = readSingleJsonLdScript(pageMarkup);
    const applicationData = structuredData["@graph"].find(
      (graphEntry: Record<string, unknown>) =>
        graphEntry["@type"] === "WebApplication",
    );
    const faqData = structuredData["@graph"].find(
      (graphEntry: Record<string, unknown>) => graphEntry["@type"] === "FAQPage",
    );

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(applicationData).toMatchObject({
      url: "https://mrpacktozip.pro/zip-to-mrpack",
    });
    expect(readFaqMainEntity(faqData)).toHaveLength(
      englishZipToMrpackPageCopy.faq.items.length,
    );
  });
});

type StructuredFaqQuestion = {
  name: string;
  acceptedAnswer: {
    text: string;
  };
};

function readFaqMainEntity(
  faqData: Record<string, unknown> | undefined,
): StructuredFaqQuestion[] {
  if (!faqData || !Array.isArray(faqData.mainEntity)) {
    throw new Error("Structured data FAQPage mainEntity is missing.");
  }

  return faqData.mainEntity as StructuredFaqQuestion[];
}

function readSingleJsonLdScript(pageMarkup: string): PageStructuredDataForTest {
  const jsonLdScriptMatches = [
    ...pageMarkup.matchAll(
      /<script type="application\/ld\+json">(.*?)<\/script>/g,
    ),
  ];

  expect(jsonLdScriptMatches).toHaveLength(1);
  return JSON.parse(jsonLdScriptMatches[0][1]) as PageStructuredDataForTest;
}

type PageStructuredDataForTest = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};
