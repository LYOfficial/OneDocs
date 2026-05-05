import React, { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "./Toast";

type EmbeddedPythonStatus = {
  state: string;
  version: string;
  python_path: string;
  site_packages_path: string;
  message: string;
};

const DEFAULT_EMBEDDED_STATUS: EmbeddedPythonStatus = {
  state: "未下载",
  version: "",
  python_path: "",
  site_packages_path: "",
  message: "尚未初始化嵌入式 Python",
};

const getStatusLabel = (state: string) => {
  switch (state) {
    case "未下载":
      return "未下载";
    case "下载中":
      return "下载中";
    case "已安装 pip":
      return "已安装 pip";
    case "已安装 content-core":
      return "已安装 content-core";
    case "运行中":
      return "运行中";
    case "错误":
      return "错误";
    default:
      return state || "未知";
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const DeveloperModePanel: React.FC = () => {
  const { developerLogs, clearLogs } = useAppStore();
  const toast = useToast();
  const [levelFilter, setLevelFilter] = useState("all");
  const [embeddedStatus, setEmbeddedStatus] = useState<EmbeddedPythonStatus>(DEFAULT_EMBEDDED_STATUS);

  const refreshEmbeddedStatus = async () => {
    try {
      const status = await invoke<EmbeddedPythonStatus>("get_embedded_python_status");
      setEmbeddedStatus(status || DEFAULT_EMBEDDED_STATUS);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    void refreshEmbeddedStatus();
    const timer = setInterval(() => {
      void refreshEmbeddedStatus();
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const filteredLogs = useMemo(() => {
    if (levelFilter === "all") return developerLogs;
    return developerLogs.filter((log) => log.level === levelFilter);
  }, [developerLogs, levelFilter]);

  const logText = useMemo(() => {
    return filteredLogs
      .map((log) => {
        const header = `${formatTime(log.timestamp)} · ${log.scope} · ${log.level.toUpperCase()}`;
        const payloadText =
          log.payload === undefined
            ? ""
            : `\n${typeof log.payload === "string" ? log.payload : JSON.stringify(log.payload, null, 2)}`;
        return `${header}\n${log.message}${payloadText}`;
      })
      .join("\n\n");
  }, [filteredLogs]);

  const handleCopyAll = async () => {
    if (!logText.trim()) {
      toast.show("暂无日志可复制");
      return;
    }

    try {
      await navigator.clipboard.writeText(logText);
      toast.show("日志已复制到剪贴板");
    } catch (error: any) {
      console.error("复制日志失败", error);
      toast.show("复制失败，请手动选择复制");
    }
  };

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="data-card-header">
          <div>
            <h3>开发者模式</h3>
            <p>查看系统内部执行日志、模型请求与响应</p>
          </div>
          <div className="data-card-actions">
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="btn btn-secondary"
              style={{ marginRight: 8 }}
            >
              <option value="all">全部级别</option>
              <option value="info">信息</option>
              <option value="warn">警告</option>
              <option value="error">错误</option>
            </select>
            <button className="btn btn-secondary" onClick={handleCopyAll}>
              复制全部日志
            </button>
            <button className="btn btn-secondary" onClick={clearLogs}>
              清空日志
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <h4>Python Runtime</h4>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div><strong>状态：</strong>{getStatusLabel(embeddedStatus.state)}</div>
              <div><strong>版本：</strong>{embeddedStatus.version || "未就绪"}</div>
              <div><strong>Python 路径：</strong>{embeddedStatus.python_path || "未就绪"}</div>
              <div><strong>site-packages：</strong>{embeddedStatus.site_packages_path || "未就绪"}</div>
              <div><strong>说明：</strong>{embeddedStatus.message}</div>
            </div>
          </div>
        </div>
        {filteredLogs.length === 0 ? (
          <div className="developer-log-box">
            <pre className="developer-log-content">暂无日志</pre>
          </div>
        ) : (
          <div className="developer-log-box">
            <pre className="developer-log-content">{logText}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
