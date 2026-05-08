import React, { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "./Toast";

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const DeveloperModePanel: React.FC = () => {
  const { developerLogs, clearLogs } = useAppStore();
  const toast = useToast();
  const [levelFilter, setLevelFilter] = useState("all");

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
          <h4>系统日志</h4>
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
