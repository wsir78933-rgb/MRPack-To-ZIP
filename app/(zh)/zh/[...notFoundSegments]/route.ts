import { buildNotFoundResponse } from '@/lib/seo/not-found-response';

export function GET() {
  return buildNotFoundResponse({
    htmlLang: "zh-Hans",
    title: "页面未找到",
    message: "你访问的页面可能已被移除、重命名，或暂时不可用。",
    homeHref: "/zh",
    homeLabel: "返回首页",
  });
}
