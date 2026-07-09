import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { englishTermsPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/terms");

export default function TermsPage() {
  return <LocalizedTrustPage copy={englishTermsPageCopy} />;
}
