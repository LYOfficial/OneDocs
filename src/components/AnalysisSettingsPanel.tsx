import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  getUserEmbeddingToken,
  setEmbeddingToken,
  hasUserEmbeddingToken,
  getFreeEmbeddingUses,
  isEmbeddingAvailable,
} from "@/services/rag/embeddingService";
import { openUrl } from "@tauri-apps/plugin-opener";

export const AnalysisSettingsPanel: React.FC = () => {
  const { enableFormatReview, setEnableFormatReview } = useAppStore();

  const [sfToken, setSfToken] = useState("");
  const [freeUses, setFreeUses] = useState(0);
  const [embeddingAvailable, setEmbeddingAvailable] = useState(false);
  const [hasOwnToken, setHasOwnToken] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    setSfToken(getUserEmbeddingToken());
    setFreeUses(getFreeEmbeddingUses());
    setEmbeddingAvailable(isEmbeddingAvailable());
    setHasOwnToken(hasUserEmbeddingToken());
  }, []);

  const handleTokenChange = (value: string) => {
    setSfToken(value);
    setEmbeddingToken(value);
    setEmbeddingAvailable(isEmbeddingAvailable());
    setHasOwnToken(hasUserEmbeddingToken());
    setFreeUses(getFreeEmbeddingUses());
  };

  const handleRegister = () => {
    openUrl("https://cloud.siliconflow.cn/i/AOugEVKt").catch(() => {
      window.open("https://cloud.siliconflow.cn/i/AOugEVKt", "_blank");
    });
  };

  return (
    <div className="tool-panel">
      {/* SiliconFlow Embedding Token */}
      <div className="data-card">
        <div className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "12px" }}>
          <div className="setting-text">
            <div className="setting-title">
              <span style={{ marginRight: 6 }}>🧠</span>RAG 嵌入模型配置
            </div>
            <div className="setting-desc">
              使用 SiliconFlow 的 BAAI/bge-m3 模型进行文本嵌入，提升分析质量
            </div>
          </div>

          {/* Status indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: embeddingAvailable
              ? "var(--success-bg, rgba(34,197,94,0.1))"
              : "var(--warning-bg, rgba(234,179,8,0.1))",
            fontSize: 13,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: embeddingAvailable ? "#22c55e" : "#eab308",
              flexShrink: 0,
            }} />
            {embeddingAvailable ? (
              hasOwnToken ? (
                <span>✅ 已配置个人 Token，嵌入服务可用</span>
              ) : (
                <span>✅ 使用开发者提供的免费额度，剩余次数：{freeUses}</span>
              )
            ) : (
              <span>⚠️ 嵌入服务不可用，请配置 SiliconFlow Token</span>
            )}
          </div>

          {/* Token input */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type={showToken ? "text" : "password"}
                value={sfToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                placeholder="sk-... 填入你自己的 SiliconFlow API Token"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  paddingRight: 40,
                  borderRadius: 8,
                  border: "1px solid var(--border-color, #e5e7eb)",
                  background: "var(--input-bg, #fff)",
                  color: "var(--text-primary, #111)",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary, #888)",
                  fontSize: 12,
                  padding: 4,
                }}
                aria-label={showToken ? "隐藏" : "显示"}
              >
                <i className={`fas ${showToken ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {/* Register button */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleRegister}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color, #e5e7eb)",
                background: "var(--btn-bg, #f9fafb)",
                color: "var(--text-primary, #111)",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <i className="fas fa-external-link-alt" style={{ fontSize: 11 }} />
              免费注册 SiliconFlow 获取 Token
            </button>
            <span style={{ fontSize: 12, color: "var(--text-secondary, #888)" }}>
              注册即送免费额度，BAAI/bge-m3 为免费模型
            </span>
          </div>
        </div>
      </div>

      {/* Format Review Toggle */}
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
