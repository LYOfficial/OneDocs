![OneDocs](https://socialify.git.ci/LYOfficial/OneDocs/image?description=1&font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Fgithub.com%2FLYOfficial%2FOneDocs%2Fblob%2Fmain%2Fsrc-tauri%2Ficons%2Ficon.png%3Fraw%3Dtrue&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)

<p align="center">
    <a href="./README.md">中文简体</a> | <a href="./README_EN.md">English</a>
</p>

# OneDocs

> A Single Text, All is Known.
>
> OneDocs, an intelligent document analysis tool.

If you find this project useful, please give it a star in the top right corner.

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white&labelColor=24C8DB)](https://tauri.app/) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Markdown Badge](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white&style=for-the-badge) ![LaTeX Badge](https://img.shields.io/badge/LaTeX-008080?logo=latex&logoColor=white&style=for-the-badge)

**Thousands of articles, known at a glance. A tool of wisdom to help you analyze and understand.**

## 📖 Introduction

OneDocs is an AI-powered intelligent document analysis tool that combines file parsing, large model applications, and output format standardization to deconstruct and analyze uploaded PDF documents, removing useless content and organizing them into knowledge handbooks.

- Supports **PDF** format, max 30 MB per file
- Supports **40+ models** (OpenAI / Anthropic / Gemini / Zhipu / DeepSeek / Ollama, etc.)
- Cross-platform: **Windows / macOS / Linux / Android**
- Runs locally — no file uploads, no API Key leaks
- Mobile-responsive UI (auto-switches layout below 768px)

> 📚 For detailed usage instructions, see [OneDocs Wiki](https://github.com/LYOfficial/OneDocs/wiki)

## ✨ Features

| Feature | Description |
|---------|-------------|
| **News Overview** | Summary of news highlights |
| **Data Analysis** | Analysis of data content |
| **STEM Quick Know** | Organization of STEM courseware |
| **Liberal Arts Richness** | Organization of Liberal Arts courseware |

Results can be previewed, Markdown source copied, and exported. Multi-file merge analysis is also supported.

## 🖼️ Screenshots

<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p1.png?raw=true" alt="OneDocs" height="300"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p2.png?raw=true" alt="OneDocs" height="300"/>
<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p3.png?raw=true" alt="OneDocs" height="300"/><img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p4.png?raw=true" alt="OneDocs" height="300"/>

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Desktop | Tauri v2 (Rust) |
| Mobile | Tauri v2 Android (APK) |
| Build Tool | Vite 7 |
| State Management | Zustand 5 |
| PDF Parsing | pdfjs-dist v5 + lopdf |
| Rendering | marked (Markdown) + KaTeX (LaTeX) |
| i18n | i18next + react-i18next |

## 🚀 Development & Build

### Requirements

- Node.js (LTS recommended) + npm
- Rust + Tauri CLI (required for desktop)
- Android SDK + NDK (only for Android builds)

### Tauri Version Notes (Important)

Use the exact versions validated in this repo (do not use `^`):

| Package | npm Version | Rust Version |
|---------|------------|--------------|
| api / cli | `2.6.0` | — |
| tauri / tauri-build | — | `=2.6.0` |
| tauri-runtime | — | `=2.9.2` |
| plugin-dialog | `2.3.0` | `=2.3.0` |
| plugin-fs | `2.4.0` | `=2.4.0` |
| plugin-shell | `2.3.0` | `=2.3.0` |

When upgrading Tauri, keep npm and Rust on the same generation and re-verify.

### Desktop

```bash
npm install
npm run dev          # Web frontend dev
npm run tauri:dev    # Tauri desktop dev

# Build releases
npm run tauri:build                    # NSIS + MSI
npx tauri build --bundles nsis         # NSIS only (recommended)
```

Build outputs are in `src-tauri/target/release/bundle/`.

### Android APK

Per the [Tauri docs](https://v2.tauri.org.cn/distribute/google-play/#build-apks), building an APK locally only requires Android SDK/NDK environment variables — no Android Studio needed.

**1. Set environment variables**

```powershell
# Windows example
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"   # or any JDK 17+
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\27.0.12077973"
```

**2. Add Rust Android targets**

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

**3. Initialize and build**

```bash
npm run android:init          # Initialize Android project (once only)
npm run android:dev           # Dev mode
npm run android:build         # Build APK (universal)
npm run android:build:split   # Split per ABI (smaller size)
```

Build outputs are in `src-tauri/gen/android/app/build/outputs/apk/`.

> ⚠️ The first build downloads Gradle dependencies and compiles Rust cross targets, which takes a while. Use `--target aarch64` to build ARM64 only for faster iteration.

### Reset Dev State

```js
// Run in DevTools Console
localStorage.removeItem('onedocs-storage')  // Reset onboarding
localStorage.clear()                         // Clear all state
```

## 📦 CI/CD

GitHub Actions automatically builds releases (desktop + Android APK). See `.github/workflows/release.yml`.

Push a `v*` tag or manually trigger the workflow to build and publish to GitHub Releases.

## 🤝 Contributing

Contributions are welcome via [Pull Request](https://github.com/LYOfficial/OneDocs/pulls) or [GitHub Issues](https://github.com/LYOfficial/OneDocs/issues).

- PRs should include: summary of changes, verification steps, screenshots/recordings for UI changes
- Keep commit messages concise; use prefixes like `feat:` / `fix:` / `docs:`

## 📄 License

Copyright © 2024-2026 LYOfficial. Licensed under [GNU GPL v3.0](https://github.com/LYOfficial/OneDocs/blob/main/LICENSE).

## 🙏 Acknowledgments

- [Tauri](https://github.com/tauri-apps/tauri) — Cross-platform app framework
- [lopdf](https://github.com/J-F-Liu/lopdf) — Rust PDF processing library
- [pdfjs-dist](https://github.com/nicbarker/pdfjs-dist) — PDF text parsing
- [React](https://github.com/facebook/react) — UI library
- [marked](https://github.com/markedjs/marked) — Markdown parser
- [KaTeX](https://github.com/KaTeX/KaTeX) — LaTeX math rendering
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [i18next](https://github.com/i18next/i18next) — Internationalization

> CandyRectangle provides Apple code signing

![candyrectangle](https://github.com/LYOfficial/OneDocs/blob/f4bbdea5317f82ac7f734599fc54346ea4b85e1b/candyrectangle.png)

## 👥 Authors

- [@LYOfficial](https://github.com/LYOfficial/) — Lead Developer, Project Manager
- [@JHL-HK](https://github.com/JHL-HK) — Partial Refactoring, Image Hosting

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LYOfficial/OneDocs&type=date&legend=top-left)](https://www.star-history.com/#LYOfficial/OneDocs&type=date&legend=top-left)