import { LocalizedZipToMrpackPage } from "@/components/localized-zip-to-mrpack-page";
import { englishZipToMrpackPageCopy } from "@/lib/i18n/zip-to-mrpack-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/zip-to-mrpack");

export default function ZipToMrpackPage() {
  return <LocalizedZipToMrpackPage copy={englishZipToMrpackPageCopy} />;
}
