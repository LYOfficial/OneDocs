use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command as StdCommand;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
use zip::ZipArchive;

const EMBEDDED_PYTHON_VERSION: &str = "3.11.9";
const EMBEDDED_PYTHON_ARCHIVE: &str = "python-3.11.9-embed-amd64.zip";
const EMBEDDED_PYTHON_DOWNLOAD_URL: &str =
    "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip";

// If you ship a pre-bundled embedded python in the repo under `src-tauri/`,
// set this folder name (example: the user's provided folder).
const PACKAGED_EMBEDDED_DIR_NAME: &str = "python-3.11.9-embed-amd64";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddedPythonStatus {
    pub state: String,
    pub version: String,
    pub python_path: String,
    pub site_packages_path: String,
    pub message: String,
}

impl EmbeddedPythonStatus {
    fn not_downloaded() -> Self {
        Self {
            state: "未下载".to_string(),
            version: String::new(),
            python_path: String::new(),
            site_packages_path: String::new(),
            message: "嵌入式 Python 未下载".to_string(),
        }
    }

    fn downloading(message: impl Into<String>) -> Self {
        Self {
            state: "下载中".to_string(),
            version: String::new(),
            python_path: String::new(),
            site_packages_path: String::new(),
            message: message.into(),
        }
    }

    fn pip_installed(message: impl Into<String>) -> Self {
        Self {
            state: "已安装 pip".to_string(),
            version: EMBEDDED_PYTHON_VERSION.to_string(),
            python_path: String::new(),
            site_packages_path: String::new(),
            message: message.into(),
        }
    }

    fn content_core_installed(message: impl Into<String>) -> Self {
        Self {
            state: "已安装 content-core".to_string(),
            version: EMBEDDED_PYTHON_VERSION.to_string(),
            python_path: String::new(),
            site_packages_path: String::new(),
            message: message.into(),
        }
    }

    fn running(python_path: PathBuf, site_packages_path: PathBuf, version: String) -> Self {
        Self {
            state: "运行中".to_string(),
            version,
            python_path: python_path.to_string_lossy().to_string(),
            site_packages_path: site_packages_path.to_string_lossy().to_string(),
            message: "嵌入式 Python 已准备就绪".to_string(),
        }
    }

    fn error(message: impl Into<String>) -> Self {
        Self {
            state: "错误".to_string(),
            version: String::new(),
            python_path: String::new(),
            site_packages_path: String::new(),
            message: message.into(),
        }
    }
}

pub struct EmbeddedPythonManager {
    status: Mutex<EmbeddedPythonStatus>,
}

impl Default for EmbeddedPythonManager {
    fn default() -> Self {
        Self {
            status: Mutex::new(EmbeddedPythonStatus::not_downloaded()),
        }
    }
}

impl EmbeddedPythonManager {
    pub async fn status(&self) -> EmbeddedPythonStatus {
        self.status.lock().await.clone()
    }

    async fn set_status(&self, status: EmbeddedPythonStatus) {
        *self.status.lock().await = status;
    }

    pub async fn ensure_ready(
        &self,
        app: &AppHandle,
        force: bool,
    ) -> Result<EmbeddedPythonStatus, String> {
        if !force {
            let current = self.status().await;
            if current.state == "运行中" {
                return Ok(current);
            }
        }

        self.set_status(EmbeddedPythonStatus::not_downloaded())
            .await;

        self.set_status(EmbeddedPythonStatus::downloading("正在准备嵌入式 Python..."))
            .await;

        match prepare_embedded_python_runtime_impl(app, self, force).await {
            Ok(status) => {
                self.set_status(status.clone()).await;
                Ok(status)
            }
            Err(error) => {
                let status = EmbeddedPythonStatus::error(error.clone());
                self.set_status(status).await;
                Err(error)
            }
        }
    }
}

#[tauri::command]
pub async fn get_embedded_python_status(
    manager: State<'_, EmbeddedPythonManager>,
) -> Result<EmbeddedPythonStatus, String> {
    Ok(manager.status().await)
}

#[tauri::command]
pub async fn prepare_embedded_python_runtime(
    app: AppHandle,
    manager: State<'_, EmbeddedPythonManager>,
    force: Option<bool>,
) -> Result<EmbeddedPythonStatus, String> {
    manager
        .ensure_ready(&app, force.unwrap_or(false))
        .await
}

#[tauri::command]
pub async fn extract_pdf_analysis_bundle_embedded(
    app: AppHandle,
    manager: State<'_, EmbeddedPythonManager>,
    input_path: String,
    output_root: String,
    base_name: String,
) -> Result<String, String> {
    manager.ensure_ready(&app, false).await?;

    let runtime_root = embedded_python_root(&app)?;
    let python_exe = runtime_root.join("python.exe");
    if !python_exe.exists() {
        return Err("嵌入式 Python 未准备好".to_string());
    }

    let script_dir = runtime_root.join("scripts");
    fs::create_dir_all(&script_dir).map_err(|e| format!("创建脚本目录失败: {}", e))?;
    let script_path = script_dir.join("contentcore_extract.py");
    fs::write(&script_path, get_content_core_script())
        .map_err(|e| format!("写入提取脚本失败: {}", e))?;

    let output = run_python_script_file(
        &python_exe,
        &script_path,
        Path::new(&input_path),
        Path::new(&output_root),
        &base_name,
    )?;

    Ok(output)
}

fn embedded_python_root(app: &AppHandle) -> Result<PathBuf, String> {
    // Prefer a packaged embedded python folder when present (useful during development and when
    // the embedded runtime is shipped in the app bundle). Check several locations:
    // 1. Environment variable `ONEDOCS_EMBEDDED_PYTHON` (explicit override)
    // 2. Project relative path: current working dir / "src-tauri" / PACKAGED_EMBEDDED_DIR_NAME
    // 3. Tauri resource dir (bundle resources) / PACKAGED_EMBEDDED_DIR_NAME
    if let Some(pkg) = find_packaged_embedded_python(app) {
        return Ok(pkg);
    }

    let mut root = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {}", e))?;
    root.push("embedded-python");
    root.push(format!("python-{}", EMBEDDED_PYTHON_VERSION));
    Ok(root)
}

fn find_packaged_embedded_python(app: &AppHandle) -> Option<PathBuf> {
    // 1) env var override
    if let Ok(p) = std::env::var("ONEDOCS_EMBEDDED_PYTHON") {
        let pb = PathBuf::from(p);
        if pb.join("python.exe").exists() {
            return Some(pb);
        }
    }

    // 2) project relative (useful when running from repo root)
    if let Ok(cwd) = std::env::current_dir() {
        let candidate = cwd.join("src-tauri").join(PACKAGED_EMBEDDED_DIR_NAME);
        if candidate.join("python.exe").exists() {
            return Some(candidate);
        }
    }

    // 3) resource dir inside the bundled app (tauri resource dir)
    if let Ok(res_dir) = app.path().resource_dir() {
        let candidate = res_dir.join(PACKAGED_EMBEDDED_DIR_NAME);
        if candidate.join("python.exe").exists() {
            return Some(candidate);
        }
    }

    // 4) try exe parent walk to find repo layout (best-effort)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(mut p) = exe.parent() {
            for _ in 0..6 {
                let candidate = p.join("src-tauri").join(PACKAGED_EMBEDDED_DIR_NAME);
                if candidate.join("python.exe").exists() {
                    return Some(candidate);
                }
                if let Some(parent) = p.parent() {
                    p = parent;
                } else {
                    break;
                }
            }
        }
    }

    None
}

async fn prepare_embedded_python_runtime_impl(
    app: &AppHandle,
    manager: &EmbeddedPythonManager,
    force: bool,
) -> Result<EmbeddedPythonStatus, String> {
    // Determine if we have a packaged embedded runtime to prefer.
    let packaged_candidate = find_packaged_embedded_python(app);

    let root = if let Some(pkg) = packaged_candidate.clone() {
        pkg
    } else {
        let mut root = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("获取应用数据目录失败: {}", e))?;
        root.push("embedded-python");
        root.push(format!("python-{}", EMBEDDED_PYTHON_VERSION));
        fs::create_dir_all(&root).map_err(|e| format!("创建嵌入式 Python 目录失败: {}", e))?;
        root
    };

    let python_exe = root.join("python.exe");
    let marker_path = root.join("runtime-ready.json");

    if !force && marker_path.exists() && python_exe.exists() {
        let site_packages_path = root.join("Lib").join("site-packages");
        let version = read_python_version(&python_exe).unwrap_or_else(|_| EMBEDDED_PYTHON_VERSION.to_string());
        return Ok(EmbeddedPythonStatus::running(python_exe, site_packages_path, version));
    }

    // If we are using a packaged candidate, try to use it as-is and avoid downloading.
    if packaged_candidate.is_some() {
        if !python_exe.exists() {
            return Err(format!("打包的嵌入式 Python 未包含 python.exe: {}", root.display()));
        }

        // Ensure python._pth config exists; attempt to configure if missing.
        let _ = configure_embedded_python(&root);
        let site_packages_path = ensure_site_packages(&root)?;

        // If content-core is already installed, mark running.
        let has_content_core = run_python_inline(&python_exe, "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('content_core') else 1)").is_ok();
        if has_content_core {
            let version = read_python_version(&python_exe).unwrap_or_else(|_| EMBEDDED_PYTHON_VERSION.to_string());
            return Ok(EmbeddedPythonStatus::running(python_exe, site_packages_path, version));
        }

        // Otherwise try to bootstrap pip and install content-core. If the packaged folder is read-only
        // (e.g. inside final bundle), this may fail; report helpful error.
        manager
            .set_status(EmbeddedPythonStatus::pip_installed(
                "检测到打包嵌入式 Python，但缺少 content-core，尝试安装...",
            ))
            .await;

        if let Err(e) = bootstrap_pip_and_packages(&python_exe, &root).await {
            return Err(format!("打包嵌入式 Python 无法完成安装: {}。请确保该运行时可写，或将已准备好的运行时放入 src-tauri/{}.", e, PACKAGED_EMBEDDED_DIR_NAME));
        }

        let version = read_python_version(&python_exe).unwrap_or_else(|_| EMBEDDED_PYTHON_VERSION.to_string());
        let status = EmbeddedPythonStatus::running(python_exe, site_packages_path, version);
        // Don't attempt to write marker into bundle resources; try, but ignore failure.
        let _ = fs::write(&marker_path, serde_json::to_string_pretty(&status).unwrap_or_default());
        return Ok(status);
    }

    // Normal flow: download into app data dir if python exe not present
    if !python_exe.exists() {
        download_and_extract_embedded_python(&root).await?;
    }

    configure_embedded_python(&root)?;
    let site_packages_path = ensure_site_packages(&root)?;

    manager
        .set_status(EmbeddedPythonStatus::pip_installed(
            "嵌入式 Python 已下载，正在安装 pip...",
        ))
        .await;
    bootstrap_pip_and_packages(&python_exe, &root).await?;

    manager
        .set_status(EmbeddedPythonStatus::content_core_installed(
            "pip 已安装，正在安装 content-core...",
        ))
        .await;

    let version = read_python_version(&python_exe)
        .unwrap_or_else(|_| EMBEDDED_PYTHON_VERSION.to_string());
    let status = EmbeddedPythonStatus::running(python_exe, site_packages_path, version);
    fs::write(&marker_path, serde_json::to_string_pretty(&status).unwrap_or_default())
        .map_err(|e| format!("写入 runtime 标记失败: {}", e))?;

    Ok(status)
}

async fn download_and_extract_embedded_python(root: &Path) -> Result<(), String> {
    let archive_path = root.join(EMBEDDED_PYTHON_ARCHIVE);
    if !archive_path.exists() {
        let response = Client::new()
            .get(EMBEDDED_PYTHON_DOWNLOAD_URL)
            .send()
            .await
            .map_err(|e| format!("下载嵌入式 Python 失败: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("下载嵌入式 Python 失败: HTTP {}", response.status()));
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("读取嵌入式 Python 下载内容失败: {}", e))?;
        tokio::fs::write(&archive_path, &bytes)
            .await
            .map_err(|e| format!("写入嵌入式 Python 压缩包失败: {}", e))?;
    }

    extract_zip(&archive_path, root)?;
    Ok(())
}

fn extract_zip(zip_path: &Path, target_dir: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| format!("打开压缩包失败: {}", e))?;
    let mut archive = ZipArchive::new(file).map_err(|e| format!("读取压缩包失败: {}", e))?;

    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|e| format!("解析压缩包条目失败: {}", e))?;

        let Some(enclosed_name) = entry.enclosed_name().map(|path: &Path| path.to_path_buf()) else {
            continue;
        };

        let out_path = target_dir.join(enclosed_name);
        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("创建目录失败 {}: {}", out_path.display(), e))?;
            continue;
        }

        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建父目录失败 {}: {}", parent.display(), e))?;
        }

        let mut output = fs::File::create(&out_path)
            .map_err(|e| format!("创建文件失败 {}: {}", out_path.display(), e))?;
        io::copy(&mut entry, &mut output)
            .map_err(|e| format!("写入文件失败 {}: {}", out_path.display(), e))?;
    }

    Ok(())
}

fn configure_embedded_python(root: &Path) -> Result<(), String> {
    let pth_path = find_embedded_pth_file(root)?;
    let zip_name = find_embedded_library_zip(root)?;
    let content = format!(
        "{}\n.\nLib\\site-packages\nimport site\n",
        zip_name
    );
    fs::write(&pth_path, content)
        .map_err(|e| format!("配置 python._pth 失败: {}", e))?;
    Ok(())
}

fn find_embedded_pth_file(root: &Path) -> Result<PathBuf, String> {
    let entries = fs::read_dir(root).map_err(|e| format!("读取嵌入式 Python 目录失败: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        if let Some(name) = path.file_name().and_then(|value| value.to_str()) {
            if name.ends_with("._pth") || name.ends_with("_pth") {
                return Ok(path);
            }
        }
    }
    Err("未找到 python._pth 文件".to_string())
}

fn find_embedded_library_zip(root: &Path) -> Result<String, String> {
    let entries = fs::read_dir(root).map_err(|e| format!("读取嵌入式 Python 目录失败: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        if let Some(name) = path.file_name().and_then(|value| value.to_str()) {
            if name.ends_with(".zip") && name.starts_with("python") {
                return Ok(name.to_string());
            }
        }
    }
    Err("未找到嵌入式 Python 标准库 zip".to_string())
}

fn ensure_site_packages(root: &Path) -> Result<PathBuf, String> {
    let site_packages = root.join("Lib").join("site-packages");
    fs::create_dir_all(&site_packages)
        .map_err(|e| format!("创建 site-packages 失败: {}", e))?;
    Ok(site_packages)
}

async fn bootstrap_pip_and_packages(python_exe: &Path, root: &Path) -> Result<(), String> {
    let has_pip = run_python_inline(
        python_exe,
        "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('pip') else 1)",
    )
    .is_ok();

    if !has_pip {
        let get_pip_path = root.join("get-pip.py");
        if !get_pip_path.exists() {
            let response = Client::new()
                .get("https://bootstrap.pypa.io/get-pip.py")
                .send()
                .await
                .map_err(|e| format!("下载 get-pip.py 失败: {}", e))?;
            if !response.status().is_success() {
                return Err(format!("下载 get-pip.py 失败: HTTP {}", response.status()));
            }
            let bytes = response
                .bytes()
                .await
                .map_err(|e| format!("读取 get-pip.py 内容失败: {}", e))?;
            tokio::fs::write(&get_pip_path, &bytes)
                .await
                .map_err(|e| format!("写入 get-pip.py 失败: {}", e))?;
        }

        run_python_script_file(python_exe, &get_pip_path, &root.to_path_buf(), &root.to_path_buf(), "get-pip")
            .map_err(|e| format!("运行 get-pip.py 失败: {}", e))?;
    }

    // Ensure content-core and pymupdf are installed
    run_python_inline(python_exe, "import subprocess, sys; subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'content-core', 'pymupdf'])")
        .map_err(|e| format!("安装 Python 包失败: {}", e))?;

    Ok(())
}

fn run_python_inline(python_exe: &Path, code: &str) -> Result<(), String> {
    let output = StdCommand::new(python_exe)
        .arg("-c")
        .arg(code)
        .output()
        .map_err(|e| format!("执行 Python 命令失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(stderr.to_string());
    }

    Ok(())
}

fn run_python_script_file(
    python_exe: &Path,
    script_path: &Path,
    input_path: &Path,
    output_root: &Path,
    base_name: &str,
) -> Result<String, String> {
    let output = StdCommand::new(python_exe)
        .arg(script_path)
        .arg("--input")
        .arg(input_path.to_string_lossy().to_string())
        .arg("--output")
        .arg(output_root.to_string_lossy().to_string())
        .arg("--base-name")
        .arg(base_name)
        .output()
        .map_err(|e| format!("执行 Python 脚本失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Err(format!("Python 脚本失败: {} {}", stdout, stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn read_python_version(python_exe: &Path) -> Result<String, String> {
    let output = StdCommand::new(python_exe)
        .arg("--version")
        .output()
        .map_err(|e| format!("获取 Python 版本失败: {}", e))?;

    let version_str = String::from_utf8_lossy(&output.stdout);
    Ok(version_str.trim().to_string())
}

fn get_content_core_script() -> String {
    [
        "import sys, io",
        "sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')",
        "sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')",
        "",
        "import argparse, json, os, sys",
        "",
        "def try_content_core(input_path):",
        "    try:",
        "        import content_core, inspect, asyncio",
        "    except Exception as e:",
        "        return (False, 'import_error:' + str(e))",
        "    try:",
        "        # Check if extract_content is an async function (coroutine)",
        "        is_async = inspect.iscoroutinefunction(content_core.extract_content)",
        "        ",
        "        # Try multiple invocation styles depending on content_core API",
        "        try:",
        "            sig = None",
        "            try:",
        "                sig = inspect.signature(content_core.extract_content)",
        "            except Exception:",
        "                sig = None",
        "",
        "            def do_call():",
        "                if sig is None:",
        "                    # fallback: try calling with input_path and with dict",
        "                    try:",
        "                        return content_core.extract_content({\"input_path\": input_path, \"format\": \"markdown\", \"engine\": \"auto\"})",
        "                    except Exception:",
        "                        return content_core.extract_content(input_path)",
        "                else:",
        "                    params = len([p for p in sig.parameters.values() if p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD)])",
        "                    # Check for keyword-only params (especially file_path)",
        "                    if params == 0:",
        "                        kw_names = [p.name for p in sig.parameters.values() if p.kind == p.KEYWORD_ONLY]",
        "                        if \"file_path\" in kw_names:",
        "                            return content_core.extract_content(file_path=input_path)",
        "                        elif \"url\" in kw_names:",
        "                            # try providing file_path as keyword",
        "                            try:",
        "                                return content_core.extract_content(file_path=input_path)",
        "                            except Exception:",
        "                                return content_core.extract_content(url=None, file_path=input_path)",
        "                        else:",
        "                            return content_core.extract_content()",
        "                    elif params == 1:",
        "                        # single param may be path or config dict",
        "                        try:",
        "                            return content_core.extract_content(input_path)",
        "                        except Exception:",
        "                            return content_core.extract_content({\"input_path\": input_path, \"format\": \"markdown\", \"engine\": \"auto\"})",
        "                    else:",
        "                        return content_core.extract_content({\"input_path\": input_path, \"format\": \"markdown\", \"engine\": \"auto\"})",
        "",
        "            # If async, run in asyncio event loop; otherwise call directly",
        "            if is_async:",
        "                res = asyncio.run(do_call())",
        "            else:",
        "                res = do_call()",
        "",
        "        except Exception as e:",
        "            return (False, \"invoke_error:\" + str(e))",
        "",
        "        if isinstance(res, dict):",
        "            text = res.get(\"text\", \"\") or res.get(\"content\", \"\") or \"\"",
        "            page_texts = res.get(\"pageTexts\") or res.get(\"page_texts\") or []",
        "            images = res.get(\"images\") or []",
        "            page_count = res.get(\"pageCount\") or res.get(\"page_count\") or 0",
        "        else:",
        "            # ExtractionOutput object - content is in 'content' attribute",
        "            text = getattr(res, \"content\", \"\") or getattr(res, \"text\", \"\") or \"\"",
        "            page_texts = getattr(res, \"page_texts\", []) or getattr(res, \"pageTexts\", []) or []",
        "            images = getattr(res, \"images\", []) or []",
        "            page_count = getattr(res, \"page_count\", 0) or getattr(res, \"pageCount\", 0)",
        "        ",
        "        # Ensure text is properly decoded as UTF-8",
        "        if isinstance(text, bytes):",
        "            text = text.decode(\"utf-8\", errors=\"replace\")",
        "        elif not isinstance(text, str):",
        "            text = str(text)",
        "        ",
        "        # Ensure page_texts items are proper UTF-8 strings",
        "        normalized_page_texts = []",
        "        for pt in page_texts:",
        "            if isinstance(pt, bytes):",
        "                pt = pt.decode(\"utf-8\", errors=\"replace\")",
        "            elif not isinstance(pt, str):",
        "                pt = str(pt)",
        "            normalized_page_texts.append(pt)",
        "        page_texts = normalized_page_texts",
        "        ",
        "        payload = {\"text\": text, \"pageTexts\": page_texts, \"images\": images, \"pageCount\": page_count}",
        "        return (True, payload)",
        "    except Exception as e:",
        "        return (False, \"runtime_error:\" + str(e))",
        "",
        "def run_pymupdf(input_path, output_dir):",
        "    try:",
        "        import fitz, os, json",
        "    except Exception as e:",
        "        return (False, \"fitz_import_error:\" + str(e))",
        "    try:",
        "        doc = fitz.open(input_path)",
        "        os.makedirs(output_dir, exist_ok=True)",
        "        page_texts = []",
        "        images = []",
        "        full_text = \"\"",
        "        for page_index in range(doc.page_count):",
        "            page = doc.load_page(page_index)",
        "            text = page.get_text(\"text\").strip()",
        "            page_texts.append(text)",
        "            full_text += f\"\\n=== 第 {page_index + 1} 页 ===\\n{text}\\n\"",
        "            try:",
        "                pix = page.get_pixmap()",
        "                file_name = f\"page_{page_index + 1:03d}.png\"",
        "                file_path = os.path.join(output_dir, file_name)",
        "                pix.save(file_path)",
        "                images.append({\"pageNumber\": page_index + 1, \"fileName\": file_name, \"localPath\": file_path})",
        "            except Exception:",
        "                pass",
        "        payload = {\"text\": full_text.strip(), \"pageTexts\": page_texts, \"images\": images, \"pageCount\": doc.page_count}",
        "        return (True, payload)",
        "    except Exception as e:",
        "        return (False, \"pymupdf_runtime:\" + str(e))",
        "",
        "def main():",
        "    parser = argparse.ArgumentParser()",
        "    parser.add_argument(\"--input\", required=True)",
        "    parser.add_argument(\"--output\", required=True)",
        "    parser.add_argument(\"--base-name\", required=True)",
        "    args = parser.parse_args()",
        "    ok, res = try_content_core(args.input)",
        "    if ok:",
        "        print(json.dumps(res, ensure_ascii=False))",
        "        return",
        "    # Fallback to pymupdf",
        "    ok, res = run_pymupdf(args.input, args.output)",
        "    if ok:",
        "        print(json.dumps(res, ensure_ascii=False))",
        "    else:",
        "        print(json.dumps({\"both_failed\": f\"content_core={res[1] if isinstance(res, tuple) else res}, pymupdf=\" + str(res)}, ensure_ascii=False), file=sys.stderr)",
        "        sys.exit(1)",
        "",
        "if __name__ == \"__main__\":",
        "    main()",
    ]
    .join("\n")
}
