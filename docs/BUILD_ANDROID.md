# 📱 Android APK 构建指南

参照 [Tauri 官方文档](https://v2.tauri.org.cn/distribute/google-play/#build-apks)，本地构建 APK 只需配置 Android SDK/NDK 环境变量，无需安装 Android Studio。

## 1. 安装 JDK 17

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
$env:JAVA_HOME = "D:/Program Files/JDK/jdk-17.0.19+10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"   # ⚠️ 必须将 JDK 17 加入 PATH 前面，否则 Gradle 仍会使用系统默认的 Java

# 永久设置（写入系统环境变量，重启终端后生效）
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'Machine')
# 永久设置后还需将 %JAVA_HOME%\bin 移到系统 PATH 的最前面
```

> ⚠️ **仅设置 `JAVA_HOME` 不够！** 如果系统 PATH 中已有其他版本的 Java（如 Java 26），Gradle 会优先使用 PATH 中的版本，导致 `Unsupported class file major version 70` 错误。必须将 JDK 17 的 `bin` 目录加到 PATH 最前面。

> 💡 如果你已安装 Android Studio，也可使用其内置 JBR：`$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`

## 2. 设置环境变量

```powershell
# Windows 示例（构建前在终端中执行）
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"  # JDK 17 路径
$env:Path = "$env:JAVA_HOME\bin;$env:Path"                              # 将 JDK 17 加入 PATH
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\27.0.12077973"
```

## 3. 添加 Rust Android 目标

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## 4. 生成签名密钥库

> ⚠️ 发布 APK 必须签名。以下步骤仅需执行一次。

在项目根目录执行（需要 JDK 17 的 `keytool`）：

```bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

按提示设置密码并填写证书信息。生成的 `upload-keystore.jks` 文件请妥善保管，**切勿提交到版本控制**。

生成 Base64 编码（用于 GitHub Actions Secrets）：

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks")) | Set-Content keystore_base64.txt
```

```bash
# macOS / Linux
base64 -i upload-keystore.jks
```

## 5. 配置签名信息

将签名信息填入 `.env` 文件（参考 `.env.example`）：

```env
ANDROID_KEY_BASE64=<keystore_base64.txt 的内容>
ANDROID_KEY_ALIAS=upload
ANDROID_KEY_PASSWORD=<你设置的密码>
ANDROID_KEYSTORE_PATH=upload-keystore.jks
```

在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** 中添加以下 Secrets：

| Secret 名称 | 值 |
|---|---|
| `ANDROID_KEY_BASE64` | `keystore_base64.txt` 的内容 |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | 你设置的密码 |

## 6. 初始化并构建

```bash
npm run android:init          # 初始化 Android 项目（仅需一次）
npm run android:dev           # 开发模式
npm run android:build         # 构建签名 APK（通用）
npm run android:build:split   # 按架构拆分（体积更小）
```

构建前需生成 `keystore.properties`（本地签名用）：

```powershell
# Windows PowerShell — 请替换实际密码和密钥库路径
$keystoreDir = "src-tauri/gen/android"
$keyAlias = "upload"
$password = "你的密码"
$storeFile = "E:\Github\OneDocs\upload-keystore.jks"  # 密钥库绝对路径

# 写入 keystore.properties（无 BOM UTF-8）
$content = "keyAlias=$keyAlias`npassword=$password`nstoreFile=$storeFile"
[System.IO.File]::WriteAllText("$keystoreDir/keystore.properties", $content, [System.Text.UTF8Encoding]::new($false))
```

构建产物位于 `src-tauri/gen/android/app/build/outputs/apk/`。

> ⚠️ 首次构建需下载 Gradle 依赖和编译 Rust 交叉目标，耗时较长。建议使用 `--target aarch64` 仅构建 ARM64 以加快速度。

## CI/CD 构建

项目配置了独立的 Android workflow（`.github/workflows/android.yml`），在 GitHub Actions 页面手动触发即可自动构建签名 APK + AAB 并发布到 GitHub Releases。
