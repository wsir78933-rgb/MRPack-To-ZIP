import { LocalizedConverterPage } from '@/components/localized-converter-page';
import { chineseConverterPageCopy } from '@/lib/i18n/converter-page-copy';
import { buildPageMetadata } from '@/lib/seo/site-metadata';

export const metadata = buildPageMetadata('/zh');

export default function ChinesePage() {
  return <LocalizedConverterPage copy={chineseConverterPageCopy} />;
}
