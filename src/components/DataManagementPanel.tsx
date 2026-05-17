import React, { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { executableDir, resourceDir } from "@tauri-apps/api/path";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "./Toast";

const FALLBACK_INSTALL_DIR = "C:\\Program Files\\onedocs";

export const DataManagementPanel: React.FC = () => {
  const {
    dataDirectory,
    setDataDirectory,
    autoSaveAnalysisResult,
    setAutoSaveAnalysisResult,
  } = useAppStore();
  const toast = useToast();
  const [defaultDir, setDefaultDir] = useState("");
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const sanitizePath = (value?: string | null) =>
      (value || "").replace(/[\\/]+$/, "");

    const detectInstallDir = async () => {
      setIsLoadingDefault(true);
      let resolvedDir = "";

      try {
        resolvedDir = sanitizePath(await executableDir());
      } catch (exeError) {
        console.warn("获取安装目录失败，将尝试资源目录", exeError);
        try {
          resolvedDir = sanitizePath(await resourceDir());
        } catch (resError) {
          console.error("资源目录获取失败", resError);
        }
      }

      const normalized = resolvedDir || FALLBACK_INSTALL_DIR;

      if (isMounted) {
        setDefaultDir(normalized);
        if (!dataDirectory) {
          setDataDirectory(normalized);
        }
        setIsLoadingDefault(false);
      }
    };

    detectInstallDir();
    return () => {
      isMounted = false;
    };
  }, [dataDirectory, setDataDirectory]);

  const handleChooseDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择应用数据目录",
        defaultPath: dataDirectory || defaultDir || undefined,
      });

      if (typeof selected === "string" && selected) {
        setDataDirectory(selected);
        toast.show(`数据目录已更新：${selected}`);
      }
    } catch (error: any) {
      console.error("目录选择失败", error);
      toast.show(error?.message || "目录选择失败，请确认已授予文件权限");
    }
  };

  const handleResetDirectory = () => {
    if (!defaultDir) return;
    setDataDirectory(defaultDir);
    toast.show("已恢复默认目录");
  };

  const currentDir = dataDirectory || defaultDir;

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="data-card-header">
          <div>
            <h3>应用数据目录</h3>
            <p>{isLoadingDefault ? "正在获取默认目录..." : "修改后会立即生效"}</p>
          </div>
          <button className="btn btn-primary" onClick={handleChooseDirectory}>
            修改目录
          </button>
        </div>
        <div className="data-path-display">
          <code>{currentDir || "尚未获取目录"}</code>
        </div>
        <div className="data-card-actions">
          <button className="btn btn-secondary" onClick={handleResetDirectory} disabled={!defaultDir}>
            恢复默认
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title">自动保存析文结果</div>
            <div className="setting-desc">开启后，分析完成即自动将 Markdown 结果保存到当前数据目录</div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoSaveAnalysisResult}
              onChange={(e) => setAutoSaveAnalysisResult(e.target.checked)}
            />
            <span className="toggle-slider" aria-hidden="true"></span>
          </label>
        </div>
      </div>
    </div>
  );
};
