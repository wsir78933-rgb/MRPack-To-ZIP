import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LocalizedZipToMrpackPage } from "@/components/localized-zip-to-mrpack-page";
import {
  chineseZipToMrpackPageCopy,
  englishZipToMrpackPageCopy,
} from "@/lib/i18n/zip-to-mrpack-page-copy";

const minimumKeywordDensityPercent = 2;
const maximumKeywordDensityPercent = 3;

describe("ZIP to MRPack keyword density", () => {
  test("keeps the English ZIP to MRPack body text at 800 words or more", () => {
    const pageHtml = renderToStaticMarkup(
      createElement(LocalizedZipToMrpackPage, {
        copy: englishZipToMrpackPageCopy,
      }),
    );
    const bodyText = extractHtmlBodyText(pageHtml);

    expect(countEnglishWords(bodyText)).toBeGreaterThanOrEqual(800);
  });

  test.each([
    {
      copy: englishZipToMrpackPageCopy,
      keyword: "ZIP to MRPack",
    },
    {
      copy: chineseZipToMrpackPageCopy,
      keyword: "ZIP 转 MRPack",
    },
  ])(
    "keeps $keyword between 2% and 3% of HTML body text",
    ({ copy, keyword }) => {
      const pageHtml = renderToStaticMarkup(
        createElement(LocalizedZipToMrpackPage, { copy }),
      );
      const bodyText = extractHtmlBodyText(pageHtml);
      const keywordDensityPercent = calculateKeywordDensityPercent(
        keyword,
        bodyText,
      );

      expect(keywordDensityPercent).toBeGreaterThanOrEqual(
        minimumKeywordDensityPercent,
      );
      expect(keywordDensityPercent).toBeLessThanOrEqual(
        maximumKeywordDensityPercent,
      );
    },
  );
});

function calculateKeywordDensityPercent(keyword: string, bodyText: string) {
  const normalizedKeyword = normalizeVisibleText(keyword);
  const normalizedBodyText = normalizeVisibleText(bodyText);
  const keywordOccurrenceCount = countExactKeywordOccurrences(
    normalizedKeyword,
    normalizedBodyText,
  );
  const keywordCharacterCount =
    normalizedKeyword.length * keywordOccurrenceCount;

  if (normalizedBodyText.length === 0) {
    throw new Error("Cannot calculate keyword density from empty body text.");
  }

  return (keywordCharacterCount / normalizedBodyText.length) * 100;
}

function countExactKeywordOccurrences(keyword: string, bodyText: string) {
  if (keyword.length === 0) {
    throw new Error("Cannot count empty keyword occurrences.");
  }

  return bodyText.split(keyword).length - 1;
}

function extractHtmlBodyText(pageHtml: string) {
  const htmlWithoutNonBodyText = pageHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  const textWithoutTags = htmlWithoutNonBodyText.replace(/<[^>]*>/g, " ");

  return decodeHtmlEntities(textWithoutTags);
}

function decodeHtmlEntities(encodedText: string) {
  return encodedText
    .replace(/&#x([0-9a-f]+);/gi, (_entity, hexadecimalCode: string) =>
      String.fromCodePoint(Number.parseInt(hexadecimalCode, 16)),
    )
    .replace(/&#(\d+);/g, (_entity, decimalCode: string) =>
      String.fromCodePoint(Number.parseInt(decimalCode, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeVisibleText(visibleText: string) {
  return visibleText.replace(/\s+/g, " ").trim();
}

function countEnglishWords(visibleText: string) {
  return normalizeVisibleText(visibleText)
    .split(/\s+/)
    .filter((textToken) => /[A-Za-z0-9]/.test(textToken)).length;
}
