import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { chineseTermsPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/zh/terms");

export default function ChineseTermsPage() {
  return <LocalizedTrustPage copy={chineseTermsPageCopy} />;
}
