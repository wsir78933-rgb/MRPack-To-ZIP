import type { ConverterInputMode } from '@/lib/mrpack/conversion-workflow';

const sharedBrandCopy = {
  logoText: 'MRPACK',
  logoAccent: 'ZIP'
};

export type NavigationLinkCopy = {
  label: string;
  href: string;
  isActive: boolean;
};

export type HeroCopy = {
  badge: string;
  titleStart: string;
  titleAccent: string;
  description: string;
  note: string;
  chips: string[];
  chipListAriaLabel: string;
};

export type ConverterModeCopy = {
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  actionLabel: string;
};

export type ConversionWorkflowStageCopy = {
  'fetching-source': string;
  'loading-archive': string;
  'reading-index': string;
  'collecting-overrides': string;
  'downloading-files': string;
  'building-zip': string;
};

export type ConverterPreviewPanelCopy = {
  title: string;
  idleStatusLabel: string;
  outputSlotLabel: string;
  outputFileLabel: string;
};

export type ConverterPanelCopy = {
  fileTypeLabel: string;
  previewPanel: ConverterPreviewPanelCopy;
  modes: Record<ConverterInputMode, ConverterModeCopy>;
  dropTitle: string;
  dropDescription: string;
  separatorLabel: string;
  selectButtonLabel: string;
  convertingButtonLabel: string;
  downloadLabel: string;
  resetLabel: string;
  privacyNote: string;
  selectedFilePrefix: string;
  readyMessage: string;
  invalidFileMessage: string;
  emptyInputMessages: Record<ConverterInputMode, string>;
  stageLabels: ConversionWorkflowStageCopy;
  progressCountLabel: string;
  resultTitle: string;
  outputFileLabel: string;
  sourceFileLabel: string;
  referencedFilesLabel: string;
  overrideFilesLabel: string;
  failedDownloadsLabel: string;
  failedDownloadsNote: string;
  successNote: string;
  errorTitle: string;
};

export type InfoSectionCopy = {
  title: string;
  paragraphs: string[];
};

export type StepCopy = {
  title: string;
  description: string;
};

export type StepsSectionCopy = {
  title: string;
  description: string;
  steps: StepCopy[];
};

export type ConversionStatesCopy = {
  ariaLabel: string;
};

export type LauncherSupportLevel = 'yes' | 'partial' | 'no';

export type LauncherSupportRowCopy = {
  targetName: string;
  mrpackSupport: string;
  zipNeed: string;
  note: string;
  supportLevel: LauncherSupportLevel;
};

export type LauncherSupportCopy = {
  title: string;
  description: string;
  tableAriaLabel: string;
  launcherHeader: string;
  mrpackHeader: string;
  zipHeader: string;
  noteHeader: string;
  rows: LauncherSupportRowCopy[];
};

export type FaqItemCopy = {
  question: string;
  answer: string;
};

export type FaqCopy = {
  title: string;
  viewAllLabel: string;
  closeAllLabel: string;
  items: FaqItemCopy[];
};

export type FooterLinkCopy = {
  label: string;
  href: string;
};

export type FooterCopy = {
  tagline: string;
  links: FooterLinkCopy[];
  copyright: string;
  disclaimer: string;
};

export type ConverterPageCopy = {
  localeCode: string;
  logoText: string;
  logoAccent: string;
  languageSwitchLabel: string;
  navLinks: NavigationLinkCopy[];
  hero: HeroCopy;
  converterPanel: ConverterPanelCopy;
  mrpackInfo: InfoSectionCopy;
  howToConvert: StepsSectionCopy;
  converterLimits: InfoSectionCopy;
  conversionStates: ConversionStatesCopy;
  launcherSupport: LauncherSupportCopy;
  faq: FaqCopy;
  footer: FooterCopy;
};

export const englishConverterPageCopy: ConverterPageCopy = {
  ...sharedBrandCopy,
  localeCode: 'en',
  languageSwitchLabel: '中文',
  navLinks: [
    {
      label: 'Converter',
      href: '#converter',
      isActive: true
    },
    {
      label: 'ZIP to MRPack',
      href: '/zip-to-mrpack',
      isActive: false
    },
    {
      label: 'FAQ',
      href: '#faq',
      isActive: false
    }
  ],
  hero: {
    badge: 'MRPACK TO ZIP',
    titleStart: 'MRPack to ZIP',
    titleAccent: 'Converter',
    description:
      'Use this MRPack converter to turn Modrinth .mrpack files, project slugs, or download links into launcher-ready ZIP files in your browser.',
    note:
      'Runs in your browser as a Modrinth pack to ZIP tool. Your local .mrpack file is not uploaded to a server; referenced files are fetched directly from their source URLs.',
    chips: [
      'MRPack to ZIP',
      'CurseForge ZIP to MRPack',
      'Browser-first conversion'
    ],
    chipListAriaLabel: 'Supported conversion flows'
  },
  converterPanel: {
    fileTypeLabel: '.mrpack',
    previewPanel: {
      title: 'Crafting Converter',
      idleStatusLabel: 'Idle',
      outputSlotLabel: 'Output Slot',
      outputFileLabel: 'ZIP archive'
    },
    modes: {
      project: {
        title: 'Project ID',
        description: 'From Modrinth',
        inputLabel: 'Modrinth project ID or slug',
        inputPlaceholder: 'sodium, fabulously-optimized, ...',
        actionLabel: 'Find and convert'
      },
      url: {
        title: 'From URL',
        description: 'Paste download link',
        inputLabel: '.mrpack download URL',
        inputPlaceholder: 'https://cdn.modrinth.com/data/.../pack.mrpack',
        actionLabel: 'Download and convert'
      },
      upload: {
        title: 'Upload File',
        description: 'Local .mrpack',
        inputLabel: 'Local .mrpack file',
        inputPlaceholder: '',
        actionLabel: 'Convert uploaded file'
      }
    },
    dropTitle: 'Drop your .mrpack file here',
    dropDescription:
      'Select or drop a local Modrinth pack file. Conversion starts automatically in this browser.',
    separatorLabel: 'or',
    selectButtonLabel: 'Select .mrpack file',
    convertingButtonLabel: 'Converting...',
    downloadLabel: 'Download ZIP',
    resetLabel: 'Clear result',
    privacyNote: 'Local files stay in this browser session. Project ID and URL modes fetch files directly from public URLs.',
    selectedFilePrefix: 'Selected file',
    readyMessage: 'Conversion starts automatically.',
    invalidFileMessage: 'Invalid file. Choose a .mrpack file',
    emptyInputMessages: {
      project: 'Enter a Modrinth project ID or slug before converting.',
      url: 'Paste a .mrpack download URL before converting.',
      upload: 'Select a .mrpack file before converting.'
    },
    stageLabels: {
      'fetching-source': 'Preparing MRPack source...',
      'loading-archive': 'Loading .mrpack archive...',
      'reading-index': 'Reading modrinth.index.json...',
      'collecting-overrides': 'Collecting override files...',
      'downloading-files': 'Downloading referenced files...',
      'building-zip': 'Building ZIP archive...'
    },
    progressCountLabel: 'Processed referenced files',
    resultTitle: 'ZIP generated',
    outputFileLabel: 'Output',
    sourceFileLabel: 'Source',
    referencedFilesLabel: 'Referenced files',
    overrideFilesLabel: 'Override files',
    failedDownloadsLabel: 'Failed downloads',
    failedDownloadsNote: 'Missing files are listed inside FAILED_DOWNLOADS.txt in the ZIP.',
    successNote: 'Conversion complete. Click the button to download the ZIP.',
    errorTitle: 'Conversion failed'
  },
  mrpackInfo: {
    title: 'What is an .mrpack file?',
    paragraphs: [
      'MRPack vs ZIP is mainly a format and launcher compatibility question. An .mrpack file is Modrinth\'s modpack format: it keeps the pack metadata and tells the launcher where to fetch each required mod, resource pack, shader, or config file.',
      'Inside most packs, modrinth.index.json records the Minecraft version, loader, dependencies, file paths, hashes, and download URLs. Local files such as configs, default options, shader presets, and custom assets usually live in overrides, which must be copied into the rebuilt archive.',
      'A regular ZIP modpack is more portable because many launchers, panels, and manual install workflows already know how to unpack a standard archive. MRPack to ZIP conversion keeps the important manifest and override content together so you can move the pack into places that do not understand .mrpack directly.',
      'This MRPack to ZIP page is deliberately focused on one job: read the Modrinth pack structure, collect the referenced files that the browser can access, keep the override folders intact, and produce a launcher-ready ZIP without changing the tool into a general modpack editor.'
    ]
  },
  howToConvert: {
    title: 'How the converter flow works',
    description:
      'Choose a source, resolve the manifest, copy overrides, fetch the referenced files, then download the rebuilt archive.',
    steps: [
      {
        title: 'Choose a source',
        description:
          'Enter a Modrinth project ID, paste a direct .mrpack URL, or upload a local file. Project ID mode looks up the selected Modrinth release, while upload mode keeps the source file inside your browser session.'
      },
      {
        title: 'Resolve referenced mods',
        description:
          'The browser reads modrinth.index.json, copies overrides, and fetches referenced files from their listed URLs. That keeps the Minecraft modpack converter focused on the real manifest contents instead of guessing which mods belong in the pack.'
      },
      {
        title: 'Prepare the ZIP',
        description:
          'The output is a standard ZIP archive with the converted pack files, copied overrides, and any FAILED_DOWNLOADS.txt report needed for missing files. The goal is a practical MRPack to ZIP result that common launchers can inspect or import.'
      }
    ]
  },
  converterLimits: {
    title: 'Real conversion limits',
    paragraphs: [
      'The browser enforces a 100 MB MRPack source limit, a 250 MB referenced file limit, a 1 GB total referenced files limit, and a 3000 manifest files limit before or during conversion.',
      'Referenced downloads can still fail when a source URL is missing, blocked by CORS, too large, rate limited, or temporarily unavailable. The converter fails fast for unsafe inputs and reports partial download problems instead of silently hiding them.',
      'When some files cannot be fetched, the ZIP includes FAILED_DOWNLOADS.txt so you can see the original path, source URL, and reason that needs manual attention. This makes the MRPack to ZIP output easier to repair when a mod host blocks browser downloads.'
    ]
  },
  conversionStates: {
    ariaLabel: 'Conversion states'
  },
  launcherSupport: {
    title: 'Which launchers need ZIP?',
    description:
      'Some launchers support .mrpack directly. Others work better with a standard ZIP archive, especially when you are importing manually or preparing files for a server panel.',
    tableAriaLabel: 'Launcher support table',
    launcherHeader: 'Import target',
    mrpackHeader: 'MRPack path',
    zipHeader: 'ZIP path',
    noteHeader: 'Use case',
    rows: [
      {
        targetName: 'Prism Launcher / MultiMC / ATLauncher',
        mrpackSupport: 'Usually supported',
        zipNeed: 'Optional',
        note: 'Use native .mrpack import first. Convert only when you need a standard archive for sharing, inspection, or manual repair.',
        supportLevel: 'yes'
      },
      {
        targetName: 'CurseForge and generic ZIP importers',
        mrpackSupport: 'Partial',
        zipNeed: 'Useful',
        note: 'ZIP can be easier when the launcher expects an archive layout instead of a Modrinth manifest.',
        supportLevel: 'partial'
      },
      {
        targetName: 'Official Minecraft Launcher / Technic',
        mrpackSupport: 'Not direct',
        zipNeed: 'Often needed',
        note: 'These workflows usually need manual profile files, copied mods, and configs rather than a raw .mrpack import.',
        supportLevel: 'no'
      },
      {
        targetName: 'HMCL / PCL2 / regional launchers',
        mrpackSupport: 'Varies by version',
        zipNeed: 'Helpful fallback',
        note: 'A ZIP archive is useful when the exact launcher build does not recognize Modrinth packs.',
        supportLevel: 'partial'
      },
      {
        targetName: 'Server panels and manual installs',
        mrpackSupport: 'Not ideal',
        zipNeed: 'Preferred',
        note: 'ZIP archives are easier to upload, unpack, audit, and distribute outside a dedicated Modrinth-aware launcher.',
        supportLevel: 'no'
      }
    ]
  },
  faq: {
    title: 'Frequently Asked Questions',
    viewAllLabel: 'Open all',
    closeAllLabel: 'Close all',
    items: [
      {
        question: 'Is the converter browser-based?',
        answer:
          'Yes. The conversion runs in the browser. Project ID and URL modes still use normal network requests to fetch the selected .mrpack and referenced mod files.'
      },
      {
        question: 'Will my file be uploaded?',
        answer:
          'No. Local uploads stay in your browser session and are converted there.'
      },
      {
        question: 'Which launchers can open .mrpack directly?',
        answer:
          'Prism Launcher, MultiMC, ATLauncher, and other Modrinth-aware launchers commonly support .mrpack import. Official Minecraft Launcher, Technic, server panels, and manual install workflows usually benefit more from a ZIP.'
      },
      {
        question: 'Is this MRPack to ZIP converter safe to use online?',
        answer:
          'Local uploads are processed in the browser, and the tool does not need your Minecraft account. Project ID and URL modes still make public network requests to Modrinth and referenced file hosts so the selected pack can be rebuilt.'
      },
      {
        question: 'What can make conversion fail?',
        answer:
          'Missing downloads, blocked file URLs, CORS restrictions, browser memory limits, malformed pack indexes, files above 250 MB, more than 3000 manifest files, or more than 1 GB of total referenced files can stop or partially limit a conversion. Partial downloads are reported in FAILED_DOWNLOADS.txt.'
      },
      {
        question: 'What should I do if mods are missing after conversion?',
        answer:
          'Open FAILED_DOWNLOADS.txt inside the ZIP, check the listed paths and source URLs, then download those files manually if the host allows it. This is usually caused by expired URLs, blocked browser requests, or files that exceed the converter limits.'
      },
      {
        question: 'Can I use the converted ZIP on a server?',
        answer:
          'The ZIP can help with server preparation because configs and resolved files are easier to inspect. You may still need to separate client-only mods, confirm the loader version, and follow your host panel\'s upload rules.'
      }
    ]
  },
  footer: {
    tagline: 'A focused MRPack to ZIP browser tool, built for Minecraft modpack compatibility.',
    links: [
      {
        label: 'Converter',
        href: '#converter'
      },
      {
        label: 'How it works',
        href: '#how-to-convert'
      },
      {
        label: 'Launcher support',
        href: '#launcher-support'
      },
      {
        label: 'FAQ',
        href: '#faq'
      },
      {
        label: 'About',
        href: '/about'
      },
      {
        label: 'Privacy',
        href: '/privacy'
      },
      {
        label: 'Terms',
        href: '/terms'
      },
      {
        label: 'Contact',
        href: '/contact'
      }
    ],
    copyright: '2026 MRPACKZIP. All rights reserved.',
    disclaimer: 'Not affiliated with Modrinth, CurseForge, Mojang, or Microsoft.'
  }
};

export const chineseConverterPageCopy: ConverterPageCopy = {
  ...sharedBrandCopy,
  localeCode: 'zh-Hans',
  languageSwitchLabel: 'EN',
  navLinks: [
    {
      label: '转换器',
      href: '#converter',
      isActive: true
    },
    {
      label: 'ZIP 转 MRPack',
      href: '/zh/zip-to-mrpack',
      isActive: false
    },
    {
      label: 'FAQ',
      href: '#faq',
      isActive: false
    }
  ],
  hero: {
    badge: 'MRPACK 转 ZIP',
    titleStart: 'MRPack 转 ZIP',
    titleAccent: '转换器',
    description:
      '在浏览器中使用 MRPack 转 ZIP 工具，将 Modrinth .mrpack 文件、项目 ID 或下载链接转换成启动器可导入的 ZIP。',
    note:
      '转换在浏览器中运行，可作为 Modrinth pack to ZIP 工具使用。本地 .mrpack 不会上传到服务器；引用文件会从原始下载 URL 直接获取。',
    chips: [
      'MRPack 转 ZIP',
      'CurseForge ZIP 转 MRPack',
      '浏览器内转换'
    ],
    chipListAriaLabel: '支持的转换流程'
  },
  converterPanel: {
    fileTypeLabel: '.mrpack',
    previewPanel: {
      title: '转换工作台',
      idleStatusLabel: '空闲',
      outputSlotLabel: '输出槽',
      outputFileLabel: 'ZIP 压缩包'
    },
    modes: {
      project: {
        title: '项目 ID',
        description: '来自 Modrinth',
        inputLabel: 'Modrinth 项目 ID 或 slug',
        inputPlaceholder: 'sodium、fabulously-optimized、...',
        actionLabel: '查找并转换'
      },
      url: {
        title: '下载链接',
        description: '粘贴下载链接',
        inputLabel: '.mrpack 下载 URL',
        inputPlaceholder: 'https://cdn.modrinth.com/data/.../pack.mrpack',
        actionLabel: '下载并转换'
      },
      upload: {
        title: '上传文件',
        description: '本地 .mrpack',
        inputLabel: '本地 .mrpack 文件',
        inputPlaceholder: '',
        actionLabel: '转换上传文件'
      }
    },
    dropTitle: '把 .mrpack 文件拖到这里',
    dropDescription: '选择或拖入本地 Modrinth 整合包文件，浏览器会自动开始转换。',
    separatorLabel: '或',
    selectButtonLabel: '选择 .mrpack 文件',
    convertingButtonLabel: '正在转换...',
    downloadLabel: '下载 ZIP',
    resetLabel: '清除结果',
    privacyNote: '本地文件只保留在当前浏览器会话中。Project ID 和 URL 模式会从公开 URL 直接获取文件。',
    selectedFilePrefix: '已选择文件',
    readyMessage: '会自动开始转换。',
    invalidFileMessage: '文件格式无效，请选择 .mrpack 文件',
    emptyInputMessages: {
      project: '请先输入 Modrinth 项目 ID 或 slug。',
      url: '请先粘贴 .mrpack 下载 URL。',
      upload: '请先选择 .mrpack 文件。'
    },
    stageLabels: {
      'fetching-source': '正在准备 MRPack 来源...',
      'loading-archive': '正在读取 .mrpack 压缩包...',
      'reading-index': '正在读取 modrinth.index.json...',
      'collecting-overrides': '正在收集 override 文件...',
      'downloading-files': '正在下载引用文件...',
      'building-zip': '正在生成 ZIP 压缩包...'
    },
    progressCountLabel: '已处理引用文件',
    resultTitle: 'ZIP 已生成',
    outputFileLabel: '输出文件',
    sourceFileLabel: '来源文件',
    referencedFilesLabel: '引用文件',
    overrideFilesLabel: 'Override 文件',
    failedDownloadsLabel: '下载失败',
    failedDownloadsNote: '缺失文件会写入 ZIP 内的 FAILED_DOWNLOADS.txt。',
    successNote: '转换完成，可点击按钮下载 ZIP。',
    errorTitle: '转换失败'
  },
  mrpackInfo: {
    title: '什么是 .mrpack 文件？',
    paragraphs: [
      'MRPack 与 ZIP 的差异，本质上是格式和启动器兼容性差异。.mrpack 是 Modrinth 的整合包格式：它保存整合包元数据，并告诉启动器每个模组、资源包、光影或配置文件应该从哪里下载。',
      '大多数整合包内的 modrinth.index.json 会记录 Minecraft 版本、加载器、依赖、文件路径、哈希和下载 URL。本地配置、默认选项、光影预设和自定义资源通常位于 overrides，这些内容在重建 ZIP 时必须保留。',
      '标准 ZIP 整合包更容易在不识别 .mrpack 的启动器、服务器面板和手动安装流程中使用。MRPack 转 ZIP 会把重要的清单信息、引用文件和 overrides 放到一个更通用的压缩包里。',
      '这个转换页面只专注一件事：读取 Modrinth 整合包结构，收集浏览器能访问的引用文件，保留 override 目录，并生成启动器可用的 ZIP，而不是把工具扩展成复杂的整合包编辑器。'
    ]
  },
  howToConvert: {
    title: '转换流程如何工作',
    description: '选择来源、解析清单、复制 overrides、获取引用文件，然后下载重建后的 ZIP 压缩包。',
    steps: [
      {
        title: '选择来源',
        description: '输入 Modrinth 项目 ID、粘贴 .mrpack 直链，或上传本地文件。项目 ID 模式会查找对应 Modrinth 版本；上传模式会把源文件保留在当前浏览器会话中处理。'
      },
      {
        title: '解析引用模组',
        description: '浏览器读取 modrinth.index.json，复制 overrides，并从清单 URL 获取引用文件。这样 Minecraft modpack converter 只围绕真实清单内容工作，不靠猜测判断哪些模组属于整合包。'
      },
      {
        title: '准备 ZIP',
        description: '输出标准 ZIP 压缩包，包含转换后的整合包文件、复制的 overrides，以及必要时生成的 FAILED_DOWNLOADS.txt。目标是得到常见启动器可以检查或导入的转换结果。'
      }
    ]
  },
  converterLimits: {
    title: '真实转换限制',
    paragraphs: [
      '浏览器会执行 100 MB MRPack source 限制、250 MB referenced file 限制、1 GB total referenced files 限制，以及 3000 manifest files 限制；超过限制会在转换前或转换中停止对应步骤。',
      '引用下载仍可能因为来源 URL 缺失、CORS 阻止、文件过大、被限流或源站暂时不可用而失败。转换器会对不安全输入快速失败，并把部分下载问题报告出来，而不是静默吞掉错误。',
      '如果部分文件无法获取，生成的 ZIP 会包含 FAILED_DOWNLOADS.txt，方便你查看原始路径、来源 URL 和需要手动处理的原因。当某个模组源站阻止浏览器下载时，这能让生成结果更容易修复。'
    ]
  },
  conversionStates: {
    ariaLabel: '转换状态'
  },
  launcherSupport: {
    title: '哪些启动器需要 ZIP？',
    description:
      '有些启动器能直接支持 .mrpack，有些启动器更适合使用标准 ZIP 压缩包，尤其是手动导入或准备服务器面板文件时。',
    tableAriaLabel: '启动器兼容表',
    launcherHeader: '导入目标',
    mrpackHeader: 'MRPack 路径',
    zipHeader: 'ZIP 路径',
    noteHeader: '适用场景',
    rows: [
      {
        targetName: 'Prism Launcher / MultiMC / ATLauncher',
        mrpackSupport: '通常支持',
        zipNeed: '可选',
        note: '优先使用原生 .mrpack 导入。只有在分享、检查或手动修复时，才需要转换成标准压缩包。',
        supportLevel: 'yes'
      },
      {
        targetName: 'CurseForge 和通用 ZIP 导入器',
        mrpackSupport: '部分支持',
        zipNeed: '有用',
        note: '当启动器需要压缩包布局，而不是 Modrinth 清单时，ZIP 会更方便。',
        supportLevel: 'partial'
      },
      {
        targetName: '官方 Minecraft 启动器 / Technic',
        mrpackSupport: '不直接适用',
        zipNeed: '通常需要',
        note: '这些流程通常需要手动配置档案、复制 mods 和 configs，而不是直接导入 .mrpack。',
        supportLevel: 'no'
      },
      {
        targetName: 'HMCL / PCL2 / 国内常用启动器',
        mrpackSupport: '随版本变化',
        zipNeed: '备用方案',
        note: '当具体启动器版本不识别 Modrinth 整合包时，ZIP 是更稳妥的导入或检查方式。',
        supportLevel: 'partial'
      },
      {
        targetName: '服务器面板和手动安装',
        mrpackSupport: '不理想',
        zipNeed: '更适合',
        note: 'ZIP 更容易上传、解压、审查和在不识别 Modrinth 的环境中分发。',
        supportLevel: 'no'
      }
    ]
  },
  faq: {
    title: '常见问题',
    viewAllLabel: '展开全部',
    closeAllLabel: '收起全部',
    items: [
      {
        question: '转换是在浏览器中完成吗？',
        answer:
          '是。转换在浏览器中完成。Project ID 和 URL 模式仍会通过正常网络请求获取选中的 .mrpack 与引用模组文件。'
      },
      {
        question: '我的文件会被上传吗？',
        answer:
          '不会。本地上传的文件只会留在你的浏览器会话中，并在本地完成转换。'
      },
      {
        question: '哪些启动器可以直接打开 .mrpack？',
        answer:
          'Prism Launcher、MultiMC、ATLauncher 和其他支持 Modrinth 的启动器通常可以导入 .mrpack。官方 Minecraft 启动器、Technic、服务器面板和手动安装流程通常更适合使用 ZIP。'
      },
      {
        question: '在线使用这个转换器安全吗？',
        answer:
          '本地上传文件会在浏览器中处理，工具不需要你的 Minecraft 账号。Project ID 和 URL 模式仍会向 Modrinth 与引用文件源站发起公开网络请求，以便重建选中的整合包。'
      },
      {
        question: '转换可能因为什么失败？',
        answer:
          '下载缺失、文件 URL 被阻止、CORS 限制、浏览器内存不足、整合包索引格式错误、单个文件超过 250 MB、manifest files 超过 3000 个，或 total referenced files 超过 1 GB，都可能导致转换失败或部分文件缺失。部分失败会写入 FAILED_DOWNLOADS.txt。'
      },
      {
        question: '转换后缺少模组怎么办？',
        answer:
          '打开 ZIP 内的 FAILED_DOWNLOADS.txt，检查列出的路径和来源 URL，再按源站允许的方式手动下载这些文件。常见原因是链接过期、浏览器请求被阻止，或文件超过转换器限制。'
      },
      {
        question: '转换后的 ZIP 可以用于服务器吗？',
        answer:
          'ZIP 有助于服务器准备，因为配置和解析后的文件更容易检查。你仍然需要区分客户端专用模组、确认加载器版本，并按主机面板规则上传文件。'
      }
    ]
  },
  footer: {
    tagline: '专注 .mrpack 转 ZIP 的浏览器工具，为 Minecraft 整合包兼容性而构建。',
    links: [
      {
        label: '转换器',
        href: '#converter'
      },
      {
        label: '如何转换',
        href: '#how-to-convert'
      },
      {
        label: '启动器兼容',
        href: '#launcher-support'
      },
      {
        label: 'FAQ',
        href: '#faq'
      },
      {
        label: '关于',
        href: '/zh/about'
      },
      {
        label: '隐私',
        href: '/zh/privacy'
      },
      {
        label: '条款',
        href: '/zh/terms'
      },
      {
        label: '联系',
        href: '/zh/contact'
      }
    ],
    copyright: '2026 MRPACKZIP. 保留所有权利。',
    disclaimer: '与 Modrinth、CurseForge、Mojang 或 Microsoft 无关联。'
  }
};
