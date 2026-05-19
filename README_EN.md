![OneDocs](https://socialify.git.ci/LYOfficial/OneDocs/image?description=1&font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Fgithub.com%2FLYOfficial%2FOneDocs%2Fblob%2Fmain%2Fsrc-tauri%2Ficons%2Ficon.png%3Fraw%3Dtrue&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)

<p align="center">
    <a href="./README.md">中文简体</a> | <a href="./README_EN.md">English</a>
</p>




# OneDocs

> A Single Text, All is Known.
>
> OneDocs, an intelligent document analysis tool.

If you find this project useful, please **give it a star** in the top right corner. Your support is greatly appreciated.

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white&labelColor=24C8DB)](https://tauri.app/) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Markdown Badge](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white&style=for-the-badge) ![LaTeX Badge](https://img.shields.io/badge/LaTeX-008080?logo=latex&logoColor=white&style=for-the-badge)

**Thousands of articles, known at a glance. A tool of wisdom to help you analyze and understand.**

OneDocs gathers the power of intelligent prompts to help you quickly grasp the essence of documents. Whether it's news summaries, data analysis, or academic key points, everything becomes clear with just one click.

## Introduction

In today's data era, we need to read and analyze various documents in every industry: daily news reports, data spreadsheets in work scenarios, courseware documents in study life... These documents contain **both essence and dross**. Reading and screening manually **takes up a lot of time**. Is there a tool that can **filter out useless content** and **organize and analyze the essence** like a top student's notes for our reading and learning?

So I created this AI tool, **OneDocs**, and gave it a nice Chinese name "Yi Wen Yi Wen" (一文亦闻). Combining file analysis, large model applications, and output format standardization, it deconstructs and analyzes files uploaded by users, removes useless content, and organizes them into knowledge handbooks. I hope users can understand the essence of things, learn, and progress through simple documents with the power of large models.

Currently, the software supports **PDF** document format, supports **40+ models**, and supports **Windows/macOS/Linux cross-platform** use, basically meeting the needs of various users. Moreover, the software is for local download and use, with no file uploads, so it will not cause file and API Key leaks.

The software has four main functions:

- **News Overview** - Summary of news highlights
- **Data Analysis** - Analysis of data content
- **STEM Quick Know** - Organization of STEM courseware
- **Liberal Arts Richness** - Organization of Liberal Arts courseware

The analyzed results can be previewed, Markdown source code copied, and exported for download. It also supports analyzing multiple files simultaneously for merged downloads.

## Screenshots

<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p1.png?raw=true" alt="OneDocs" height="320"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p2.png?raw=true" alt="OneDocs" height="320"/>
<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p3.png?raw=true" alt="OneDocs" height="320"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p4.png?raw=true" alt="OneDocs" height="320"/>
<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p5.png?raw=true" alt="OneDocs" height="320"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p6.png?raw=true" alt="OneDocs" height="320"/>


## Usage

**1 Download the Release**

Find the latest version on the project release page: https://github.com/LYOfficial/OneDocs/releases/latest

Find the software suitable for your system and download it.

**2 Launch**

After launching the software, click "Start with One Text" (始于一文) to enter the function page.

**3 Fill in API KEY**

Click the gear icon "Settings" in the upper right corner, fill in the API Base URL and OpenAI API Key. The default API Base URL is the official OpenAI address. If you have a third-party API service address, please replace it.

After filling in, select the appropriate model for subsequent analysis operations.

> Currently, only some models are supported. More model interfaces will be provided in the future.

**4 Upload and Analyze**

Click the "Click to Select Document" box to upload documents, and select the appropriate function on the left according to your analysis needs.

After uploading and selecting the function, click the "Start Analysis" (开始析文) button to analyze.

**5 Post-processing**

The software comes with Markdown and LaTeX format rendering. If there is a rendering error, you can copy the Markdown format text completely to an external viewer for viewing, or click the "Export" button to export a PDF file.

For more detailed instructions, please read the Wiki: [OneDocs Wiki](https://github.com/LYOfficial/OneDocs/wiki)

## Development

To participate in the development and deployment of this project, please clone this repository first:

```bash
git clone https://github.com/LYOfficial/OneDocs.git
```

### Requirements

- Node.js (LTS recommended) + npm
- Rust + Tauri CLI (required for desktop builds)
- macOS users can install Rust here: https://rust-lang.org/tools/install

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Tauri Version Notes (Important)

In some mirrored registry environments (such as `ustc`), available Tauri Rust crate versions may lag behind the latest npm packages.
To avoid `tauri-runtime` / `tauri-runtime-wry` conflicts, keep the currently validated version set and use **exact versions** (do not use `^`):

- npm:
  - `@tauri-apps/api = 2.6.0`
  - `@tauri-apps/cli = 2.6.0`
  - `@tauri-apps/plugin-dialog = 2.3.0`
  - `@tauri-apps/plugin-fs = 2.4.0`
  - `@tauri-apps/plugin-shell = 2.3.0`
- Rust (`src-tauri/Cargo.toml`):
  - `tauri = =2.6.0`
  - `tauri-build = =2.6.0`
  - `tauri-runtime = =2.9.2`
  - `tauri-plugin-dialog = =2.3.0`
  - `tauri-plugin-fs = =2.4.0`
  - `tauri-plugin-shell = =2.3.0`

If you upgrade Tauri, keep npm and Rust sides on the same generation and re-verify with `npm run tauri:dev`.

### Run and Build

```bash
npm install

# Web (Vite)
npm run dev

# Desktop (Tauri)
npm run tauri:dev
```

Build releases:

```bash
# Web only
npm run build

# All desktop installers (NSIS + MSI)
npm run tauri:build

# NSIS installer only (recommended, faster)
npx tauri build --bundles nsis

# MSI installer only
npx tauri build --bundles msi
```

> ⚠️ `npm run tauri:build` builds both NSIS and MSI. MSI depends on the WiX toolset download, which can be slow or hang. If you only need the NSIS installer, use `npx tauri build --bundles nsis`.

Build outputs are located in `src-tauri/target/release/bundle/`:

| Format | Path |
|--------|------|
| NSIS | `nsis/onedocs_{version}_x64-setup.exe` |
| MSI | `msi/onedocs_{version}_x64_en-US.msi` |
### Android Build

OneDocs supports building Android APK for mobile use.

#### Prerequisites

1. **Install Android Studio**: Download from [Android Developers](https://developer.android.com/studio)
2. **Set environment variables** (Windows example):

```powershell
# JAVA_HOME points to Android Studio's bundled JBR
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# ANDROID_HOME points to the SDK directory
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# NDK_HOME points to the NDK directory (adjust version as needed)
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\27.0.12077973"
```

3. **Install Android SDK components** via Android Studio SDK Manager:
   - Android SDK Platform 34
   - Android SDK Platform-Tools
   - NDK (Side by side)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

4. **Add Rust Android targets**:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

#### Initialize & Build

```bash
# Initialize Android project (only needed once)
npm run android:init

# Run in dev mode
npm run android:dev

# Build APK (universal, all architectures)
npm run android:build

# Build APK (split per ABI, smaller size)
npm run android:build:split

# Build for a specific architecture only
npx tauri android build -- --apk --target aarch64
```

Build outputs are located in `src-tauri/gen/android/app/build/outputs/apk/`:

| Type | Path |
|------|------|
| Universal APK | `universal/release/app-universal-release-unsigned.apk` |
| ARM64 | `arm64-v8a/release/app-arm64-v8a-release-unsigned.apk` |
| ARMv7 | `armeabi-v7a/release/app-armeabi-v7a-release-unsigned.apk` |

> ⚠️ The first build downloads Gradle dependencies and compiles Rust cross targets, which takes a while. Use `--target aarch64` to build ARM64 only for faster iteration.

#### Signing the APK

The generated APK is unsigned by default. To install it on a device, you need to sign it:

```bash
# Sign with debug key
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ~/.android/debug.keystore -storepass android \
  app-universal-release-unsigned.apk androiddebugkey

# Or use apksigner (recommended)
$ANDROID_HOME/build-tools/34.0.0/apksigner sign \
  --ks ~/.android/debug.keystore --ks-pass pass:android \
  --out app-release.apk app-universal-release-unsigned.apk
```

For production release, create your own signing key and configure `src-tauri/gen/android/key.properties`.
### Reset Development State

The app uses `localStorage` to persist user settings and onboarding state. To reset during development (e.g., to re-trigger the first-launch onboarding tour), run the following in DevTools (F12) Console:

```js
// Reset onboarding state to re-trigger the first-launch tour
localStorage.removeItem('onedocs-storage')
```

Then press **Ctrl+R** to refresh the page. To clear all app state entirely, use `localStorage.clear()`.

### Project Structure (Core)

- src/: React + TypeScript front end
  - components/: reusable UI (upload, results, model selection, settings, mobile navigation)
  - pages/: page entry points (Landing / Analysis / AnalysisResult / Settings)
  - hooks/: business hooks (analysis workflow)
  - services/: API + Tauri wrappers
  - store/: global state (Zustand + persist)
  - utils/: document parsing, Markdown/LaTeX rendering
  - config/: providers, prompt configs, function metadata
  - i18n/: localization resources
  - styles/: global and component styles (including mobile responsive)
- src-tauri/: Tauri desktop & mobile shell (Rust)
  - src/main.rs: Tauri entry + command registration
  - src/lib.rs: request forwarding + API calls
  - gen/android/: Android build project (generated by `tauri android init`)
- docs/: software documentation and user guide
- web/: static site assets
- dist/: build output (generated)

### Data Flow

1. User picks files and a function (FunctionSelector / FileUpload)
2. DocumentProcessor extracts plain text
3. useAnalysis builds prompts and calls APIService
4. APIService invokes Rust through Tauri
5. Rust uses reqwest to call the model API and returns the result
6. Zustand stores results, ResultDisplay renders/export/copies

### Functions and Prompts

Prompt configs live in config/prompts/index.ts and map to four modes:

- News Overview (news)
- Data Analysis (data)
- STEM Quick Know (science, optional format review)
- Liberal Arts Richness (liberal)

### Models and Providers (Built-in)

Provider configuration is in config/providers.ts and supports hosted APIs and local servers:

- OneDocs: Qwen2.5-7B, Qwen3-8B, GLM-4-9B, GLM-Z1-9B 0414, GLM-4.1V-9B Thinking, GLM-4-9B 0414, DeepSeek-R1 Qwen3-8B, GLM-4-Flash
- OpenAI: gpt-4o, gpt-4o-mini, gpt-4, gpt-3.5-turbo
- Anthropic: Claude 3.5 Sonnet/Haiku, Claude 3 Opus/Sonnet
- Google Gemini: gemini-3-pro, 2.5-pro, 2.5-flash, 1.5-pro, 1.5-flash
- Moonshot: moonshot-v1-8k/32k/128k
- Zhipu GLM: glm-4-flash/flashx/plus/0520/long/4v-plus
- DeepSeek: deepseek-chat, deepseek-reasoner
- Ollama (local): llama3.2, qwen2.5, gemma2, mistral
- LM Studio (local): local-model
- Compatible platforms: CompShare, 302.AI, TokenPony, SiliconFlow, Xinghe, PPIO, ModelScope, OneAPI

> You can also add a custom provider and custom model name in Settings.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Desktop | Tauri v2 (Rust) |
| Mobile | Tauri v2 Android (APK) |
| Build Tool | Vite 7 |
| State Management | Zustand 5 |
| PDF Parsing | pdfjs-dist v5 (frontend text extraction) + lopdf (Rust image extraction) |
| Rendering | marked (Markdown) + KaTeX (LaTeX) |
| i18n | i18next + react-i18next |

### Document Parsing and Limits

- Supported: PDF
- Max file size: 30 MB (FILE_SIZE_LIMIT)
- Parsing in utils/documentProcessor.ts (pdfjs), image extraction in Rust (lopdf)
- Mobile: Responsive UI adapted for screens under 768px; supports building Android APK

## Contributing

We warmly welcome contributions from every developer!

- Before starting, make sure you've read the [Development](#development) section for requirements and version notes.
- Feel free to share your ideas and improvements via [Pull Request](https://github.com/LYOfficial/OneDocs/pulls) or [GitHub Issues](https://github.com/LYOfficial/OneDocs/issues).
- When submitting a PR, please include: a summary of changes, verification steps, and screenshots or recordings for UI changes.
- Keep commit messages concise; you may use prefixes like `feat:` / `fix:` / `docs:`.

## License

Copyright © 2024-2026 LYOfficial.

This project is licensed under the [GNU General Public License v3.0](https://github.com/LYOfficial/OneDocs/blob/main/LICENSE).

## Acknowledgments

We sincerely thank the following open-source projects — OneDocs would not be possible without them:

- [Tauri](https://github.com/tauri-apps/tauri) — Cross-platform desktop application framework
- [lopdf](https://github.com/J-F-Liu/lopdf) — Rust PDF processing library for image extraction
- [pdfjs-dist](https://github.com/nicbarker/pdfjs-dist) — PDF text parsing
- [React](https://github.com/facebook/react) — UI building library
- [marked](https://github.com/markedjs/marked) — Markdown parser
- [KaTeX](https://github.com/KaTeX/KaTeX) — LaTeX math formula rendering
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [i18next](https://github.com/i18next/i18next) — Internationalization framework

## Contact

- Email: coldregion@qq.com
- GitHub Issues: [Submit an issue](https://github.com/LYOfficial/OneDocs/issues)
- Wiki: [OneDocs Wiki](https://github.com/LYOfficial/OneDocs/wiki)

### Environment Variables (Optional)

To provide managed OneDocs credentials, set:

- VITE_ONEDOCS_API_URL
- VITE_ONEDOCS_API_KEY

## Authors

- [@LYOfficial ](https://github.com/LYOfficial/) Lead Developer, Project Manager.
- [@JHL-HK](https://github.com/JHL-HK)  Partial Refactoring, Image Hosting Provider.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LYOfficial/OneDocs&type=date&legend=top-left)](https://www.star-history.com/#LYOfficial/OneDocs&type=date&legend=top-left)
