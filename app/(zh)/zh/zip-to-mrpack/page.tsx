import { LocalizedZipToMrpackPage } from "@/components/localized-zip-to-mrpack-page";
import { chineseZipToMrpackPageCopy } from "@/lib/i18n/zip-to-mrpack-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/zh/zip-to-mrpack");

export default function ChineseZipToMrpackPage() {
  return <LocalizedZipToMrpackPage copy={chineseZipToMrpackPageCopy} />;
}
