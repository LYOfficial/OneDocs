![OneDocs](https://socialify.git.ci/LYOfficial/OneDocs/image?description=1&font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Fgithub.com%2FLYOfficial%2FOneDocs%2Fblob%2Fmain%2Fsrc-tauri%2Ficons%2Ficon.png%3Fraw%3Dtrue&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)

<p align="center">
    <a href="./README.md">中文简体</a> | <a href="./README_EN.md">English</a>
</p>

# OneDocs

> A Single Text, All is Known.
>
> 一文亦闻，一款文档智慧分析工具。

阁下若对此项目有所青睐，还请移步右上点亮星标，不胜感谢。

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white&labelColor=24C8DB)](https://tauri.app/) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Markdown Badge](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white&style=for-the-badge) ![LaTeX Badge](https://img.shields.io/badge/LaTeX-008080?logo=latex&logoColor=white&style=for-the-badge)

**文章千卷，一览而知。智慧之器，助君析文明理。**

## 📖 项目简介

OneDocs（一文亦闻）是一款基于 AI 的智能文档分析工具，结合文件解析、大模型应用和输出格式规范化，对用户上传的 PDF 文档进行解构分析，去除无用内容，整理成知识手册。

- 支持 **PDF** 文档格式，最大 30 MB
- 支持 **40+ 模型**选择（OpenAI / Anthropic / Gemini / 智谱 / DeepSeek / Ollama 等）
- 支持 **Windows / macOS / Linux / Android** 跨平台使用
- 本地运行，无文件上传，不会造成文件和 API Key 泄露
- 已适配手机版 UI（768px 以下自动切换移动端布局）

> 📚 更多使用说明请阅读 [OneDocs Wiki](https://github.com/LYOfficial/OneDocs/wiki)

## ✨ 功能介绍

| 功能 | 说明 |
|------|------|
| **要闻概览** | 新闻要点梳理 |
| **罗森析数** | 数据内容分析 |
| **理工速知** | 理工课件整理 |
| **文采丰呈** | 文科课件整理 |

分析结果支持预览、复制 Markdown 源码、导出下载，亦可多文件合并分析。

## 🖼️ 软件截图

<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p1.png?raw=true" alt="OneDocs" height="300"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p2.png?raw=true" alt="OneDocs" height="300"/>
<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p3.png?raw=true" alt="OneDocs" height="300"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p4.png?raw=true" alt="OneDocs" height="300"/>

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 桌面端 | Tauri v2（Rust） |
| 移动端 | Tauri v2 Android（APK） |
| 构建工具 | Vite 7 |
| 状态管理 | Zustand 5 |
| PDF 解析 | pdfjs-dist v5 + lopdf |
| 渲染 | marked（Markdown）+ KaTeX（LaTeX） |
| 国际化 | i18next + react-i18next |

## 🚀 开发与构建

### 环境要求

- Node.js（推荐 LTS）+ npm
- Rust + Tauri CLI（桌面端必须）
- Android SDK + NDK（仅 Android 构建需要）

### Tauri 版本说明（重要）

请固定使用当前仓库已验证的版本组合，使用**精确版本**（不要使用 `^`）：

| 包 | npm 版本 | Rust 版本 |
|----|---------|----------|
| api / cli | `2.6.0` | — |
| tauri / tauri-build | — | `=2.6.0` |
| tauri-runtime | — | `=2.9.2` |
| plugin-dialog | `2.3.0` | `=2.3.0` |
| plugin-fs | `2.4.0` | `=2.4.0` |
| plugin-shell | `2.3.0` | `=2.3.0` |

如需升级 Tauri，请保持 npm 与 Rust 端同一代版本并重新验证。

### 桌面端

```bash
npm install
npm run dev          # Web 前端开发
npm run tauri:dev    # Tauri 桌面端开发

# 构建发行版
npm run tauri:build                    # NSIS + MSI
npx tauri build --bundles nsis         # 仅 NSIS（推荐）
```

构建产物位于 `src-tauri/target/release/bundle/`。

### Android APK

参照 [Tauri 官方文档](https://v2.tauri.org.cn/distribute/google-play/#build-apks)，本地构建 APK 只需配置 Android SDK/NDK 环境变量，无需安装 Android Studio。

**1. 安装 JDK 17**

> ⚠️ **必须使用 JDK 17**。项目使用的 Gradle 8.9 不支持 Java 21+（如 Java 26 会导致 `Unsupported class file major version 70` 错误）。

从 [Adoptium（Eclipse Temurin）](https://adoptium.net/) 下载 JDK 17：

```powershell
# Windows PowerShell — 下载并安装 JDK 17（Adoptium Temurin）
Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse" -OutFile "$env:TEMP\jdk17.msi"
Start-Process -Wait -FilePath "$env:TEMP\jdk17.msi"
```

或手动下载：<https://adoptium.net/temurin/releases/?version=17&os=windows&arch=x64>

安装完成后，设置 `JAVA_HOME` 环境变量：

```powershell
# 临时设置（仅当前终端生效）
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"

# 永久设置（写入系统环境变量，重启终端后生效）
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'Machine')
```

> 💡 如果你已安装 Android Studio，也可使用其内置 JBR：`$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`

**2. 设置环境变量**

```powershell
# Windows 示例
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"  # JDK 17 路径
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\27.0.12077973"
```

**3. 添加 Rust Android 目标**

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

**3. 初始化并构建**

```bash
npm run android:init          # 初始化 Android 项目（仅需一次）
npm run android:dev           # 开发模式
npm run android:build         # 构建 APK（通用）
npm run android:build:split   # 按架构拆分（体积更小）
```

构建产物位于 `src-tauri/gen/android/app/build/outputs/apk/`。

> ⚠️ 首次构建需下载 Gradle 依赖和编译 Rust 交叉目标，耗时较长。建议使用 `--target aarch64` 仅构建 ARM64 以加快速度。

### 重置开发状态

```js
// DevTools Console 中执行
localStorage.removeItem('onedocs-storage')  // 重置引导
localStorage.clear()                         // 清除所有状态
```

## 📦 CI/CD

项目使用 GitHub Actions 自动构建发行版（桌面端 + Android APK），配置见 `.github/workflows/release.yml`。

推送 `v*` 标签或手动触发 workflow 即可构建并发布到 GitHub Releases。

## 🤝 贡献指南

欢迎通过 [Pull Request](https://github.com/LYOfficial/OneDocs/pulls) 或 [GitHub Issues](https://github.com/LYOfficial/OneDocs/issues) 参与贡献。

- 提交 PR 时请包含：变更摘要、验证步骤、UI 变更截图或录屏
- Commit 信息请保持简明，可使用 `feat:` / `fix:` / `docs:` 等前缀

## 📄 版权声明

版权所有 © 2024-2026 LYOfficial。本项目基于 [GNU 通用公共许可证 v3.0](https://github.com/LYOfficial/OneDocs/blob/main/LICENSE) 发布。

## 🙏 鸣谢

- [Tauri](https://github.com/tauri-apps/tauri) — 跨平台应用框架
- [lopdf](https://github.com/J-F-Liu/lopdf) — Rust PDF 处理库
- [pdfjs-dist](https://github.com/nicbarker/pdfjs-dist) — PDF 文本解析
- [React](https://github.com/facebook/react) — 用户界面构建库
- [marked](https://github.com/markedjs/marked) — Markdown 解析器
- [KaTeX](https://github.com/KaTeX/KaTeX) — LaTeX 数学公式渲染
- [Zustand](https://github.com/pmndrs/zustand) — 轻量状态管理
- [i18next](https://github.com/i18next/i18next) — 国际化框架

> 糖方科技提供苹果软件签名

![candyrectangle](https://github.com/LYOfficial/OneDocs/blob/f4bbdea5317f82ac7f734599fc54346ea4b85e1b/candyrectangle.png)

## 👥 作者

- [@LYOfficial](https://github.com/LYOfficial/) — 主要开发，项目主管
- [@JHL-HK](https://github.com/JHL-HK) — 部分重构，图床提供

## ⭐ Star 里程图

[![Star History Chart](https://api.star-history.com/svg?repos=LYOfficial/OneDocs&type=date&legend=top-left)](https://www.star-history.com/#LYOfficial/OneDocs&type=date&legend=top-left)