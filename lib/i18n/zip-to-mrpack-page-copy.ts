export type ZipToMrpackPageCopy = {
  localeCode: string;
  logoText: string;
  logoAccent: string;
  glowToggleLabel: string;
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

const englishNavLinks = [
  { href: "/", label: "Converter", isActive: true },
  { href: "/zip-to-mrpack", label: "ZIP to MRPack", isActive: false },
  { href: "#faq", label: "FAQ", isActive: false },
];

const chineseNavLinks = [
  { href: "/zh", label: "转换器", isActive: true },
  { href: "/zh/zip-to-mrpack", label: "ZIP 转 MRPack", isActive: false },
  { href: "#faq", label: "FAQ", isActive: false },
];

export const englishZipToMrpackPageCopy: ZipToMrpackPageCopy = {
  localeCode: "en",
  logoText: "MRPACK",
  logoAccent: "ZIP",
  glowToggleLabel: "Toggle glow effect",
  navLinks: englishNavLinks,
  hero: {
    badge: "ZIP TO MRPACK",
    title: "Convert CurseForge ZIP to MRPack",
    description:
      "Convert CurseForge modpack exports into Modrinth-compatible .mrpack files.",
    note:
      "The ZIP is read in your browser. CurseForge file metadata is resolved through a protected API proxy.",
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
      "Use this page for CurseForge ZIP exports that include manifest.json plus the optional overrides directory.",
      "The converter reads project and file references from manifest.json, keeps override files as bundled content, and prepares a Modrinth-compatible .mrpack output.",
    ],
  },
  howToConvert: {
    title: "How the conversion works",
    description:
      "The browser reads the archive, resolves CurseForge metadata, performs Modrinth matching, and then builds the MRPack.",
    steps: [
      {
        title: "Read the CurseForge ZIP",
        description:
          "The ZIP is opened locally in the browser and manifest.json is validated before conversion continues.",
      },
      {
        title: "Resolve and match files",
        description:
          "CurseForge file metadata is requested through the protected API proxy, then compatible files are checked with Modrinth matching.",
      },
      {
        title: "Build the MRPack",
        description:
          "Matched files become Modrinth references, while CurseForge-only files and overrides are bundled into the output.",
      },
    ],
  },
  limits: {
    title: "Limits and failure cases",
    description:
      "These limits describe what the converter can prove safely in the browser and where conversion can stop.",
    items: [
      {
        title: "CurseForge export shape",
        description:
          "The ZIP must contain a readable manifest.json. Missing or malformed manifests are failure cases because there is no reliable file list to convert.",
      },
      {
        title: "Protected metadata lookup",
        description:
          "CurseForge file metadata goes through a protected API proxy. If that proxy or the CurseForge response fails, matching and bundling can be incomplete.",
      },
      {
        title: "Privacy boundary",
        description:
          "The archive is read in the browser. The privacy boundary is that file metadata may be sent to the proxy for lookup, while the local ZIP itself is not uploaded as a whole conversion job.",
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
          "Upload a CurseForge ZIP export that contains manifest.json and optionally an overrides directory.",
      },
      {
        question: "What happens during Modrinth matching?",
        answer:
          "The converter uses CurseForge metadata to look for compatible Modrinth files. Files that cannot be matched may be bundled when they can be downloaded safely.",
      },
      {
        question: "Why is there a protected API proxy?",
        answer:
          "CurseForge metadata needs protected server-side access. The proxy resolves file metadata without turning the browser into a place for private API credentials.",
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
    ],
  },
};

export const chineseZipToMrpackPageCopy: ZipToMrpackPageCopy = {
  localeCode: "zh-Hans",
  logoText: "MRPACK",
  logoAccent: "ZIP",
  glowToggleLabel: "切换发光效果",
  navLinks: chineseNavLinks,
  hero: {
    badge: "ZIP 转 MRPACK",
    title: "将 CurseForge ZIP 转为 MRPack",
    description:
      "把 CurseForge 导出的整合包 ZIP 转换成兼容 Modrinth 的 .mrpack 文件。",
    note:
      "ZIP 文件在浏览器中读取。CurseForge 文件元数据会通过受保护的 API 代理解析。",
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
      "这个页面用于包含 manifest.json 以及可选 overrides 目录的 CurseForge ZIP 导出包。",
      "转换器会从 manifest.json 读取项目和文件引用，保留 overrides 覆盖文件，并生成兼容 Modrinth 的 .mrpack 输出。",
    ],
  },
  howToConvert: {
    title: "转换如何工作",
    description:
      "浏览器读取压缩包，解析 CurseForge 元数据，执行 Modrinth 匹配，然后生成 MRPack。",
    steps: [
      {
        title: "读取 CurseForge ZIP",
        description:
          "ZIP 会在浏览器本地打开，并在继续转换前校验 manifest.json。",
      },
      {
        title: "解析并匹配文件",
        description:
          "CurseForge 文件元数据会通过受保护的 API 代理请求，然后用 Modrinth 匹配检查兼容文件。",
      },
      {
        title: "生成 MRPack",
        description:
          "匹配成功的文件会变成 Modrinth 引用，CurseForge-only 文件和 overrides 会被打包进输出文件。",
      },
    ],
  },
  limits: {
    title: "限制与失败场景",
    description:
      "这些限制说明浏览器能安全确认的范围，以及转换可能停止的位置。",
    items: [
      {
        title: "CurseForge 导出结构",
        description:
          "ZIP 必须包含可读取的 manifest.json。缺失或格式错误的 manifest 都属于失败场景，因为没有可靠文件列表可转换。",
      },
      {
        title: "受保护的元数据查询",
        description:
          "CurseForge 文件元数据会通过受保护的 API 代理获取。如果代理或 CurseForge 响应失败，匹配和打包可能不完整。",
      },
      {
        title: "隐私边界",
        description:
          "压缩包在浏览器中读取。隐私边界是：用于查询的文件元数据可能发送给代理，但本地 ZIP 不会作为完整转换任务整体上传。",
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
          "请上传包含 manifest.json 且可选包含 overrides 目录的 CurseForge ZIP 导出包。",
      },
      {
        question: "Modrinth 匹配会做什么？",
        answer:
          "转换器会用 CurseForge 元数据查找兼容的 Modrinth 文件。无法匹配的文件，在能安全下载时可能会作为打包文件保留。",
      },
      {
        question: "为什么需要受保护的 API 代理？",
        answer:
          "CurseForge 元数据需要受保护的服务端访问。代理负责解析文件元数据，避免把私密 API 凭证放到浏览器里。",
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
    ],
  },
};
