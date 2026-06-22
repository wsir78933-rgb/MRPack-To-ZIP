import { LocalizedConverterPage } from '@/components/localized-converter-page';
import { englishConverterPageCopy } from '@/lib/i18n/converter-page-copy';
import { buildPageMetadata } from '@/lib/seo/site-metadata';

export const metadata = buildPageMetadata('/');

export default function HomePage() {
  return <LocalizedConverterPage copy={englishConverterPageCopy} />;
}
