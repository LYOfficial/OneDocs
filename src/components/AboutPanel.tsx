import React, { useRef } from "react";
import packageJson from "../../package.json";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "./Toast";

const TAP_WINDOW_MS = 2000;
const TAP_COUNT = 5;

export const AboutPanel: React.FC = () => {
  const { devMode, setDevMode } = useAppStore();
  const toast = useToast();
  const tapTimesRef = useRef<number[]>([]);
  const version = packageJson.version || "unknown";

  const handleVersionTap = () => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, now].filter(
      (time) => now - time <= TAP_WINDOW_MS,
    );

    if (tapTimesRef.current.length >= TAP_COUNT && !devMode) {
      setDevMode(true);
      toast.show("开发者模式已启用");
      tapTimesRef.current = [];
    }
  };

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="data-card-header">
          <div>
            <h3>关于 OneDocs</h3>
            <p>版本信息与项目入口</p>
          </div>
        </div>
        <div className="setting-row" style={{ alignItems: "flex-start" }}>
          <div className="setting-text">
            <div className="setting-title">当前版本</div>
            <div className="setting-desc">
              <button
                type="button"
                onClick={handleVersionTap}
                className="btn btn-secondary"
                style={{ padding: "6px 12px" }}
              >
                v{version}
              </button>
            </div>
          </div>
        </div>
        <div className="setting-row" style={{ alignItems: "flex-start" }}>
          <div className="setting-text">
            <div className="setting-title">官网入口</div>
            <div className="setting-desc">
              <a href="https://onedocs.ijune.cn/" target="_blank" rel="noreferrer">
                https://onedocs.ijune.cn/
              </a>
            </div>
          </div>
        </div>
        <div className="setting-row" style={{ alignItems: "flex-start" }}>
          <div className="setting-text">
            <div className="setting-title">开源仓库</div>
            <div className="setting-desc">
              <a href="https://github.com/LYOfficial/OneDocs" target="_blank" rel="noreferrer">
                https://github.com/LYOfficial/OneDocs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
