export type NotFoundPageCopy = {
  htmlLang: "en" | "zh-Hans";
  title: string;
  message: string;
  homeHref: string;
  homeLabel: string;
};

export const englishNotFoundPageCopy: NotFoundPageCopy = {
  htmlLang: "en",
  title: "Page Not Found",
  message:
    "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
  homeHref: "/",
  homeLabel: "Back to Home",
};

export const chineseNotFoundPageCopy: NotFoundPageCopy = {
  htmlLang: "zh-Hans",
  title: "页面未找到",
  message: "你访问的页面可能已被移除、重命名，或暂时不可用。",
  homeHref: "/zh",
  homeLabel: "返回首页",
};
