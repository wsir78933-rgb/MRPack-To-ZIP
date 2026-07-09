export type TrustPageLinkCopy = {
  href: string;
  label: string;
};

export type TrustPageSectionCopy = {
  id: string;
  title: string;
  paragraphs: string[];
  links?: TrustPageLinkCopy[];
};

export type TrustPageSummaryItemCopy = {
  label: string;
  value: string;
};

export type TrustPageCopy = {
  localeCode: "en" | "zh-Hans";
  logoText: string;
  logoAccent: string;
  logoHref: string;
  languageHref: string;
  languageLabel: string;
  navLinks: Array<{
    href: string;
    label: string;
    isActive: boolean;
  }>;
  hero: {
    badge: string;
    chips: string[];
    chipListAriaLabel: string;
    title: string;
    description: string;
    note: string;
    summaryTitle: string;
    summaryItems: TrustPageSummaryItemCopy[];
  };
  sections: TrustPageSectionCopy[];
  footer: {
    tagline: string;
    links: TrustPageLinkCopy[];
    copyright: string;
    disclaimer: string;
  };
};

const contactEmailAddress = "contact@mrpacktozip.pro";

const englishNavigationLinks = [
  { href: "/", label: "Converter", isActive: false },
  { href: "/zip-to-mrpack", label: "ZIP to MRPack", isActive: false },
  { href: "/contact", label: "Contact", isActive: false },
];

const chineseNavigationLinks = [
  { href: "/zh", label: "转换器", isActive: false },
  { href: "/zh/zip-to-mrpack", label: "ZIP 转 MRPack", isActive: false },
  { href: "/zh/contact", label: "联系", isActive: false },
];

const englishFooterLinks = [
  { label: "Converter", href: "/" },
  { label: "ZIP to MRPack", href: "/zip-to-mrpack" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

const chineseFooterLinks = [
  { label: "转换器", href: "/zh" },
  { label: "ZIP 转 MRPack", href: "/zh/zip-to-mrpack" },
  { label: "关于", href: "/zh/about" },
  { label: "隐私", href: "/zh/privacy" },
  { label: "条款", href: "/zh/terms" },
  { label: "联系", href: "/zh/contact" },
];

const englishTrustPageBaseCopy = {
  localeCode: "en",
  logoText: "MRPACK",
  logoAccent: "ZIP",
  logoHref: "/",
  languageLabel: "中文",
  navLinks: englishNavigationLinks,
  footer: {
    tagline:
      "Browser-based Minecraft modpack conversion with clear limits and contact information.",
    links: englishFooterLinks,
    copyright: "2026 MRPACKZIP. All rights reserved.",
    disclaimer: "Not affiliated with Modrinth, CurseForge, Mojang, or Microsoft.",
  },
} satisfies Pick<
  TrustPageCopy,
  | "localeCode"
  | "logoText"
  | "logoAccent"
  | "logoHref"
  | "languageLabel"
  | "navLinks"
  | "footer"
>;

const chineseTrustPageBaseCopy = {
  localeCode: "zh-Hans",
  logoText: "MRPACK",
  logoAccent: "ZIP",
  logoHref: "/zh",
  languageLabel: "EN",
  navLinks: chineseNavigationLinks,
  footer: {
    tagline: "边界清晰的浏览器内 Minecraft 整合包转换工具，提供明确限制和联系方式。",
    links: chineseFooterLinks,
    copyright: "2026 MRPACKZIP。保留所有权利。",
    disclaimer: "与 Modrinth、CurseForge、Mojang 或 Microsoft 无关联。",
  },
} satisfies Pick<
  TrustPageCopy,
  | "localeCode"
  | "logoText"
  | "logoAccent"
  | "logoHref"
  | "languageLabel"
  | "navLinks"
  | "footer"
>;

const englishTrustHeroChromeCopy = {
  chips: ["Trust page", "Privacy boundary", "Contact"],
  chipListAriaLabel: "Trust page sections",
} satisfies Pick<TrustPageCopy["hero"], "chips" | "chipListAriaLabel">;

const chineseTrustHeroChromeCopy = {
  chips: ["信任页面", "隐私边界", "联系方式"],
  chipListAriaLabel: "信任页面栏目",
} satisfies Pick<TrustPageCopy["hero"], "chips" | "chipListAriaLabel">;

export const englishAboutPageCopy: TrustPageCopy = {
  ...englishTrustPageBaseCopy,
  languageHref: "/zh/about",
  hero: {
    ...englishTrustHeroChromeCopy,
    badge: "ABOUT",
    title: "About MRPack to ZIP",
    description:
      "MRPack to ZIP is a small browser-based Minecraft modpack conversion project for people who need to inspect, move, or rebuild packs across launcher formats.",
    note:
      "The tools are intentionally narrow: convert Modrinth .mrpack sources to ZIP, and convert CurseForge export ZIP files to Modrinth-compatible .mrpack files where the metadata allows it.",
    summaryTitle: "Project scope",
    summaryItems: [
      { label: "Primary use", value: "browser-based Minecraft modpack conversion" },
      { label: "Main formats", value: ".mrpack, CurseForge ZIP, standard ZIP" },
      { label: "Contact", value: contactEmailAddress },
    ],
  },
  sections: [
    {
      id: "purpose",
      title: "What this project does",
      paragraphs: [
        "MRPack to ZIP focuses on practical conversion between common Minecraft modpack packaging formats. The homepage converts Modrinth .mrpack files, project IDs, and download URLs into ZIP output. The ZIP to MRPack page reads CurseForge ZIP exports and builds a Modrinth-compatible .mrpack when the needed metadata and downloads can be resolved.",
        "The project is not a general modpack editor, a mod hosting service, or a launcher account tool. It exists to make format conversion more transparent when a pack needs to move between launchers, server panels, or manual inspection workflows.",
        `MRPack to ZIP is maintained by the MRPACKZIP project team and can be reached at ${contactEmailAddress}. It is not an official Modrinth, CurseForge, Mojang, or Microsoft service.`,
      ],
    },
    {
      id: "how-it-runs",
      title: "How it runs",
      paragraphs: [
        "Local .mrpack and CurseForge ZIP uploads are opened in the browser session. Project ID, URL, CurseForge metadata, Modrinth matching, and referenced download flows may use public network requests or protected API proxy routes when a source service requires server-side access.",
        "When conversion cannot be completed safely, the tool reports the failure instead of silently hiding missing files or guessing unsupported metadata.",
      ],
    },
  ],
};

export const chineseAboutPageCopy: TrustPageCopy = {
  ...chineseTrustPageBaseCopy,
  languageHref: "/about",
  hero: {
    ...chineseTrustHeroChromeCopy,
    badge: "关于",
    title: "关于 MRPack to ZIP",
    description:
      "MRPack to ZIP 是一个小型浏览器内 Minecraft 整合包转换项目，适合需要检查、迁移或重建启动器格式的人使用。",
    note:
      "工具范围保持清晰：把 Modrinth .mrpack 来源转换为 ZIP，并在元数据允许时把 CurseForge 导出 ZIP 转换为兼容 Modrinth 的 .mrpack。",
    summaryTitle: "项目范围",
    summaryItems: [
      { label: "主要用途", value: "浏览器内 Minecraft 整合包转换" },
      { label: "主要格式", value: ".mrpack、CurseForge ZIP、标准 ZIP" },
      { label: "联系邮箱", value: contactEmailAddress },
    ],
  },
  sections: [
    {
      id: "purpose",
      title: "这个项目做什么",
      paragraphs: [
        "MRPack to ZIP 专注常见 Minecraft 整合包格式之间的实用转换。首页会把 Modrinth .mrpack 文件、project ID 和下载 URL 转换为 ZIP 输出。ZIP 转 MRPack 页面会读取 CurseForge ZIP 导出包，并在能够解析必要元数据和下载来源时生成兼容 Modrinth 的 .mrpack。",
        "这个项目不是通用整合包编辑器、模组托管服务，也不是启动器账号工具。它的目标是在整合包需要跨启动器、服务器面板或手动检查流程迁移时，让格式转换更透明。",
        `MRPack to ZIP 由 MRPACKZIP project team 维护，可通过 ${contactEmailAddress} 联系。本项目不是 Modrinth、CurseForge、Mojang 或 Microsoft 官方服务。`,
      ],
    },
    {
      id: "how-it-runs",
      title: "它如何运行",
      paragraphs: [
        "本地 .mrpack 和 CurseForge ZIP 上传会在浏览器会话中打开。project ID、URL、CurseForge 元数据、Modrinth 匹配和引用下载流程，可能会使用公开网络请求，或在源服务需要服务端访问时使用受保护的 API 代理路由。",
        "当转换无法安全完成时，工具会报告失败原因，而不是静默隐藏缺失文件或猜测不支持的元数据。",
      ],
    },
  ],
};

export const englishPrivacyPageCopy: TrustPageCopy = {
  ...englishTrustPageBaseCopy,
  languageHref: "/zh/privacy",
  hero: {
    ...englishTrustHeroChromeCopy,
    badge: "PRIVACY",
    title: "Privacy Policy",
    description:
      "This policy explains what MRPack to ZIP processes when you use the browser-based converters.",
    note:
      "The site currently does not use advertising scripts or analytics. If that changes, this policy should be updated before those services are enabled.",
    summaryTitle: "Privacy summary",
    summaryItems: [
      { label: "Local files", value: "read in the browser session" },
      { label: "Proxy requests", value: "used for CurseForge metadata and downloads" },
      { label: "Questions", value: contactEmailAddress },
    ],
  },
  sections: [
    {
      id: "local-files",
      title: "Local files",
      paragraphs: [
        "When you upload a local .mrpack or CurseForge ZIP file, the archive is read in your browser session. The local upload is not uploaded as a complete conversion package.",
        "The converter may read manifest files, override folders, hashes, paths, project IDs, file IDs, and download URLs inside the archive so it can build the requested output.",
      ],
    },
    {
      id: "network-requests",
      title: "Network requests and proxy routes",
      paragraphs: [
        "Project ID and download URL modes may request public Modrinth resources and referenced file URLs. ZIP to MRPack conversion may send CurseForge project IDs, file IDs, and related lookup metadata to protected API proxy routes so the site can resolve file metadata without exposing private API credentials in the browser.",
        "CurseForge-only files may be downloaded through the proxy when the converter has to bundle a file that cannot be represented as a Modrinth reference. Server infrastructure can record standard request logs such as IP address, user agent, requested URL, timestamp, status code, and error details for security and debugging.",
      ],
    },
    {
      id: "contact",
      title: "Privacy contact",
      paragraphs: [
        `For privacy questions or deletion requests about server logs, contact ${contactEmailAddress}. Include the page URL, approximate request time, and request type so the relevant request can be identified without asking for your account credentials or private files.`,
      ],
      links: [{ label: contactEmailAddress, href: `mailto:${contactEmailAddress}` }],
    },
  ],
};

export const chinesePrivacyPageCopy: TrustPageCopy = {
  ...chineseTrustPageBaseCopy,
  languageHref: "/privacy",
  hero: {
    ...chineseTrustHeroChromeCopy,
    badge: "隐私",
    title: "隐私政策",
    description: "本政策说明你使用浏览器内转换器时，MRPack to ZIP 会处理哪些信息。",
    note:
      "网站目前没有使用广告脚本或统计分析。如果以后启用这些服务，应先更新本政策。",
    summaryTitle: "隐私摘要",
    summaryItems: [
      { label: "本地文件", value: "在浏览器会话中读取" },
      { label: "代理请求", value: "用于 CurseForge 元数据和下载" },
      { label: "问题联系", value: contactEmailAddress },
    ],
  },
  sections: [
    {
      id: "local-files",
      title: "本地文件",
      paragraphs: [
        "当你上传本地 .mrpack 或 CurseForge ZIP 文件时，压缩包会在浏览器会话中读取。本地上传文件不会作为完整转换包整体上传。",
        "转换器可能读取压缩包内的 manifest 文件、overrides 文件夹、哈希、路径、project ID、file ID 和下载 URL，以便生成你请求的输出。",
      ],
    },
    {
      id: "network-requests",
      title: "网络请求和代理路由",
      paragraphs: [
        "Project ID 和下载 URL 模式可能请求公开的 Modrinth 资源和引用文件 URL。ZIP 转 MRPack 转换可能会把 CurseForge project ID、file ID 和相关查询元数据发送到受保护的 API 代理路由，这样网站可以解析文件元数据，而不把私密 API 凭证暴露在浏览器中。",
        "当转换器需要打包无法表示为 Modrinth 引用的 CurseForge-only 文件时，这些文件可能通过代理下载。服务器基础设施可能记录标准请求日志，例如 IP 地址、user agent、请求 URL、时间戳、状态码和错误详情，用于安全和调试。",
      ],
    },
    {
      id: "contact",
      title: "隐私联系",
      paragraphs: [
        `如有隐私问题，或希望处理服务器日志相关请求，请联系 ${contactEmailAddress}。请附上页面 URL、大致请求时间和请求类型，这样可以在不要求你提供账号凭证或私人文件的情况下定位相关请求。`,
      ],
      links: [{ label: contactEmailAddress, href: `mailto:${contactEmailAddress}` }],
    },
  ],
};

export const englishTermsPageCopy: TrustPageCopy = {
  ...englishTrustPageBaseCopy,
  languageHref: "/zh/terms",
  hero: {
    ...englishTrustHeroChromeCopy,
    badge: "TERMS",
    title: "Terms of Use",
    description:
      "These terms describe acceptable use, responsibility for modpack content, and limits of the MRPack to ZIP conversion tools.",
    note:
      "Use the tools only for content you have the right to download, convert, inspect, or redistribute.",
    summaryTitle: "Terms summary",
    summaryItems: [
      { label: "User responsibility", value: "respect mod licenses and host rules" },
      { label: "Service scope", value: "conversion only, no guarantee of pack safety" },
      { label: "Support", value: contactEmailAddress },
    ],
  },
  sections: [
    {
      id: "acceptable-use",
      title: "Acceptable use",
      paragraphs: [
        "You are responsible for the files, IDs, URLs, and modpack exports you provide to the converters. Do not use MRPack to ZIP to bypass access controls, redistribute content without permission, test abusive traffic, or request files you are not allowed to access.",
        "The protected proxy routes exist only to support the converter workflows shown on this site. They are not a public proxy, scraping endpoint, or credential relay.",
      ],
    },
    {
      id: "content-rights",
      title: "Content rights and third-party services",
      paragraphs: [
        "Minecraft mods, resource packs, shader packs, launcher metadata, and modpack exports remain controlled by their respective authors, license terms, and hosting services. You are responsible for checking whether your converted output may be shared or used in a server environment.",
        "MRPack to ZIP is not affiliated with Modrinth, CurseForge, Mojang, or Microsoft. Their names are used only to describe compatible formats, APIs, or services.",
      ],
    },
    {
      id: "no-guarantees",
      title: "No safety or compatibility guarantees",
      paragraphs: [
        "The tools report known validation failures and download problems, but they do not guarantee that a converted modpack is secure, malware-free, license-compliant, or compatible with every launcher or server panel.",
        "Before running a converted pack, inspect the files, confirm the loader and Minecraft versions, and follow the rules of the target launcher or hosting provider.",
      ],
    },
  ],
};

export const chineseTermsPageCopy: TrustPageCopy = {
  ...chineseTrustPageBaseCopy,
  languageHref: "/terms",
  hero: {
    ...chineseTrustHeroChromeCopy,
    badge: "条款",
    title: "使用条款",
    description:
      "这些条款说明 MRPack to ZIP 转换工具的可接受使用、整合包内容责任和服务限制。",
    note: "请只为你有权下载、转换、检查或重新分发的内容使用这些工具。",
    summaryTitle: "条款摘要",
    summaryItems: [
      { label: "用户责任", value: "遵守模组许可和源站规则" },
      { label: "服务范围", value: "仅做格式转换，不保证整合包安全" },
      { label: "支持联系", value: contactEmailAddress },
    ],
  },
  sections: [
    {
      id: "acceptable-use",
      title: "可接受使用",
      paragraphs: [
        "你需要对自己提供给转换器的文件、ID、URL 和整合包导出内容负责。不要使用 MRPack to ZIP 绕过访问控制、未经许可重新分发内容、测试滥用流量，或请求你无权访问的文件。",
        "受保护的代理路由只用于支持本站展示的转换流程。它们不是公共代理、抓取端点或凭证中转服务。",
      ],
    },
    {
      id: "content-rights",
      title: "内容权利和第三方服务",
      paragraphs: [
        "Minecraft 模组、资源包、光影包、启动器元数据和整合包导出内容，仍由各自作者、许可条款和托管服务控制。你需要确认转换后的输出是否可以分享，或是否可以用于服务器环境。",
        "MRPack to ZIP 与 Modrinth、CurseForge、Mojang 或 Microsoft 无关联。这些名称只用于描述兼容格式、API 或服务。",
      ],
    },
    {
      id: "no-guarantees",
      title: "不保证安全或兼容性",
      paragraphs: [
        "工具会报告已知校验失败和下载问题，但不保证转换后的整合包安全、无恶意文件、符合许可，或兼容每个启动器和服务器面板。",
        "运行转换后的整合包前，请检查文件、确认加载器和 Minecraft 版本，并遵守目标启动器或托管服务的规则。",
      ],
    },
  ],
};

export const englishContactPageCopy: TrustPageCopy = {
  ...englishTrustPageBaseCopy,
  languageHref: "/zh/contact",
  hero: {
    ...englishTrustHeroChromeCopy,
    badge: "CONTACT",
    title: "Contact",
    description:
      "Use the contact address for bug reports, privacy questions, policy requests, or corrections to the converter documentation.",
    note:
      "Please include enough context to reproduce the issue, especially the page, input type, browser, and any visible error message.",
    summaryTitle: "Contact details",
    summaryItems: [
      { label: "Email", value: contactEmailAddress },
      { label: "Best for", value: "bugs, privacy, policy, corrections" },
      { label: "Do not send", value: "private account credentials or paid API keys" },
    ],
  },
  sections: [
    {
      id: "email",
      title: "Email",
      paragraphs: [
        `Reach the project at ${contactEmailAddress}. For conversion bugs, include whether you used MRPack to ZIP or ZIP to MRPack, the browser name, the visible error message, and whether the input came from upload, project ID, or URL mode.`,
        "Do not send Minecraft account credentials, private API keys, payment details, or files you do not have permission to share.",
        "Do not send complete modpack archives unless they are requested for a specific support case. For privacy or log-related requests, include the page URL, approximate request time, and the type of request instead.",
      ],
      links: [{ label: contactEmailAddress, href: `mailto:${contactEmailAddress}` }],
    },
    {
      id: "response-scope",
      title: "Response scope",
      paragraphs: [
        "The contact address is for the MRPack to ZIP website and its conversion behavior. It cannot provide official support for Modrinth, CurseForge, Mojang, Microsoft, or third-party launcher accounts.",
        "Requests that can be handled here include converter bug reports, privacy questions, policy corrections, broken page reports, and documentation fixes related to this site.",
      ],
    },
  ],
};

export const chineseContactPageCopy: TrustPageCopy = {
  ...chineseTrustPageBaseCopy,
  languageHref: "/contact",
  hero: {
    ...chineseTrustHeroChromeCopy,
    badge: "联系",
    title: "联系我们",
    description: "你可以通过联系邮箱反馈错误、提出隐私问题、发送政策请求或修正文档内容。",
    note: "请提供足够复现问题的上下文，尤其是页面、输入类型、浏览器和可见错误信息。",
    summaryTitle: "联系方式",
    summaryItems: [
      { label: "邮箱", value: contactEmailAddress },
      { label: "适合反馈", value: "错误、隐私、政策、内容修正" },
      { label: "不要发送", value: "私人账号凭证或付费 API 密钥" },
    ],
  },
  sections: [
    {
      id: "email",
      title: "邮箱",
      paragraphs: [
        `请通过 ${contactEmailAddress} 联系项目。反馈转换错误时，请说明你使用的是 MRPack 转 ZIP 还是 ZIP 转 MRPack、浏览器名称、可见错误信息，以及输入来自上传、project ID 还是 URL 模式。`,
        "不要发送 Minecraft 账号凭证、私密 API 密钥、付款信息，或你无权分享的文件。",
        "除非被明确要求，不要发送完整整合包压缩包。隐私或日志相关请求请提供页面 URL、大致请求时间和请求类型。",
      ],
      links: [{ label: contactEmailAddress, href: `mailto:${contactEmailAddress}` }],
    },
    {
      id: "response-scope",
      title: "回复范围",
      paragraphs: [
        "联系邮箱只用于 MRPack to ZIP 网站及其转换行为，不能提供 Modrinth、CurseForge、Mojang、Microsoft 或第三方启动器账号的官方支持。",
        "这里可以处理转换器错误、隐私问题、政策修正、页面异常和本站文档修正。",
      ],
    },
  ],
};
