import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { chinesePrivacyPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/zh/privacy");

export default function ChinesePrivacyPage() {
  return <LocalizedTrustPage copy={chinesePrivacyPageCopy} />;
}
