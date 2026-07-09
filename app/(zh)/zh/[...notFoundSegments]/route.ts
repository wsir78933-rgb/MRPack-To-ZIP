import { chineseNotFoundPageCopy } from '@/lib/i18n/not-found-page-copy';
import { buildNotFoundResponse } from '@/lib/seo/not-found-response';

export function GET() {
  return buildNotFoundResponse(chineseNotFoundPageCopy);
}
