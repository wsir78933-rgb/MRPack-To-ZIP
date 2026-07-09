import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { englishPrivacyPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/privacy");

export default function PrivacyPage() {
  return <LocalizedTrustPage copy={englishPrivacyPageCopy} />;
}
