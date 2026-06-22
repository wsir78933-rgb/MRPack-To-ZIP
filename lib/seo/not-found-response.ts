export type NotFoundResponseOptions = {
  htmlLang: string;
  title: string;
  message: string;
  homeHref: string;
  homeLabel: string;
};

function assertRootRelativeHomeHref(homeHref: string): void {
  if (!homeHref.startsWith("/") || homeHref.startsWith("//")) {
    throw new Error(`Invalid not-found homeHref value: ${homeHref}`);
  }
}

function escapeHtmlText(rawText: string): string {
  return rawText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlAttribute(rawAttribute: string): string {
  return escapeHtmlText(rawAttribute).replaceAll('"', "&quot;");
}

export function buildNotFoundHtml(
  notFoundResponseOptions: NotFoundResponseOptions,
): string {
  assertRootRelativeHomeHref(notFoundResponseOptions.homeHref);

  const htmlLang = escapeHtmlAttribute(notFoundResponseOptions.htmlLang);
  const title = escapeHtmlText(notFoundResponseOptions.title);
  const message = escapeHtmlText(notFoundResponseOptions.message);
  const homeHref = escapeHtmlAttribute(notFoundResponseOptions.homeHref);
  const homeLabel = escapeHtmlText(notFoundResponseOptions.homeLabel);

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${title}</title>
    <style>
      body {
        min-height: 100dvh;
        margin: 0;
        display: grid;
        place-items: center;
        background: #f9fafb;
        color: #111827;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        max-width: 28rem;
        padding: 1rem;
        text-align: center;
      }
      h1 {
        margin: 0 0 1rem;
        font-size: 2.25rem;
        line-height: 1.1;
      }
      p {
        margin: 0 0 2rem;
        color: #6b7280;
        line-height: 1.6;
      }
      a {
        display: inline-flex;
        align-items: center;
        min-height: 2.5rem;
        padding: 0 1.25rem;
        border: 1px solid #d1d5db;
        border-radius: 9999px;
        background: #ffffff;
        color: #374151;
        text-decoration: none;
        font-weight: 500;
      }
      a:focus-visible {
        outline: 2px solid #f97316;
        outline-offset: 2px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="${homeHref}">${homeLabel}</a>
    </main>
  </body>
</html>`;
}

export function buildNotFoundResponse(
  notFoundResponseOptions: NotFoundResponseOptions,
): Response {
  return new Response(buildNotFoundHtml(notFoundResponseOptions), {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
