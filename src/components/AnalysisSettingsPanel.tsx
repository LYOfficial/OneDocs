import React from "react";
import { useAppStore } from "@/store/useAppStore";

export const AnalysisSettingsPanel: React.FC = () => {
  const { enableFormatReview, setEnableFormatReview } = useAppStore();

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="data-card-header">
          <div>
            <h3>析文设置</h3>
            <p>为“理工速知”启用格式复查，确保标题与公式格式正确</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enableFormatReview}
              onChange={(e) => setEnableFormatReview(e.target.checked)}
            />
            <span className="toggle-slider" aria-hidden="true"></span>
            <span className="toggle-label">开启格式复查</span>
          </label>
        </div>
        <div className="data-card-body">
          <ul className="setting-hints">
            <li>仅在选择“理工速知”功能时生效</li>
            <li>分析结束后会再走一次格式优化，修正标题层级与 LaTeX 公式</li>
            <li>若内容已符合要求，二次检查会原样返回</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
