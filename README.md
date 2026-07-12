# MRPack To ZIP

一个基于 Next.js 的 Minecraft 模组包在线转换工具，支持 **MRPack 转 ZIP**，并提供 **CurseForge ZIP 转 MRPack** 的反向转换功能。

在线使用：[https://mrpacktozip.pro](https://mrpacktozip.pro)

## 当前状态

项目的核心转换功能已经实现，不是单纯的前端页面原型。

当前支持两种转换方向：

### MRPack 转 ZIP

支持以下三种输入方式：

- 输入 Modrinth 项目 ID 或 Slug
- 输入 `.mrpack` 文件下载链接
- 直接上传本地 `.mrpack` 文件

转换过程会读取 `modrinth.index.json`，收集模组包中的 override 文件，下载索引引用的远程文件，并在浏览器中生成可下载的 ZIP 文件。

###