export type ZipToMrpackPageCopy = {
  localeCode: string;
  logoText: string;
  logoAccent: string;
  languageSwitchLabel: string;
  navLinks: Array<{
    href: string;
    label: string;
    isActive: boolean;
  }>;
  hero: {
    badge: string;
    title: string;
    description: string;
    note: string;
    chips: string[];
  };
  uploadPanel: {
    acceptedFileLabel: string;
    dropTitle: string;
    dropDescription: string;
    selectButtonLabel: string;
    downloadLabel: string;
    resetLabel: string;
    invalidFileMessage: string;
    selectedFilePrefix: string;
    readyMessage: string;
    progressCountLabel: string;
    errorTitle: string;
    successTitle: string;
    successDescription: string;
  };
  previewPanel: {
    title: string;
    idleStatusLabel: string;
    dropActiveLabel: string;
    outputSlotLabel: string;
    outputFileLabel: string;
  };
  statusLabels: {
    readingZip: string;
    readingManifest: string;
    resolvingCurseForgeFiles: string;
    matchingModrinthFiles: string;
    downloadingCurseForgeFiles: string;
    buildingMrpack: string;
  };
  summaryLabels: {
    matched: string;
    bundled: string;
  };
  whatItConverts: ZipToMrpackInfoSectionCopy;
  howToConvert: ZipToMrpackStepsSectionCopy;
  limits: ZipToMrpackLimitsCopy;
  faq: ZipToMrpackFaqCopy;
  footer: ZipToMrpackFooterCopy;
};

export type ZipToMrpackInfoSectionCopy = {
  title: string;
  paragraphs: string[];
};

export type ZipToMrpackStepCopy = {
  title: string;
  description: string;
};

export type ZipToMrpackStepsSectionCopy = {
  title: string;
  description: string;
  steps: ZipToMrpackStepCopy[];
};

export type ZipToMrpackLimitItemCopy = {
  title: string;
  description: string;
};

export type ZipToMrpackLimitsCopy = {
  title: string;
  description: string;
  items: ZipToMrpackLimitItemCopy[];
};

export type ZipToMrpackFaqItemCopy = {
  question: string;
  answer: string;
};

export type ZipToMrpackFaqCopy = {
  title: string;
  viewAllLabel: string;
  closeAllLabel: string;
  items: ZipToMrpackFaqItemCopy[];
};

export type ZipToMrpackFooterLinkCopy = {
  label: string;
  href: string;
};

export type ZipToMrpackFooterCopy = {
  tagline: string;
  links: ZipToMrpackFooterLinkCopy[];
  copyright: string;
  disclaimer: string;
};

const englishNavLinks = [
  { href: "/", label: "Converter", isActive: false },
  { href: "/zip-to-mrpack", label: "ZIP to MRPack", isActive: true },
  { href: "#faq", label: "FAQ", isActive: false },
];

const chineseNavLinks = [
  { href: "/zh", label: "转换器", isActive: false },
  { href: "/zh/zip-to-mrpack", label: "ZIP 转 MRPack", isActive: true },
  { href: "#faq", label: "FAQ", isActive: false },
];

const englishFooterLinks = [
  { label: "Converter", href: "/" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

const chineseFooterLinks = [
  { label: "转换器", href: "/zh" },
  { label: "如何转换", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "关于", href: "/zh/about" },
  { label: "隐私", href: "/zh/privacy" },
  { label: "条款", href: "/zh/terms" },
  { label: "联系", href: "/zh/contact" },
];

export const englishZipToMrpackPageCopy: ZipToMrpackPageCopy = {
  localeCode: "en",
  logoText: "MRPACK",
  logoAccent: "ZIP",
  languageSwitchLabel: "中文",
  navLinks: englishNavLinks,
  hero: {
    badge: "ZIP TO MRPACK",
    title: "Convert CurseForge ZIP to MRPack",
    description:
      "Convert CurseForge modpack exports into Modrinth-compatible .mrpack files.",
    note:
      "The ZIP is read in your browser. CurseForge file metadata is resolved through a protected API proxy.",
    chips: ["ZIP to MRPack", "CurseForge exports", "Browser conversion"],
  },
  uploadPanel: {
    acceptedFileLabel: ".zip",
    dropTitle: "Drop your CurseForge ZIP here",
    dropDescription:
      "Use a CurseForge export that contains manifest.json and optional overrides.",
    selectButtonLabel: "Select CurseForge ZIP file",
    downloadLabel: "Download MRPack",
    resetLabel: "Clear result",
    invalidFileMessage: "Invalid file. Choose a .zip file",
    selectedFilePrefix: "Selected file",
    readyMessage: "Conversion starts automatically.",
    progressCountLabel: "Bundled CurseForge files",
    errorTitle: "Conversion failed",
    successTitle: "MRPack is ready",
    successDescription:
      "Conversion complete. Click the button below to download your .mrpack file.",
  },
  previewPanel: {
    title: "Crafting Converter",
    idleStatusLabel: "Idle",
    dropActiveLabel: "Release to upload ZIP",
    outputSlotLabel: "Output Slot",
    outputFileLabel: "MRPack output",
  },
  statusLabels: {
    readingZip: "Reading ZIP archive...",
    readingManifest: "Reading CurseForge manifest...",
    resolvingCurseForgeFiles: "Resolving CurseForge files...",
    matchingModrinthFiles: "Matching Modrinth files...",
    downloadingCurseForgeFiles: "Bundling CurseForge-only files...",
    buildingMrpack: "Building MRPack...",
  },
  summaryLabels: {
    matched: "Matched on Modrinth",
    bundled: "Bundled from CurseForge",
  },
  whatItConverts: {
    title: "What the ZIP to MRPack converter reads",
    paragraphs: [
      "Use this page for CurseForge ZIP exports that include manifest.json plus the optional overrides directory. It is not a general ZIP converter and does not infer a Minecraft modpack from an arbitrary archive.",
      "The converter reads project IDs and file IDs from manifest.json, keeps override files as bundled content, and prepares a Modrinth-compatible .mrpack output. A ZIP to MRPack conversion depends on that manifest because CurseForge exports store file identity as project and file numbers instead of direct Modrinth version references. Without those IDs, there is no reliable way to confirm which public mod file should be matched.",
      "Before a ZIP to MRPack run starts, the browser checks the archive shape and keeps the source ZIP local. The page expects a normal CurseForge export, not a hand-made mods folder, a launcher instance backup, or a random compressed directory. That boundary keeps the conversion predictable and makes error messages easier to understand. It also helps you decide whether a failed upload is a format issue, a missing manifest, or a mod file that needs manual attention before you try the export again.",
      "When possible, CurseForge file metadata is compared with Modrinth version files by SHA-1 so matched files can become Modrinth references instead of bundled downloads. If a safe match is not available, the converter can bundle a resolvable CurseForge file, while still reporting when a download cannot be proven or fetched.",
    ],
  },
  howToConvert: {
    title: "How the conversion works",
    description:
      "The browser reads the archive, resolves CurseForge metadata, performs Modrinth matching, and then builds the MRPack. This ZIP to MRPack flow is intentionally narrow: it follows the CurseForge manifest, preserves overrides, and avoids guessing at missing files.",
    steps: [
      {
        title: "Read the CurseForge ZIP",
        description:
          "The ZIP is opened locally in the browser and manifest.json is validated before conversion continues. The converter checks that the archive has the expected CurseForge export structure, then records the Minecraft version, loader data, files list, and overrides that should move into the MRPack.",
      },
      {
        title: "Resolve and match files",
        description:
          "CurseForge project IDs and file IDs are requested through the protected API proxy, then compatible files are checked with Modrinth matching and SHA-1 metadata. A successful match can become a Modrinth dependency reference; an unmatched but downloadable file can be bundled when that is safer than inventing metadata.",
      },
      {
        title: "Build the MRPack",
        description:
          "Matched files become Modrinth references, while CurseForge-only files and overrides are bundled into the output. The result is a focused ZIP to MRPack package that favors explicit manifest data over automatic editing or broad modpack repair.",
      },
    ],
  },
  limits: {
    title: "Limits and failure cases",
    description:
      "These limits describe what the converter can prove safely in the browser and where conversion can stop. They also explain why a failed ZIP to MRPack attempt is usually a metadata, matching, or download boundary rather than a generic ZIP problem.",
    items: [
      {
        title: "CurseForge export shape",
        description:
          "The ZIP must contain a readable manifest.json. Missing or malformed manifests are failure cases because there is no reliable file list to convert. If the archive was created by zipping a `.minecraft` folder or a launcher profile manually, it may include mods and configs but still lack the IDs needed for Modrinth matching.",
      },
      {
        title: "Protected metadata lookup",
        description:
          "CurseForge file metadata goes through a protected API proxy. If that proxy or the CurseForge response fails, matching and bundling can be incomplete. The proxy is used for file metadata and download authorization; it is not a place where the complete ZIP is uploaded for server-side conversion.",
      },
      {
        title: "Privacy boundary",
        description:
          "The archive is read in the browser. The privacy boundary is that file metadata may be sent to the proxy for lookup, while the local ZIP itself is not uploaded as a complete conversion package. This keeps the ZIP to MRPack tool focused on metadata resolution and output assembly instead of storing user archives.",
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    viewAllLabel: "Open all",
    closeAllLabel: "Close all",
    items: [
      {
        question: "What kind of ZIP should I upload?",
        answer:
          "Upload a CurseForge ZIP export that contains manifest.json and optionally an overrides directory. This page is not a general ZIP converter for arbitrary folders, launcher backups, or server uploads that do not include CurseForge manifest IDs. Export the pack from CurseForge again if you are unsure how the archive was made.",
      },
      {
        question: "Which manifest fields are used?",
        answer:
          "The converter uses CurseForge project IDs, file IDs, file paths, override files, Minecraft version information, loader information, and related metadata. It can compare CurseForge metadata with Modrinth SHA-1 file records when a compatible version exists. Those fields are also useful when you need to explain why one dependency matched and another one stayed bundled.",
      },
      {
        question: "What happens during Modrinth matching?",
        answer:
          "The converter uses CurseForge metadata to look for compatible Modrinth files. Files that cannot be matched may be bundled when they can be downloaded safely, and files that cannot be resolved are treated as conversion blockers instead of being silently ignored.",
      },
      {
        question: "Why is there a protected API proxy?",
        answer:
          "CurseForge metadata needs protected server-side access. The proxy resolves file metadata without turning the browser into a place for private API credentials, and it keeps the ZIP to MRPack page from exposing keys in client-side JavaScript.",
      },
      {
        question: "What are the main failure cases?",
        answer:
          "Conversion can fail when manifest.json is missing or malformed, the protected API proxy is unavailable, a CurseForge file cannot be resolved, Modrinth matching finds no compatible version, or referenced downloads are blocked.",
      },
      {
        question: "What is the privacy boundary?",
        answer:
          "The ZIP archive is read locally in the browser. Metadata needed for CurseForge lookup can be sent through the protected API proxy, but the local ZIP is not uploaded as a complete conversion package.",
      },
      {
        question: "Are CurseForge-only files always converted to Modrinth references?",
        answer:
          "No. Files without a safe Modrinth match may be bundled from CurseForge when the download can be resolved. If a download is blocked or unavailable, conversion can fail instead of inventing a reference, because a valid .mrpack should describe where each dependency came from.",
      },
    ],
  },
  footer: {
    tagline:
      "A focused CurseForge ZIP to MRPack browser tool with explicit metadata and privacy boundaries.",
    links: englishFooterLinks,
    copyright: "2026 MRPACKZIP. All rights reserved.",
    disclaimer: "Not affiliated with Modrinth, CurseForge, Mojang, or Microsoft.",
  },
};

export const chineseZipToMrpackPageCopy: ZipToMrpackPageCopy = {
  localeCode: "zh-Hans",
  logoText: "MRPACK",
  logoAccent: "ZIP",
  languageSwitchLabel: "EN",
  navLinks: chineseNavLinks,
  hero: {
    badge: "ZIP 转 MRPACK",
    title: "将 CurseForge ZIP 转为 MRPack",
    description:
      "把 CurseForge 导出的整合包 ZIP 转换成兼容 Modrinth 的 .mrpack 文件。",
    note:
      "ZIP 文件在浏览器中读取。CurseForge 文件元数据会通过受保护的 API 代理解析。",
    chips: ["ZIP 转 MRPack", "CurseForge 导出", "浏览器内转换"],
  },
  uploadPanel: {
    acceptedFileLabel: ".zip",
    dropTitle: "把 CurseForge ZIP 拖到这里",
    dropDescription:
      "请使用包含 manifest.json 和可选 overrides 目录的 CurseForge 导出包。",
    selectButtonLabel: "选择 CurseForge ZIP 文件",
    downloadLabel: "下载 MRPack",
    resetLabel: "清除结果",
    invalidFileMessage: "文件格式无效，请选择 .zip 文件",
    selectedFilePrefix: "已选择文件",
    readyMessage: "已自动开始转换。",
    progressCountLabel: "已打包 CurseForge 文件",
    errorTitle: "转换失败",
    successTitle: "MRPack 已生成",
    successDescription: "转换完成，可点击下方按钮下载 .mrpack 文件。",
  },
  previewPanel: {
    title: "转换工作台",
    idleStatusLabel: "待机",
    dropActiveLabel: "松开即可上传 ZIP",
    outputSlotLabel: "输出槽",
    outputFileLabel: "MRPack 输出",
  },
  statusLabels: {
    readingZip: "正在读取 ZIP 压缩包...",
    readingManifest: "正在读取 CurseForge manifest...",
    resolvingCurseForgeFiles: "正在解析 CurseForge 文件...",
    matchingModrinthFiles: "正在匹配 Modrinth 文件...",
    downloadingCurseForgeFiles: "正在打包 CurseForge-only 文件...",
    buildingMrpack: "正在生成 MRPack...",
  },
  summaryLabels: {
    matched: "已匹配 Modrinth",
    bundled: "已打包 CurseForge",
  },
  whatItConverts: {
    title: "ZIP 转 MRPack 会读取什么",
    paragraphs: [
      "这个页面用于包含 manifest.json 以及可选 overrides 目录的 CurseForge ZIP 导出包。它不是通用 ZIP 转换器，不会从任意压缩包中猜测 Minecraft 整合包结构。",
      "转换器会从 manifest.json 读取 project ID 和 file ID，保留 overrides 覆盖文件，并生成兼容 Modrinth 的 .mrpack 输出。这种转换依赖这些 manifest 字段，因为 CurseForge 导出包通常用数字 ID 描述文件，而不是直接保存 Modrinth version 引用。",
      "开始转换前，浏览器会检查压缩包结构，并把源 ZIP 保留在本地会话中。这个页面期望的是正常 CurseForge 导出包，不是手动打包的 mods 文件夹、启动器实例备份或任意服务器目录。",
      "在可行时，CurseForge 文件元数据会通过 SHA-1 与 Modrinth version files 比对，使匹配成功的文件变成 Modrinth 引用，而不是打包下载文件。无法安全匹配时，转换器可以在可解析下载的前提下保留 CurseForge 文件，并在下载或匹配无法确认时直接报错。",
    ],
  },
  howToConvert: {
    title: "转换如何工作",
    description:
      "浏览器读取压缩包，解析 CurseForge 元数据，执行 Modrinth 匹配，然后生成 MRPack。这个转换流程只跟随 CurseForge manifest 和 overrides，不会自动改写整合包设计。",
    steps: [
      {
        title: "读取 CurseForge ZIP",
        description:
          "ZIP 会在浏览器本地打开，并在继续转换前校验 manifest.json。转换器会读取 Minecraft 版本、加载器信息、文件列表和 overrides，以便后续输出保持可追踪。",
      },
      {
        title: "解析并匹配文件",
        description:
          "CurseForge project ID 和 file ID 会通过受保护的 API 代理请求，然后结合 Modrinth 匹配和 SHA-1 元数据检查兼容文件。匹配成功的文件会变成 Modrinth 依赖引用，无法匹配但能安全下载的文件才会考虑打包。",
      },
      {
        title: "生成 MRPack",
        description:
          "匹配成功的文件会变成 Modrinth 引用，CurseForge-only 文件和 overrides 会被打包进输出文件。最终结果是一个聚焦 manifest 数据的 MRPack，而不是自动修复或重新设计整合包。",
      },
    ],
  },
  limits: {
    title: "限制与失败场景",
    description:
      "这些限制说明浏览器能安全确认的范围，以及转换可能停止的位置。它们也解释了为什么转换失败通常来自元数据、匹配或下载边界，而不是普通压缩包错误。",
    items: [
      {
        title: "CurseForge 导出结构",
        description:
          "ZIP 必须包含可读取的 manifest.json。缺失或格式错误的 manifest 都属于失败场景，因为没有可靠文件列表可转换。如果只是手动压缩 `.minecraft` 文件夹，可能有 mods 和配置，却没有可用于 Modrinth 匹配的 ID。",
      },
      {
        title: "受保护的元数据查询",
        description:
          "CurseForge 文件元数据会通过受保护的 API 代理获取。如果代理或 CurseForge 响应失败，匹配和打包可能不完整。代理只处理文件元数据和下载授权，不会接收完整 ZIP 做服务端转换。",
      },
      {
        title: "隐私边界",
        description:
          "压缩包在浏览器中读取。隐私边界是：用于查询的文件元数据可能发送给代理，但本地 ZIP 不会作为完整转换包整体上传。这样可以让工具保持在元数据解析和输出组装范围内。",
      },
    ],
  },
  faq: {
    title: "常见问题",
    viewAllLabel: "展开全部",
    closeAllLabel: "收起全部",
    items: [
      {
        question: "应该上传什么 ZIP？",
        answer:
          "请上传包含 manifest.json 且可选包含 overrides 目录的 CurseForge ZIP 导出包。这个页面不是通用 ZIP 转换器，不能处理任意文件夹压缩包、启动器备份或没有 CurseForge manifest ID 的服务器包。",
      },
      {
        question: "会使用 manifest 里的哪些字段？",
        answer:
          "转换器会使用 CurseForge project ID、file ID、文件路径、Minecraft 版本、加载器信息、overrides 文件和相关元数据。在存在兼容版本时，它会用 SHA-1 与 Modrinth 文件记录进行比对。",
      },
      {
        question: "Modrinth 匹配会做什么？",
        answer:
          "转换器会用 CurseForge 元数据查找兼容的 Modrinth 文件。无法匹配的文件，在能安全下载时可能会作为打包文件保留；无法解析或无法下载的文件会阻止转换，而不是被静默忽略。",
      },
      {
        question: "为什么需要受保护的 API 代理？",
        answer:
          "CurseForge 元数据需要受保护的服务端访问。代理负责解析文件元数据，避免把私密 API 凭证放到浏览器里，也避免在客户端 JavaScript 中暴露授权信息。",
      },
      {
        question: "主要失败场景有哪些？",
        answer:
          "manifest.json 缺失或格式错误、受保护的 API 代理不可用、CurseForge 文件无法解析、Modrinth 匹配不到兼容版本，或引用下载被阻止，都可能导致转换失败。",
      },
      {
        question: "隐私边界是什么？",
        answer:
          "ZIP 压缩包会在浏览器本地读取。CurseForge 查询所需的元数据可能通过受保护的 API 代理发送，但本地 ZIP 不会作为完整转换包整体上传。",
      },
      {
        question: "CurseForge-only 文件一定会转换成 Modrinth 引用吗？",
        answer:
          "不会。没有安全 Modrinth 匹配结果的文件，可能会在可解析下载时作为 CurseForge 文件打包。如果下载被阻止或不可用，转换会失败，而不是编造引用，因为有效的 .mrpack 应该说明每个依赖从哪里来。",
      },
    ],
  },
  footer: {
    tagline: "专注 CurseForge ZIP 转 MRPack 的浏览器工具，明确说明元数据和隐私边界。",
    links: chineseFooterLinks,
    copyright: "2026 MRPACKZIP。保留所有权利。",
    disclaimer: "与 Modrinth、CurseForge、Mojang 或 Microsoft 无关联。",
  },
};
