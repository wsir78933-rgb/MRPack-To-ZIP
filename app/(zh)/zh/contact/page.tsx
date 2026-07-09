import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { chineseContactPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/zh/contact");

export default function ChineseContactPage() {
  return <LocalizedTrustPage copy={chineseContactPageCopy} />;
}
