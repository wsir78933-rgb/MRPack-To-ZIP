import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { chineseAboutPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/zh/about");

export default function ChineseAboutPage() {
  return <LocalizedTrustPage copy={chineseAboutPageCopy} />;
}
