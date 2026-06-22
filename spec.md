# MRPack ZIP Converter 产品与技术规格说明

## 1. 产品概述

### 1.1 产品目标

构建一个基于浏览器的在线工具，用于将 Modrinth 的 `.mrpack` 整合包转换为标准 `.zip` 压缩包，让不支持 `.mrpack` 的 Minecraft 启动器或手动安装场景也能使用这些整合包。

转换逻辑应尽量在用户浏览器本地完成。用户上传的本地 `.mrpack` 文件不得上传到本产品服务器。

### 1.2 参考产品

参考网站：https://mrpackzip.com/

参考产品包含三个主要输入模式：

1. Modrinth Project ID / slug
2. 直接输入 `.mrpack` 下载 URL
3. 上传本地 `.mrpack` 文件

### 1.3 核心价值

- 无需安装桌面软件即可转换 `.mrpack`。
- 用户本地文件在浏览器内处理，不上传到本站服务器。
- 支持只有 Modrinth 项目 slug 或下载链接的用户。
- 根据 `modrinth.index.json` 中的文件列表下载依赖文件，并重新打包为完整 ZIP。
- 当部分文件下载失败时，生成清晰的失败清单，方便用户手动补齐。

## 2. 目标用户

| 用户类型 | 核心需求 |
| --- | --- |
| Minecraft 普通玩家 | 将 Modrinth 整合包转换成启动器可识别的 ZIP。 |
| 服务器服主 | 生成便于分发或手动安装的整合包 ZIP。 |
| 新手用户 | 不想手动阅读 `modrinth.index.json` 并逐个下载 mod。 |
| 多启动器用户 | 希望同一个整合包可以在不同启动器或环境中使用。 |

## 3. 产品范围

### 3.1 MVP 范围

MVP 必须包含：

- 上传本地 `.mrpack` 并转换。
- 输入 Modrinth Project ID / slug 并转换。
- 输入直接 `.mrpack` URL 并转换。
- 浏览器端解析 `.mrpack`。
- 浏览器端生成 ZIP。
- 下载 `modrinth.index.json` 中 `downloads[]` 指向的文件。
- 当文件无法下载时生成 `FAILED_DOWNLOADS.txt`。
- 展示转换进度和可操作的错误信息。
- 提供基础 SEO 落地页内容。

### 3.2 MVP 不包含

MVP 不包含：

- 用户账户。
- 云端文件存储。
- 服务端转换队列。
- 支付或订阅。
- 跨设备同步的转换历史。
- 批量转换。
- ZIP 转 MRPack。
- 后台管理系统。

## 4. 功能需求

### 4.1 输入模式：上传文件

用户可以上传本地 `.mrpack` 文件。

需求：

- 只接受以 `.mrpack` 结尾的文件。
- 展示已选择文件的名称和大小。
- 对非 `.mrpack` 文件给出明确错误提示。
- 使用浏览器 File API 读取文件。
- 不将用户文件上传到本产品服务器。

验收标准：

- 合法 `.mrpack` 文件可以被选择并成功转换。
- 非法扩展名文件在转换前被拒绝。
- 转换前用户可以看到已选择的文件名。

### 4.2 输入模式：Project ID / Slug

用户可以输入 Modrinth 项目的 ID 或 slug。

需求：

- 用户提交后，请求 Modrinth API 获取项目版本列表。
- 从版本文件列表中找到第一个 `.mrpack` 文件。
- 在浏览器中下载该 `.mrpack` 文件。
- 下载完成后进入标准转换流程。
- 对项目不存在、项目没有 `.mrpack` 文件、网络失败等情况展示明确错误。

必须调用的第三方 API：

```text
GET https://api.modrinth.com/v2/project/{id_or_slug}/version?include_changelog=false
```

说明：

- 公开读取不需要 API token。
- Modrinth API 支持浏览器 CORS。
- 当前公开限制约为每 IP 每分钟 300 次请求。
- 浏览器无法自定义 `User-Agent`。MVP 可以前端直连，后续如果需要更严格遵循官方建议，可增加后端代理并设置产品级 `User-Agent`。

验收标准：

- 输入有效 Modrinth slug 后，可以找到并下载 `.mrpack`。
- 输入无效 slug 时，展示项目不存在错误。
- 项目没有 `.mrpack` 文件时，展示明确的无可用整合包错误。

### 4.3 输入模式：直接 URL

用户可以粘贴直接的 `.mrpack` 下载链接。

需求：

- 从浏览器直接 `fetch` 用户输入的 URL。
- 校验下载内容是否能作为 `.mrpack` 解析。
- 下载成功后进入标准转换流程。
- 当 fetch 失败、CORS 阻止、文件无效时展示明确错误。

验收标准：

- 有效 `.mrpack` 直接链接可以成功转换。
- 无法访问的 URL 展示清晰错误。
- 非 `.mrpack` 或无效文件能够快速失败，并提示原因。

### 4.4 解析 MRPack

转换器必须在浏览器内解析 `.mrpack` 文件。

需求：

- 将 `.mrpack` 视为 ZIP 压缩包。
- 读取 `modrinth.index.json`。
- 如果缺少 `modrinth.index.json`，立即失败并提示。
- 解析以下元信息：
  - 包名
  - 版本或版本 ID
  - Minecraft 版本
  - 依赖信息
  - 文件数量
  - 文件路径
  - 下载 URL
  - hash 信息

验收标准：

- 缺少 `modrinth.index.json` 时返回明确的非法整合包错误。
- 转换过程中可以展示解析出的基础元信息。

### 4.5 复制 Overrides

转换器必须将 `.mrpack` 中的 override 文件写入输出 ZIP。

需求：

- 处理以下目录：
  - `overrides/`
  - `client-overrides/`
  - `server-overrides/`
- 写入输出 ZIP 时移除 override 前缀。
- 保留 override 目录下的嵌套路径。
- 跳过目录项，只写入文件项。

验收标准：

- `overrides/config/example.toml` 在输出 ZIP 中变为 `config/example.toml`。
- 目录项不会被当成普通文件写入。

### 4.6 下载引用的 Mod 文件

转换器必须下载 `modrinth.index.json.files[]` 中列出的文件。

需求：

- 遍历每个文件条目的 `downloads[]`。
- 逐个尝试 URL，直到有一个成功。
- 成功后，将下载内容按该条目的 `path` 写入 ZIP。
- 如果全部 URL 失败，记录失败路径和尝试过的 URL。
- 单个文件失败不应终止整个转换。

重要说明：

- 这一步需要访问第三方文件下载地址。
- 这不是结构化第三方 API 调用。
- URL 来自用户提供的 `.mrpack` 文件内容。

验收标准：

- 成功下载的文件会写入输出 ZIP。
- 单个文件下载失败不会导致整个转换失败。
- 下载失败信息会写入 `FAILED_DOWNLOADS.txt`。

### 4.7 生成 FAILED_DOWNLOADS.txt

如果存在下载失败的文件，转换器必须向输出 ZIP 中添加失败清单。

需求：

- 文件名：`FAILED_DOWNLOADS.txt`
- 包含每个失败文件的路径。
- 包含尝试过的 URL。
- 说明用户可能需要手动下载这些文件并放到正确目录。

验收标准：

- 当一个或多个 mod 文件下载失败时，输出 ZIP 包含 `FAILED_DOWNLOADS.txt`。
- 当全部文件下载成功时，不生成 `FAILED_DOWNLOADS.txt`。

### 4.8 生成 pack-info.json

输出 ZIP 应包含自动生成的 `pack-info.json`。

需求：

- 包含基础元信息：
  - name
  - version
  - game
  - dependencies
  - convertedBy
  - convertedAt

验收标准：

- 每次成功转换都包含 `pack-info.json`。
- `convertedAt` 使用 ISO 时间格式。

### 4.9 生成 ZIP

转换器必须在浏览器内生成最终 ZIP。

需求：

- 使用浏览器兼容的 ZIP 库，例如 JSZip。
- 使用 DEFLATE 压缩。
- 生成 Blob。
- 使用 `URL.createObjectURL()` 触发下载。
- 下载后及时释放 object URL。

验收标准：

- 用户可以下载生成的 ZIP。
- ZIP 可以被常见压缩工具正常打开。

## 5. 第三方 API 需求

### 5.1 必需 API

只有 Project ID / slug 模式必须调用第三方 API。

```text
GET https://api.modrinth.com/v2/project/{id_or_slug}/version?include_changelog=false
```

用途：

- 获取项目的所有版本。
- 找到版本文件中以 `.mrpack` 结尾的文件。
- 取得 `.mrpack` 下载 URL。

### 5.2 API 限制

Modrinth API 已知限制：

```text
300 requests / minute / IP
```

MVP 推荐行为：

- 只在用户点击提交时调用 API。
- 不要在用户每输入一个字符时调用 API。
- 在当前页面会话内缓存成功的项目查询结果。
- 添加 `include_changelog=false`，减少响应体积。

### 5.3 前端直连 API 与后端代理

MVP 推荐：前端浏览器直连 Modrinth API。

原因：

- 限流按用户 IP 分散，更能承受自然流量。
- 无需自建后端。
- API 支持浏览器跨域。

已知取舍：

- 浏览器无法设置自定义 `User-Agent`。

未来可选代理方案：

```text
前端 -> /api/modrinth/project/:slug/versions
后端 -> Modrinth API，并设置产品级 User-Agent 和缓存
```

以下情况再考虑代理：

- 部分用户无法直接访问 Modrinth API。
- 产品需要集中缓存热门项目。
- 产品需要更强的监控和错误治理。
- 官方 API 使用规范要求更明确的可识别 `User-Agent`。

## 6. 非 API 网络请求

这些请求对于完整转换可能是必需的，但它们不是结构化 API 调用。

| 网络请求 | 来源 | 用途 |
| --- | --- | --- |
| `.mrpack` 下载 URL | 用户输入或 Modrinth API 返回 | 下载源整合包。 |
| `files[].downloads[]` URL | `modrinth.index.json` | 下载 mod jar 或资源文件。 |
| CDN 脚本 | 产品前端 | 加载前端库，若未本地打包。 |
| Analytics | 可选 | 访问统计。 |
| Ads | 可选 | 广告变现。 |

MVP 推荐：

- 核心转换依赖应尽量随应用构建一起打包，不依赖运行时第三方 CDN。
- 统计和广告不是 MVP 必需功能。

## 7. 转换数据流

### 7.1 上传文件流程

```text
用户选择 .mrpack
-> File API 读取 ArrayBuffer
-> JSZip 加载压缩包
-> 读取 modrinth.index.json
-> 复制 overrides
-> 下载引用文件
-> 如有失败，添加 FAILED_DOWNLOADS.txt
-> 添加 pack-info.json
-> 生成 ZIP Blob
-> 下载 ZIP
```

### 7.2 Project ID 流程

```text
用户输入 project ID 或 slug
-> 请求 Modrinth 项目版本列表
-> 找到第一个 .mrpack 文件
-> 下载 .mrpack
-> 进入标准转换流程
```

### 7.3 直接 URL 流程

```text
用户输入 .mrpack URL
-> fetch 该 URL
-> 读取 ArrayBuffer
-> 进入标准转换流程
```

## 8. UI 需求

### 8.1 主页面

主页面应包含：

- 顶部导航
- Hero 首屏
- 转换器卡片
- `.mrpack` 说明
- 转换步骤说明
- 启动器兼容性内容
- FAQ
- 页脚链接

### 8.2 转换器卡片

转换器卡片必须包含三个 Tab：

1. Project ID
2. From URL
3. Upload File

每个 Tab 都应该只有一个清晰的主操作。

### 8.3 状态设计

转换器必须支持以下状态：

| 状态 | 含义 |
| --- | --- |
| idle | 等待输入。 |
| fetching | 获取项目信息或远程 `.mrpack`。 |
| reading | 读取本地文件或已下载文件。 |
| extracting | 解析 `.mrpack`。 |
| downloading | 下载引用的 mod 文件。 |
| packaging | 生成 ZIP。 |
| done | ZIP 已生成。 |
| error | 转换失败。 |

### 8.4 进度展示

进度 UI 应展示：

- 当前步骤
- 百分比
- 下载 mod 时显示当前文件名
- 可用时展示已处理文件数量
- 最终成功或警告信息

## 9. 错误处理

产品必须快速失败，并给出具体错误。

| 错误场景 | 用户提示 |
| --- | --- |
| 上传非 `.mrpack` 文件 | 请选择有效的 `.mrpack` 文件。 |
| 缺少 `modrinth.index.json` | 无效 `.mrpack`：缺少 `modrinth.index.json`。 |
| JSON 无法解析 | 无效 `modrinth.index.json`：无法解析文件。 |
| 项目不存在 | 项目不存在，请检查 ID 或 slug 后重试。 |
| 项目没有 `.mrpack` | 该项目没有找到 `.mrpack` 文件。 |
| 直接 URL 下载失败 | 下载 `.mrpack` 文件失败，请检查 URL 后重试。 |
| CORS 阻止下载 | 浏览器安全策略阻止了该下载，请尝试其他来源或手动下载。 |
| ZIP 生成失败 | 生成 ZIP 失败，请尝试较小的整合包或关闭其他浏览器标签页。 |

实现规则：

- 不允许静默吞掉错误。
- 单个 mod 下载失败时，应记录到 `FAILED_DOWNLOADS.txt`。
- 整个包无法解析或无法打包时，应展示阻塞错误。

## 10. 安全需求

### 10.1 路径安全

写入 ZIP 前必须校验 `.mrpack` 中的所有路径。

拒绝或净化以下路径：

- 包含 `..`
- 以 `/` 开头
- 以 `\` 开头
- 包含 Windows 盘符前缀，例如 `C:`
- 包含空字节
- trim 后为空

验收标准：

- 恶意 `path` 不能生成危险的压缩包路径。
- 不安全条目应被跳过，并写入 `FAILED_DOWNLOADS.txt` 或专门的警告文件。

### 10.2 下载 URL 安全

MVP 行为：

- 尝试 `downloads[]` 中列出的 URL。
- 不执行下载内容。
- 所有下载内容都按二进制文件处理。

未来增强：

- 允许只从 Modrinth CDN 等已知域名下载。
- 当下载来源是未知域名时给用户提示。

### 10.3 Hash 校验

推荐 MVP+ 支持：

- 如果 `hashes` 存在，尽量使用 Web Crypto 校验下载文件。
- 如果条目中包含 SHA-1 或 SHA-512，应支持对应校验。

如果 MVP 不做 hash 校验，UI 和文案不得宣称“已验证下载完整性”。

## 11. 性能需求

浏览器应能流畅处理常见整合包。

需求：

- 长任务期间展示进度。
- 避免重复 API 请求。
- 单次转换中避免重复下载同一个 URL。
- 并发下载数量限制在较小范围，例如 4-6。
- 提示超大整合包会受浏览器内存限制。

已知限制：

- JSZip 会带来较高内存压力，因为源文件、下载文件和最终 ZIP 都可能同时存在于浏览器内存中。

未来优化：

- 使用 Web Worker 生成 ZIP，避免主线程卡顿。
- 研究更适合大文件的流式 ZIP 生成方案。

## 12. SEO 需求

MVP 应包含基础 SEO 页面和元信息。

首页需求：

- Title 聚焦 `MRPack to ZIP Converter`。
- Meta description 说明免费、浏览器端转换。
- Canonical URL。
- Open Graph 信息。
- SoftwareApplication JSON-LD。
- FAQ 内容。
- 预留 Blog 内容结构。

推荐页面：

- `/`
- `/zip-to-mrpack` 占位页或未来页面
- `/blog`
- `/about`
- `/privacy`
- `/terms`
- `/contact`

## 13. 统计与变现

统计和广告不是 MVP 必需功能。

如果接入：

- 不得追踪上传文件内容。
- 不得为了统计上传 `.mrpack` 内容。
- 需要明确说明页面可能加载第三方脚本。

可选服务：

- Google Analytics
- Google AdSense
- 其他广告网络

## 14. MVP 验收清单

满足以下条件时，MVP 可视为完成：

- 本地上传模式可以将合法 `.mrpack` 转换为 ZIP。
- Project ID 模式可以通过 Modrinth API 获取版本并转换找到的 `.mrpack`。
- 直接 URL 模式可以下载并转换有效 `.mrpack`。
- `overrides/` 文件被写入输出 ZIP。
- 可访问的引用 mod 文件被下载并写入输出 ZIP。
- 下载失败文件被记录到 `FAILED_DOWNLOADS.txt`。
- 应用展示 fetching、reading、extracting、downloading、packaging 等进度。
- 错误信息具体且可操作。
- 用户上传的本地 `.mrpack` 不会发送到本产品服务器。
- 用户输入过程中不会每个字符都触发 API 请求。
- 写入 ZIP 前会校验路径安全。

## 15. 建议技术架构

### 15.1 前端技术栈

推荐技术栈：

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui，可在合适场景使用
- JSZip 或同类 ZIP 库

### 15.2 建议模块边界

使用职责清晰的小模块。

```text
src/lib/modrinth-api.ts
  - fetchProjectVersions(projectIdOrSlug)
  - findMrpackFile(versions)

src/lib/mrpack-parser.ts
  - loadMrpack(arrayBuffer)
  - readModrinthIndex(zip)
  - collectOverrideFiles(zip)

src/lib/path-safety.ts
  - validateArchivePath(path)
  - normalizeOverridePath(path, prefix)

src/lib/downloader.ts
  - downloadFirstAvailableUrl(urls)
  - downloadReferencedFiles(files)

src/lib/zip-builder.ts
  - createOutputZip()
  - addOverrideFiles()
  - addDownloadedFiles()
  - addFailedDownloadsFile()
  - generateZipBlob()

src/components/converter/
  - ConverterCard
  - ProjectIdTab
  - UrlTab
  - UploadFileTab
  - ProgressPanel
  - ResultPanel
  - ErrorPanel
```

规则：

- 转换逻辑不要写在 React 组件里。
- 组件负责 UI 状态调度，不负责 ZIP 内部解析细节。
- 每个函数只做一件清楚的事。
- 不要 catch 自己无法处理的异常；如果 catch，必须补充有价值的上下文或完成明确恢复。

## 16. 待确认决策

实现前建议确认：

1. Hash 校验放在 MVP 还是 V1.1。
2. 是否现在增加后端代理，还是等前端直连出现问题后再加。
3. MVP 是否接入广告或统计。
4. ZIP to MRPack 是隐藏、标记 coming soon，还是完全不出现在导航中。
5. 未知下载域名是静默允许，还是给出提示。

推荐默认值：

- Hash 校验：放到 V1.1，除非时间充足。
- 后端代理：MVP 不做。
- 广告/统计：MVP 不做，除非发布时必须变现。
- ZIP to MRPack：MVP 不在导航中展示，直到功能完成。
- 未知域名：MVP 允许下载，但下载失败要清晰记录。
