import { buildNotFoundResponse } from '@/lib/seo/not-found-response';

export function GET() {
  return buildNotFoundResponse({
    htmlLang: "en",
    title: "Page Not Found",
    message:
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
    homeHref: "/",
    homeLabel: "Back to Home",
  });
}
