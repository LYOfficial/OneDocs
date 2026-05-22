# 📱 Android APK Build Guide

Per the [Tauri docs](https://v2.tauri.org.cn/distribute/google-play/#build-apks), building an APK locally only requires Android SDK/NDK environment variables — no Android Studio needed.

## 1. Install JDK 17

> ⚠️ **JDK 17 is required.** The project uses Gradle 8.9, which does not support Java 21+ (e.g., Java 26 causes `Unsupported class file major version 70`).

Download JDK 17 from [Adoptium (Eclipse Temurin)](https://adoptium.net/):

```powershell
# Windows PowerShell — Download and install JDK 17 (Adoptium Temurin)
Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse" -OutFile "$env:TEMP\jdk17.msi"
Start-Process -Wait -FilePath "$env:TEMP\jdk17.msi"
```

Or download manually: <https://adoptium.net/temurin/releases/?version=17&os=windows&arch=x64>

After installation, set the `JAVA_HOME` environment variable:

```powershell
# Temporary (current terminal only)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"   # ⚠️ Must prepend JDK 17 to PATH, otherwise Gradle still uses the system default Java

# Permanent (system-wide, restart terminal to take effect)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'Machine')
# After permanent setup, also move %JAVA_HOME%\bin to the front of system PATH
```

> ⚠️ **Setting `JAVA_HOME` alone is not enough!** If another Java version (e.g., Java 26) is already in the system PATH, Gradle will use that version first, causing `Unsupported class file major version 70`. You must prepend JDK 17's `bin` directory to PATH.

> 💡 If you have Android Studio installed, you can also use its bundled JBR: `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`

## 2. Set Environment Variables

```powershell
# Windows example (run in terminal before building)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"  # JDK 17 path
$env:Path = "$env:JAVA_HOME\bin;$env:Path"                              # Prepend JDK 17 to PATH
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\27.0.12077973"
```

## 3. Add Rust Android Targets

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## 4. Generate Signing Keystore

> ⚠️ APK signing is required for release. The following steps only need to be done once.

Run in the project root directory (requires JDK 17's `keytool`):

```bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Follow the prompts to set a password and fill in certificate information. Keep the generated `upload-keystore.jks` file safe and **never commit it to version control**.

Generate Base64 encoding (for GitHub Actions Secrets):

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks")) | Set-Content keystore_base64.txt
```

```bash
# macOS / Linux
base64 -i upload-keystore.jks
```

## 5. Configure Signing Info

Fill in the signing information in the `.env` file (refer to `.env.example`):

```env
ANDROID_KEY_BASE64=<content of keystore_base64.txt>
ANDROID_KEY_ALIAS=upload
ANDROID_KEY_PASSWORD=<your password>
ANDROID_KEYSTORE_PATH=upload-keystore.jks
```

Add the following Secrets in GitHub repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Value |
|---|---|
| `ANDROID_KEY_BASE64` | Content of `keystore_base64.txt` |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | Your password |

## 6. Initialize and Build

```bash
npm run android:init          # Initialize Android project (once only)
npm run android:dev           # Dev mode
npm run android:build         # Build signed APK (universal)
npm run android:build:split   # Split per ABI (smaller size)
```

Before building, generate `keystore.properties` (for local signing):

```powershell
# Windows PowerShell — Replace with actual password and keystore path
$keystoreDir = "src-tauri/gen/android"
$keyAlias = "upload"
$password = "your-password"
$storeFile = "E:\Github\OneDocs\upload-keystore.jks"  # Absolute keystore path

# Write keystore.properties (UTF-8 without BOM)
$content = "keyAlias=$keyAlias`npassword=$password`nstoreFile=$storeFile"
[System.IO.File]::WriteAllText("$keystoreDir/keystore.properties", $content, [System.Text.UTF8Encoding]::new($false))
```

Build outputs are in `src-tauri/gen/android/app/build/outputs/apk/`.

> ⚠️ The first build downloads Gradle dependencies and compiles Rust cross targets, which takes a while. Use `--target aarch64` to build ARM64 only for faster iteration.

## CI/CD Build

The project has a dedicated Android workflow (`.github/workflows/android.yml`). Manually trigger it on the GitHub Actions page to automatically build signed APK + AAB and publish to GitHub Releases.
