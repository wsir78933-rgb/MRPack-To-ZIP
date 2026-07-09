import { LocalizedTrustPage } from "@/components/localized-trust-page";
import { englishContactPageCopy } from "@/lib/i18n/trust-page-copy";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata = buildPageMetadata("/contact");

export default function ContactPage() {
  return <LocalizedTrustPage copy={englishContactPageCopy} />;
}
