import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { englishAboutPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/about");

export default function AboutPage() {
  return <LocalizedTrustPage copy={englishAboutPageCopy} />;
}
