import React from "react";
import { useAppStore } from "@/store/useAppStore";

export const AnalysisSettingsPanel: React.FC = () => {
  const { enableFormatReview, setEnableFormatReview } = useAppStore();

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title">开启格式复查</div>
            <div className="setting-desc">分析结束后再走一次格式优化，确保标题和公式符合规范</div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enableFormatReview}
              onChange={(e) => setEnableFormatReview(e.target.checked)}
            />
            <span className="toggle-slider" aria-hidden="true"></span>
          </label>
        </div>
      </div>
    </div>
  );
};
