import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export const AnalysisSettingsPanel: React.FC = () => {
  const { enableFormatReview, setEnableFormatReview } = useAppStore();
  const [infoDismissed, setInfoDismissed] = useState(false);

  return (
    <div className="tool-panel">
      <div className="data-card">
        {!infoDismissed && (
          <div className="provider-info-banner">
            <button
              type="button"
              className="provider-info-close"
              aria-label="关闭提示"
              onClick={() => setInfoDismissed(true)}
            >
              ×
            </button>
            <p>启用后仅对“理工速知”进行二次格式审校，重点修正标题层级与 LaTeX 排版。</p>
            <small>若内容已符合要求，复查会原样返回；该设置可随时关闭。</small>
          </div>
        )}

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
