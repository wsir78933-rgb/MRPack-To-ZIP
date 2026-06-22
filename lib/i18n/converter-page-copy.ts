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

export type ConverterPanelCopy = {
  fileTypeLabel: string;
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
  glowToggleLabel: string;
  navLinks: NavigationLinkCopy[];
  hero: HeroCopy;
  converterPanel: ConverterPanelCopy;
  mrpackInfo: InfoSectionCopy;
  howToConvert: StepsSectionCopy;
  converterLimits: InfoSectionCopy;
  launcherSupport: LauncherSupportCopy;
  faq: FaqCopy;
  footer: FooterCopy;
};

export const englishConverterPageCopy: ConverterPageCopy = {
  ...sharedBrandCopy,
  localeCode: 'en',
  glowToggleLabel: 'Toggle glow',
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
      label: 'What is MRPack?',
      href: '#mrpack-file',
      isActive: false
    },
    {
      label: 'How it works',
      href: '#how-to-convert',
      isActive: false
    },
    {
      label: 'Launcher support',
      href: '#launcher-support',
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
    titleStart: 'Convert MRPack',
    titleAccent: 'to ZIP',
    description:
      'Use this MRPack converter to turn Modrinth packs, project slugs, or direct download links into standard ZIP archives for Minecraft modpack workflows.',
    note:
      'Runs in your browser as a Modrinth pack to ZIP tool. Your local .mrpack file is not uploaded to a server; referenced files are fetched directly from their source URLs.'
  },
  converterPanel: {
    fileTypeLabel: '.mrpack',
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
      'An .mrpack file is Modrinth\'s modpack format. It usually stores a manifest, overrides, and references to the mod files that need to be downloaded.',
      'A ZIP modpack is easier to import into launchers that do not understand .mrpack directly. This page is shaped around that one job: take .mrpack in, produce a launcher-friendly ZIP out.'
    ]
  },
  howToConvert: {
    title: 'How the converter flow works',
    description:
      'Choose a source, resolve the manifest, then download the rebuilt archive.',
    steps: [
      {
        title: 'Choose a source',
        description:
          'Enter a Modrinth project ID, paste a direct .mrpack URL, or upload a local file.'
      },
      {
        title: 'Resolve referenced mods',
        description:
          'The browser reads the pack index and fetches the referenced files from their listed URLs, which keeps the Minecraft modpack converter focused on the manifest contents.'
      },
      {
        title: 'Prepare the ZIP',
        description:
          'The output is a standard ZIP archive that common launchers can import.'
      }
    ]
  },
  converterLimits: {
    title: 'Real conversion limits',
    paragraphs: [
      'The browser enforces a 100 MB MRPack source limit, a 250 MB referenced file limit, a 1 GB total referenced files limit, and a 3000 manifest files limit before or during conversion.',
      'Referenced downloads can still fail when a source URL is missing, blocked by CORS, too large, or unavailable. When some files cannot be fetched, the ZIP includes FAILED_DOWNLOADS.txt so you can see which paths need manual attention.'
    ]
  },
  launcherSupport: {
    title: 'Which launchers need ZIP?',
    description:
      'Some launchers support .mrpack directly. Others work better with a standard ZIP archive.',
    launcherHeader: 'Import target',
    mrpackHeader: 'MRPack path',
    zipHeader: 'ZIP path',
    noteHeader: 'Use case',
    rows: [
      {
        targetName: 'Native .mrpack import',
        mrpackSupport: 'Best fit',
        zipNeed: 'Optional',
        note: 'Use when your launcher already accepts Modrinth packs.',
        supportLevel: 'yes'
      },
      {
        targetName: 'ZIP-based import',
        mrpackSupport: 'Limited',
        zipNeed: 'Useful',
        note: 'Use when the launcher wants a standard archive.',
        supportLevel: 'partial'
      },
      {
        targetName: 'Manual profile setup',
        mrpackSupport: 'Not direct',
        zipNeed: 'Useful',
        note: 'Use ZIP contents when building profiles by hand.',
        supportLevel: 'no'
      },
      {
        targetName: 'Server distribution',
        mrpackSupport: 'Not ideal',
        zipNeed: 'Preferred',
        note: 'ZIP archives are easier to share and unpack.',
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
        question: 'Why convert .mrpack to ZIP?',
        answer:
          'ZIP archives are easier to import into launchers that do not support Modrinth .mrpack files directly.'
      },
      {
        question: 'Does it need a backend?',
        answer:
          'The core upload, parse, package, and download flow runs in the browser. Some referenced files still need normal network downloads from their source URLs.'
      },
      {
        question: 'What can make conversion fail?',
        answer:
          'Missing downloads, blocked file URLs, CORS restrictions, browser memory limits, malformed pack indexes, files above 250 MB, more than 3000 manifest files, or more than 1 GB of total referenced files can stop or partially limit a conversion. Partial downloads are reported in FAILED_DOWNLOADS.txt.'
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
      }
    ],
    copyright: '2026 MRPACKZIP. All rights reserved.',
    disclaimer: 'Not affiliated with Modrinth, Mojang, or Microsoft.'
  }
};

export const chineseConverterPageCopy: ConverterPageCopy = {
  ...sharedBrandCopy,
  localeCode: 'zh-Hans',
  glowToggleLabel: '切换发光效果',
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
      label: '什么是 MRPack',
      href: '#mrpack-file',
      isActive: false
    },
    {
      label: '如何转换',
      href: '#how-to-convert',
      isActive: false
    },
    {
      label: '启动器兼容',
      href: '#launcher-support',
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
    titleStart: '转换 MRPack',
    titleAccent: '为 ZIP',
    description:
      '这个 MRPack converter 可以把 Modrinth 整合包、项目 ID 或直接下载链接转换成标准 ZIP，适合 Minecraft modpack converter 工作流。',
    note:
      '转换在浏览器中运行，可作为 Modrinth pack to ZIP 工具使用。本地 .mrpack 不会上传到服务器；引用文件会从原始下载 URL 直接获取。'
  },
  converterPanel: {
    fileTypeLabel: '.mrpack',
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
      '.mrpack 是 Modrinth 的整合包格式，通常包含清单、覆盖文件，以及需要下载的模组文件引用。',
      'ZIP 整合包更适合导入不直接支持 .mrpack 的启动器。这个页面只围绕一个任务设计：输入 .mrpack，输出启动器友好的 ZIP。'
    ]
  },
  howToConvert: {
    title: '转换流程如何工作',
    description: '选择来源、解析清单、下载重建后的 ZIP 压缩包。',
    steps: [
      {
        title: '选择来源',
        description: '输入 Modrinth 项目 ID、粘贴 .mrpack 直链，或上传本地文件。'
      },
      {
        title: '解析引用模组',
        description: '浏览器读取整合包索引，并从清单中的 URL 获取引用文件，让 Minecraft modpack converter 只围绕清单内容工作。'
      },
      {
        title: '准备 ZIP',
        description: '输出标准 ZIP 压缩包，供常见启动器导入。'
      }
    ]
  },
  converterLimits: {
    title: '真实转换限制',
    paragraphs: [
      '浏览器会执行 100 MB MRPack source 限制、250 MB referenced file 限制、1 GB total referenced files 限制，以及 3000 manifest files 限制；超过限制会在转换前或转换中停止对应步骤。',
      '引用下载仍可能因为来源 URL 缺失、CORS 阻止、文件过大或源站不可用而失败。如果部分文件无法获取，生成的 ZIP 会包含 FAILED_DOWNLOADS.txt，方便你查看哪些路径需要手动处理。'
    ]
  },
  launcherSupport: {
    title: '哪些启动器需要 ZIP？',
    description:
      '有些启动器能直接支持 .mrpack，有些启动器更适合使用标准 ZIP 压缩包。',
    launcherHeader: '导入目标',
    mrpackHeader: 'MRPack 路径',
    zipHeader: 'ZIP 路径',
    noteHeader: '适用场景',
    rows: [
      {
        targetName: '原生 .mrpack 导入',
        mrpackSupport: '最适合',
        zipNeed: '可选',
        note: '当启动器已经接受 Modrinth 整合包时使用。',
        supportLevel: 'yes'
      },
      {
        targetName: 'ZIP 压缩包导入',
        mrpackSupport: '受限',
        zipNeed: '有用',
        note: '当启动器需要标准压缩包时使用。',
        supportLevel: 'partial'
      },
      {
        targetName: '手动档案配置',
        mrpackSupport: '不直接适用',
        zipNeed: '有用',
        note: '手动搭建启动器档案时可使用 ZIP 内容。',
        supportLevel: 'no'
      },
      {
        targetName: '服务器分发',
        mrpackSupport: '不理想',
        zipNeed: '更适合',
        note: 'ZIP 更容易分享、解压和部署。',
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
        question: '为什么要把 .mrpack 转成 ZIP？',
        answer:
          'ZIP 压缩包更容易导入那些不直接支持 Modrinth .mrpack 文件的启动器。'
      },
      {
        question: '这个工具需要后端吗？',
        answer:
          '核心的上传、解析、打包和下载流程在浏览器中完成。但部分引用模组仍需要从来源 URL 正常下载。'
      },
      {
        question: '转换可能因为什么失败？',
        answer:
          '下载缺失、文件 URL 被阻止、CORS 限制、浏览器内存不足、整合包索引格式错误、单个文件超过 250 MB、manifest files 超过 3000 个，或 total referenced files 超过 1 GB，都可能导致转换失败或部分文件缺失。部分失败会写入 FAILED_DOWNLOADS.txt。'
      }
    ]
  },
  footer: {
    tagline: '专注 MRPack 转 ZIP 的浏览器工具，为 Minecraft 整合包兼容性而构建。',
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
      }
    ],
    copyright: '2026 MRPACKZIP. 保留所有权利。',
    disclaimer: '与 Modrinth、Mojang 或 Microsoft 无关联。'
  }
};
