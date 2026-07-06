# MRPack ZIP Converter 产品与技术规格说明

> 文档状态：当前实现规格
>
> 同步基准：当前仓库代码与自动化测试
>
> 同步日期：2026-06-29

## 1. 文档定位

本文档描述当前仓库已经实现并由代码或测试支持的产品能力、数据流、技术边界和验收标准。

文档遵循以下状态规则：

- “当前能力”表示仓库中已有对应实现。
- “验收标准”表示当前功能应持续满足的行为。
- “后续规划”表示尚未实现，不属于当前版本承诺。
- 当本文档与实现不一致时，应以代码和测试结果为事实依据，并及时更新本文档。

当前产品不是早期纯前端骨架。它已经包含两条转换链路：

1. MRPack 转 ZIP。
2. CurseForge ZIP 转 MRPack。

第二条链路使用服务端 API Route 保护 CurseForge API 密钥，因此不能再把整个项目描述为“无需后端能力的纯前端应用”。

## 2. 产品概述

### 2.1 产品目标

提供一个浏览器优先的 Minecraft 整合包转换工具：

- 将 Modrinth `.mrpack` 转换为标准 `.zip`。
- 将 CurseForge 导出的整合包 `.zip` 转换为兼容 Modrinth 的 `.mrpack`。
- 尽量在浏览器中读取、解析和打包用户选择的本地文件。
- 对必须访问第三方平台的步骤给出明确的网络和隐私边界。
- 对无效输入、危险路径、第三方响应异常和体积超限执行 Fail Fast。

### 2.2 目标用户

| 用户类型 | 主要需求 |
| --- | --- |
| Minecraft 普通玩家 | 在不同启动器或手动安装流程之间迁移整合包。 |
| Modrinth 用户 | 将 `.mrpack` 展开为更通用的 ZIP。 |
| CurseForge 用户 | 将带 `manifest.json` 的 CurseForge 导出包转换为 `.mrpack`。 |
| 服务器服主 | 获得便于检查、上传或分发的整合包文件。 |

### 2.3 当前能力总览

| 能力 | 状态 | 入口 |
| --- | --- | --- |
| 本地 `.mrpack` 转 ZIP | 已实现 | `/`、`/zh` |
| Modrinth Project ID / slug 转 ZIP | 已实现 | `/`、`/zh` |
| 直接 `.mrpack` URL 转 ZIP | 已实现 | `/`、`/zh` |
| CurseForge ZIP 转 MRPack | 已实现 | `/zip-to-mrpack`、`/zh/zip-to-mrpack` |
| 英文与简体中文页面 | 已实现 | 四个 canonical 页面 |
| SEO metadata、sitemap、robots、JSON-LD | 已实现 | 全站页面层 |
| 用户账户、云存储、历史记录、批量转换 | 未实现 | 后续规划 |

## 3. 当前版本范围

### 3.1 已实现范围

- 三种 MRPack 输入模式：Project ID / slug、直接 URL、本地上传。
- 浏览器内解析 `.mrpack`、复制 overrides、下载引用文件并生成 ZIP。
- 对引用文件执行体积、`fileSize` 和哈希校验。
- 引用文件部分失败时继续转换并生成 `FAILED_DOWNLOADS.txt`。
- 为 MRPack 转 ZIP 输出生成 `pack-info.json`。
- 读取 CurseForge ZIP 的 `manifest.json` 与 overrides。
- 通过受保护的 API Route 查询 CurseForge 文件元数据。
- 通过 SHA-1 将 CurseForge 文件匹配到 Modrinth 文件。
- 将无法匹配但可下载的 CurseForge-only 文件打包进 MRPack。
- 双语 UI、转换进度、结果摘要、手动下载与错误展示。
- canonical、hreflang、Open Graph、Twitter Card、JSON-LD、sitemap、robots 和本地化 404。

### 3.2 当前不包含

- 用户注册、登录和权限系统。
- 云端保存用户上传的整合包。
- 服务端异步转换队列。
- 跨设备转换历史。
- 批量转换。
- 支付、订阅和后台管理系统。
- 通用 ZIP 编辑器或任意 ZIP 到 MRPack 的猜测式转换。
- CurseForge 以外的 ZIP 清单格式导入。

## 4. 路由与本地化

### 4.1 Canonical 页面

| 路由 | 语言 | 页面 |
| --- | --- | --- |
| `/` | English | MRPack to ZIP |
| `/zh` | 简体中文 | MRPack 转 ZIP |
| `/zip-to-mrpack` | English | CurseForge ZIP to MRPack |
| `/zh/zip-to-mrpack` | 简体中文 | CurseForge ZIP 转 MRPack |

### 4.2 路由规则

- 英文以根路径为默认语言。
- `/en` 永久重定向到 `/`。
- `/en/zip-to-mrpack` 永久重定向到 `/zip-to-mrpack`。
- 英文和中文页面使用独立的静态 `lang` 属性。
- 未匹配路径返回对应语言的 404 HTML，并标记 `noindex`。
- sitemap 只包含四个 canonical 页面，不包含 API Route、重定向入口和 404。

## 5. MRPack 转 ZIP

### 5.1 输入模式

#### Project ID / slug

用户输入 Modrinth 项目 ID 或 slug。浏览器调用：

```text
GET https://api.modrinth.com/v2/project/{id_or_slug}/version?include_changelog=false
```

当前行为：

- 输入在发起请求前必须去除首尾空白且不得为空。
- API 响应根节点必须是数组。
- 每个版本必须包含 `files` 数组。
- 按 API 返回顺序查找第一个文件名以 `.mrpack` 结尾的文件。
- 找不到 `.mrpack` 时立即报错，不进入后续转换。
- 找到后从返回的 URL 下载源 `.mrpack`。

#### 直接 URL

用户输入一个 HTTP 或 HTTPS URL。

当前行为：

- 拒绝空值和非 HTTP(S) 协议。
- 检查响应状态。
- 同时通过 `Content-Length` 和流式读取执行 100 MB 源文件上限。
- URL 路径没有合法 `.mrpack` 文件名时使用 `downloaded-pack.mrpack` 作为源文件名。

#### 本地上传

用户选择或拖入 `.mrpack` 文件。

当前行为：

- UI 文件选择和拖放入口只接受 `.mrpack` 扩展名。
- 选择文件后自动开始转换。
- 在读取前检查可用的 `File.size`，读取后再次检查实际字节数。
- 本地源 `.mrpack` 不会作为完整文件上传到本站服务器。

### 5.2 解析与校验

转换器使用 JSZip 将 `.mrpack` 作为 ZIP 读取，并执行：

1. 校验源文件大小。
2. 加载归档。
3. 读取根目录 `modrinth.index.json`。
4. 解析 `name`、`versionId`、`dependencies` 和 `files`。
5. 校验每个引用文件的 `path`、`downloads`、可选 `hashes` 与可选 `fileSize`。
6. 收集 `overrides/`、`client-overrides/`、`server-overrides/` 下的文件。

`modrinth.index.json.files` 最多允许 3000 项。缺少索引、JSON 无法解析、字段类型错误或超出数量限制时，整个转换立即失败。

### 5.3 Overrides 处理

当前支持三个前缀：

- `overrides/`
- `client-overrides/`
- `server-overrides/`

写入输出 ZIP 时移除前缀并保留后续相对路径。例如：

```text
overrides/config/example.toml -> config/example.toml
```

目录项不写入输出。非上述三个前缀下的源归档文件不会作为 override 复制。

### 5.4 引用文件下载

对每个 `files[]` 条目按顺序处理：

- 依次尝试 `downloads[]` 中的 HTTP(S) URL，直到一个通过全部校验。
- 非法 URL、非成功状态、不可读响应、体积超限、`fileSize` 不一致或哈希不匹配都会记录原因并尝试下一个 URL。
- 若存在 `sha512`，优先校验 SHA-512。
- 没有 `sha512` 但存在 `sha1` 时校验 SHA-1。
- 没有受支持哈希时只执行路径、状态和体积相关校验。
- 单个条目全部失败不会终止整个转换。
- 当前下载按文件顺序串行执行。

### 5.5 体积与数量限制

| 限制 | 当前值 |
| --- | ---: |
| MRPack 源文件 | 100 MB |
| `files[]` 条目数 | 3000 |
| 单个引用文件 | 250 MB |
| 单次转换引用文件累计下载量 | 1 GB |

限制同时利用清单中的 `fileSize`、HTTP `Content-Length` 和实际流式读取字节数，不能只依赖请求头。

### 5.6 输出 ZIP

输出由以下内容组成：

- 去除 override 前缀后的本地文件。
- 成功下载并通过校验的引用文件。
- 存在失败引用文件时生成的 `FAILED_DOWNLOADS.txt`。
- 每次转换都生成的 `pack-info.json`。

`FAILED_DOWNLOADS.txt` 包含：

- 目标路径。
- 尝试过的 URL。
- 每次失败的具体原因。
- 手动补齐文件的说明。

`pack-info.json` 当前包含：

- `name`
- `versionId`
- `minecraftVersion`
- `referencedFileCount`
- `overrideFileCount`
- `failedDownloadCount`

输出 MIME 类型为 `application/zip`。输出文件名基于源 `.mrpack` 文件名生成，并替换不安全的文件名字符。

### 5.7 进度阶段

UI 展示以下阶段：

1. `fetching-source`
2. `loading-archive`
3. `reading-index`
4. `collecting-overrides`
5. `downloading-files`
6. `building-zip`

下载阶段同时展示已处理文件数和总文件数。成功后页面展示源文件名、输出文件名、引用文件数、override 数和失败数，并由用户点击按钮下载 ZIP。

### 5.8 MRPack 转 ZIP 验收标准

- 三种输入模式都进入同一套标准转换流程。
- 非 `.mrpack` 本地文件在转换前被拒绝。
- 缺少或损坏的 `modrinth.index.json` 返回具体错误。
- overrides 正确去除前缀并写入输出。
- 引用文件按备用 URL 顺序尝试。
- `fileSize`、SHA-512 或 SHA-1 不一致的内容不能写入输出。
- 部分引用下载失败时仍生成 ZIP，并包含 `FAILED_DOWNLOADS.txt`。
- 全部引用下载成功时不生成 `FAILED_DOWNLOADS.txt`。
- 每个成功输出都包含 `pack-info.json`。
- UI 进度百分比和文件计数保持有限且合法。

## 6. CurseForge ZIP 转 MRPack

### 6.1 输入约束

当前入口只接受 CurseForge 导出的 `.zip`，不是任意 ZIP。

输入必须满足：

- 文件名以 `.zip` 结尾。
- 归档可被 JSZip 读取。
- 根目录包含 `manifest.json`。
- `manifestType` 为 `minecraftModpack`。
- `manifestVersion` 为 `1`。
- `minecraft.version` 为非空字符串。
- `minecraft.modLoaders` 为非空数组，并且恰好有一个 `primary: true`。
- `files` 为数组，每项包含正整数 `projectID`、`fileID` 和布尔值 `required`。
- `overrides` 是安全的相对路径。

选择合法 ZIP 后，页面自动开始转换。

### 6.2 转换数据流

```text
浏览器读取 CurseForge ZIP
-> 读取并校验 manifest.json
-> 收集 manifest 指定 overrides 目录下的文件
-> POST /api/curseforge/files 查询文件元数据
-> 读取 CurseForge SHA-1
-> POST Modrinth /v2/version_files 执行哈希匹配
-> 匹配项写入 modrinth.index.json files[]
-> 未匹配项经 /api/curseforge/download 下载
-> 未匹配项写入 overrides/mods/
-> 生成并下载 .mrpack
```

### 6.3 CurseForge 元数据代理

浏览器调用：

```text
POST /api/curseforge/files
```

服务端 Route 调用：

```text
POST https://api.curseforge.com/v1/mods/files
```

当前规则：

- 请求中传递 `projectId` 与 `fileId`，二者必须是正的 32 位整数范围 ID。
- 单次元数据请求最多接受 3000 个文件引用。
- 服务端从 `CURSEFORGE_API_KEY` 读取密钥，并通过 `x-api-key` 请求官方 API。
- 密钥缺失时返回明确的 500 错误。
- CurseForge 响应必须包含结构合法的 `data` 数组。
- 返回元数据必须与清单中的 project ID / file ID 对应，且文件必须可用。

### 6.4 Modrinth 哈希匹配

转换器从 CurseForge 元数据读取算法编号为 `1` 的 SHA-1，并由浏览器调用：

```text
POST https://api.modrinth.com/v2/version_files
```

请求使用：

```json
{
  "hashes": ["..."],
  "algorithm": "sha1"
}
```

匹配成功的文件会成为 `modrinth.index.json.files[]` 引用项，包含：

- `mods/{filename}` 路径。
- Modrinth HTTPS 下载 URL。
- Modrinth 返回的 hashes。
- 可用时包含 `fileSize`。

当前生成器要求匹配项至少包含 `sha1` 和 `sha512`，并拒绝空下载列表、非 HTTPS URL、不安全路径和重复输出路径。

### 6.5 CurseForge-only 文件

无法在 Modrinth 按 SHA-1 匹配的文件会通过：

```text
POST /api/curseforge/download
```

服务端下载前会再次查询并核对 CurseForge 元数据，然后执行：

- project ID 与 file ID 匹配校验。
- `isAvailable` 校验。
- 下载 URL 必须使用 HTTPS。
- 下载主机必须严格等于 `edge.forgecdn.net`。
- CDN 响应必须成功且包含可读 body。

成功下载的 CurseForge-only 文件写入：

```text
overrides/mods/{safeFileName}
```

文件名不得为空、不得包含路径分隔符，也不得为 `.` 或 `..`。

与 MRPack 转 ZIP 的“部分失败继续输出”不同，当前 ZIP 转 MRPack 流程在必需元数据、匹配或 CurseForge-only 下载失败时会终止并显示错误，不生成不完整结果。

### 6.6 生成 `modrinth.index.json`

输出索引固定包含：

```json
{
  "formatVersion": 1,
  "game": "minecraft",
  "name": "...",
  "versionId": "...",
  "dependencies": {},
  "files": []
}
```

字段规则：

- 缺少包名时使用 `Converted Pack`。
- 缺少版本时使用 `1.0.0`。
- `dependencies.minecraft` 来自 CurseForge manifest。
- 主加载器 ID 被转换为对应依赖名和版本。
- 当前支持 Forge、NeoForge、Fabric Loader 和 Quilt Loader 的已实现 ID 前缀。
- 无法识别的主加载器格式立即失败。

### 6.7 输出 MRPack

输出包含：

- 生成的 `modrinth.index.json`。
- CurseForge overrides，统一写入 `overrides/`。
- CurseForge-only 文件，写入 `overrides/mods/`。

输出 MIME 类型为：

```text
application/x-modrinth-modpack+zip
```

输出文件名基于输入 ZIP 文件名生成，并替换不安全字符，扩展名改为 `.mrpack`。

### 6.8 进度阶段

UI 展示以下阶段：

1. `reading-zip`
2. `reading-manifest`
3. `resolving-curseforge-files`
4. `matching-modrinth-files`
5. `downloading-curseforge-files`（仅存在 CurseForge-only 文件时）
6. `building-mrpack`

成功后展示 Modrinth 匹配数量和 CurseForge 打包数量，并由用户点击按钮下载 MRPack。

### 6.9 ZIP 转 MRPack 验收标准

- 非 `.zip` 文件在读取前被拒绝。
- 缺少或损坏的 `manifest.json` 返回具体错误。
- manifest 字段类型和 ID 范围受到严格校验。
- 本地 ZIP 在浏览器读取，不作为完整转换任务上传。
- CurseForge API 密钥只在服务端读取。
- Modrinth 匹配项写入 `files[]`，不重复打包二进制内容。
- CurseForge-only 文件安全写入 `overrides/mods/`。
- 原 overrides 保留相对结构并写入 `overrides/`。
- 不安全路径、重复输出路径、非 HTTPS 匹配 URL 和非白名单 CDN 主机被拒绝。
- 输出包含合法的 `modrinth.index.json`，MIME 类型正确。

## 7. API、网络与隐私边界

### 7.1 外部请求矩阵

| 场景 | 发起方 | 目标 | 是否需要本站服务端 |
| --- | --- | --- | --- |
| Project ID / slug 查询 | 浏览器 | Modrinth project versions API | 否 |
| `.mrpack` URL 下载 | 浏览器 | 用户提供的 HTTP(S) URL | 否 |
| MRPack 引用文件下载 | 浏览器 | `downloads[]` 中的 HTTP(S) URL | 否 |
| CurseForge 元数据查询 | 服务端 API Route | CurseForge files API | 是 |
| SHA-1 匹配 | 浏览器 | Modrinth `version_files` API | 否 |
| CurseForge-only 文件下载 | 服务端 API Route | CurseForge API 与 `edge.forgecdn.net` | 是 |

### 7.2 环境变量

| 变量 | 必需性 | 用途 |
| --- | --- | --- |
| `CURSEFORGE_API_KEY` | ZIP 转 MRPack 必需 | 服务端请求 CurseForge API。 |
| `NEXT_PUBLIC_SITE_URL` | 可选 | 覆盖 SEO 使用的站点 origin；默认 `https://mrpacktozip.pro`。 |

`NEXT_PUBLIC_SITE_URL` 只接受：

- HTTPS origin；或
- `localhost` / `127.0.0.1` 的 HTTP origin。

它不得包含额外路径、query 或 hash。非法值在生成 metadata 时立即报错。

### 7.3 隐私边界

- 本地 `.mrpack` 和 CurseForge ZIP 都在浏览器中读取。
- Project ID、远程 URL 和引用文件模式会产生正常的第三方网络请求。
- ZIP 转 MRPack 会把 manifest 中的 CurseForge project/file ID 发送到本站 API Route。
- CurseForge-only 文件内容会经过本站服务端 Route 流式转发。
- 当前没有用户账户、云存储或转换历史持久化实现。
- 产品文案不得宣称“整个流程完全离线”或“所有数据永不经过服务器”。

## 8. UI 与交互要求

### 8.1 通用页面结构

- 顶部品牌与导航。
- 英文/中文切换。
- 可切换的视觉发光效果。
- Hero、转换器、原理说明、限制说明和 FAQ。
- 响应式桌面与移动布局。
- MRPack 转 ZIP 与 ZIP 转 MRPack 页面保持一致的主容器宽度体系。

### 8.2 转换交互

- MRPack 转 ZIP 提供三个输入模式卡片。
- 本地文件选择或拖放后自动转换。
- Project ID 和 URL 模式由明确按钮提交，不在每次键入时请求网络。
- 进行中禁用会产生冲突的文件选择操作。
- 新转换使用独立 run ID，过期异步结果不得覆盖当前状态。
- 成功后不会强制自动下载，由用户点击下载按钮。
- 用户可以清除结果并重新开始。

### 8.3 可访问性

- 进度使用合法的百分比和可读文本。
- 文件计数必须同时具有当前值和总值，否则 Fail Fast。
- 当前计数不得为负数或大于总数。
- FAQ 支持逐项展开、悬停展开以及展开/收起全部。
- 活动导航项使用 `aria-current`。
- 发光开关使用 `aria-pressed` 与明确标签。

## 9. 错误处理

### 9.1 错误分类

共享转换错误代码包括：

- `invalid_input`
- `invalid_path`
- `invalid_url`
- `invalid_mrpack`
- `modrinth_api_error`
- `download_failed`
- `zip_build_failed`

### 9.2 处理原则

- 输入边界、第三方响应和归档字段必须校验具体值。
- 不能静默吞掉未知异常。
- 可恢复的 MRPack 引用文件失败写入 `FAILED_DOWNLOADS.txt`。
- 不能安全恢复的归档、清单、路径、API 或打包错误立即终止。
- UI 根据英文或中文页面输出本地化错误类别与结构化细节。
- 未识别的异常仍显示本地化兜底信息，不直接向用户展示空状态。

## 10. 安全要求

### 10.1 归档路径安全

所有进入输出归档的路径必须拒绝：

- 空字符串或仅空白。
- 空字节。
- `/` 或 `\` 开头的绝对路径。
- Windows 盘符前缀。
- 反斜杠。
- 空路径段。
- `.` 路径段。
- `..` 路径段。

输出构建器还必须拒绝重复目标路径，避免后写内容覆盖先写内容。

### 10.2 URL 与代理边界

- 浏览器侧 MRPack 下载只接受 HTTP(S)。
- ZIP 转 MRPack 生成的 Modrinth 引用必须是 HTTPS。
- CurseForge 服务端下载只允许 HTTPS 且主机严格为 `edge.forgecdn.net`。
- CurseForge 下载 Route 必须根据官方 API 元数据重新解析 URL，不能接受浏览器提交任意下载 URL。

### 10.3 密钥安全

- `CURSEFORGE_API_KEY` 只从服务端环境读取。
- 浏览器请求和前端 bundle 不得包含该密钥。
- API Route 错误不得回显密钥值。

## 11. 性能与资源边界

### 11.1 当前实现特征

- JSZip 会把输入、下载内容和输出保存在内存中。
- MRPack 引用文件当前串行下载，优先保证行为简单和错误可追踪。
- MRPack 转 ZIP 已有明确的源文件、单文件、累计下载和清单数量限制。
- ZIP 转 MRPack 当前没有独立的 ZIP 大小、清单文件数或累计打包体积上限。
- 两条转换链路都受浏览器内存和第三方网络质量影响。

### 11.2 当前用户提示

- 页面必须说明浏览器转换的资源限制。
- 第三方 URL 可能因 CORS、限流、临时不可用或响应异常而失败。
- 受保护的 CurseForge 代理不可用时，ZIP 转 MRPack 无法完成。

## 12. SEO 要求

### 12.1 页面 metadata

四个 canonical 页面各自提供：

- 本地化 title 和 description。
- canonical URL。
- `en`、`zh-Hans` 和 `x-default` hreflang。
- Open Graph metadata。
- Twitter summary large image metadata。

### 12.2 结构化数据

两个转换器页面都输出可解析的 JSON-LD：

- `WebApplication`
- `FAQPage`

FAQ JSON-LD 必须来自对应页面当前文案，避免页面内容与结构化数据分叉。

### 12.3 robots 与 sitemap

- robots 允许抓取页面。
- robots 禁止抓取 `/api/`。
- robots 指向绝对 sitemap URL。
- sitemap 仅列出四个 canonical 页面。

## 13. 技术架构

### 13.1 技术栈

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI / shadcn 风格组件
- JSZip
- Vitest

### 13.2 模块边界

```text
components/localized-converter-page.tsx
  MRPack 转 ZIP 页面状态、输入模式和结果 UI

components/localized-zip-to-mrpack-page.tsx
  ZIP 转 MRPack 页面状态、自动转换和结果 UI

lib/mrpack/conversion-workflow.ts
  MRPack 三种输入源调度

lib/mrpack/conversion-runner.ts
  MRPack 转 ZIP 主流程调度

lib/mrpack/mrpack-parser.ts
  读取和校验 modrinth.index.json、收集 overrides

lib/mrpack/referenced-file-downloader.ts
  下载备用 URL、执行体积/fileSize/hash 校验

lib/mrpack/path-safety.ts
  归档路径校验与 override 路径归一化

lib/mrpack/zip-builder.ts
  组装 ZIP、失败报告和 pack-info

lib/zip-to-mrpack/conversion-workflow.ts
  CurseForge ZIP 转 MRPack 主流程调度

lib/curseforge/archive-reader.ts
  读取 CurseForge ZIP、manifest 和 overrides

lib/curseforge/manifest-parser.ts
  严格校验 CurseForge manifest

lib/curseforge-api/*
  CurseForge 客户端协议、服务端请求与响应校验

lib/zip-to-mrpack/modrinth-version-files.ts
  使用 SHA-1 查询 Modrinth 匹配项

lib/zip-to-mrpack/modrinth-index-builder.ts
  生成并校验 modrinth.index.json

lib/zip-to-mrpack/mrpack-builder.ts
  组装最终 MRPack

lib/i18n/*
  双语文案与本地化错误格式

lib/seo/*
  metadata、canonical、hreflang、sitemap、robots、JSON-LD 和 404
```

### 13.3 设计原则

- React 组件负责交互状态和调度，不实现归档内部算法。
- 解析、下载、路径校验和输出构建分离为职责明确的函数模块。
- 模块之间使用显式输入和返回类型通信。
- 数据边界执行严格校验并返回包含问题值或字段路径的错误。
- 不为尚未出现的扩展需求预建抽象层。

## 14. 测试与验证

### 14.1 自动化测试范围

当前测试覆盖：

- MRPack 三种来源与完整转换管线。
- Modrinth API URL、响应解析和无 `.mrpack` 场景。
- `modrinth.index.json` 解析、数量限制与字段校验。
- overrides、路径安全和重复输出路径。
- 引用文件备用 URL、体积、`fileSize`、SHA-1、SHA-512 与累计限制。
- `FAILED_DOWNLOADS.txt`、`pack-info.json` 和 ZIP 构建。
- CurseForge manifest、元数据 API、下载代理和 CDN 白名单。
- CurseForge/Modrinth SHA-1 匹配与 MRPack 构建。
- 双语文案、路由、重定向和本地化错误。
- 进度百分比、文件计数、过期转换 run 隔离。
- canonical、hreflang、结构化数据、sitemap、robots 和本地化 404。
- 关键 UI 结构与双页面宽度一致性。

### 14.2 标准验证命令

```bash
pnpm test
pnpm typecheck
pnpm build
```

当前 `package.json` 没有独立的 `lint` script，不应把 `pnpm lint` 写入必跑命令。

### 14.3 发布验收

发布前至少确认：

- 三种 MRPack 来源都能进入转换流程。
- 合法 `.mrpack` 可以生成可打开的 ZIP。
- 合法 CurseForge 导出 ZIP 可以生成可打开的 MRPack。
- 缺少 `CURSEFORGE_API_KEY` 时 ZIP 转 MRPack 显示明确错误。
- 两种语言的四个 canonical 页面可访问。
- 语言切换、重定向、404、sitemap 和 robots 行为与测试一致。
- `pnpm test`、`pnpm typecheck`、`pnpm build` 全部通过。

## 15. 已知限制

- MRPack 转 ZIP 依赖第三方下载 URL 允许浏览器访问；CORS 无法由当前前端绕过。
- 引用文件按顺序下载，大型整合包耗时可能较长。
- JSZip 不是流式归档实现，大包会产生明显内存压力。
- ZIP 转 MRPack 仅支持带合法 `manifest.json` 的 CurseForge 导出包。
- ZIP 转 MRPack 依赖 `CURSEFORGE_API_KEY`、CurseForge API、Modrinth API 和允许的 CurseForge CDN 主机。
- ZIP 转 MRPack 当前没有与 MRPack 转 ZIP 对等的显式体积和数量上限。
- CurseForge-only 文件下载后会被打包，但当前没有对其内容再次执行哈希校验。
- 当前没有重试队列、服务端转换任务或断点续传。

## 16. 后续规划

以下项目尚未实现，不属于当前版本验收标准：

### 16.1 安全与可靠性

- 为 ZIP 转 MRPack 增加明确的源 ZIP、清单数量、单文件和累计体积限制。
- 对 CurseForge-only 文件执行下载长度与哈希校验。
- 根据真实 CDN 兼容需求审慎扩展服务端下载主机白名单。
- 增加第三方 API 的超时、有限重试、缓存和可观测性。

### 16.2 性能

- 在不破坏错误可追踪性的前提下评估有限并发下载。
- 评估 Web Worker，降低归档生成对主线程的影响。
- 评估更适合大文件的流式读取与流式归档方案。

### 16.3 产品能力

- 批量转换。
- 本地转换历史或可选账户同步。
- 更多明确有清单规范的整合包格式。
- 在有明确商业需求后再评估统计、广告或付费能力。

任何后续规划进入开发前，都需要单独确认使用场景、范围、风险、验收标准和验证方式。
