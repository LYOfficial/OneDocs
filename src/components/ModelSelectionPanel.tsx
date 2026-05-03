import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MODEL_PROVIDERS } from "@/config/providers";
import { MODEL_SOURCE_LOGOS } from "@/config/logoAssets";
import { APIService } from "@/services/api";
import { useToast } from "./Toast";
import type { AIProvider, AllProviders, ModelOption } from "@/types";

const ModelLogo = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    width="16"
    height="16"
    style={{ color: "var(--primary-color)" }}
  >
    <path
      d="M7 4.5h8.8c1.8 0 3.2 1.4 3.2 3.2V14a5.5 5.5 0 0 1-5.5 5.5H9.2L5 22V7.7A3.2 3.2 0 0 1 8.2 4.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
  </svg>
);

const ModelIcon: React.FC<{ src: string | null; staticIcon?: boolean }> = ({
  src,
  staticIcon = false,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <ModelLogo />;
  }

  return (
    <img
      src={src}
      alt=""
      className={`model-option-icon-img ${staticIcon ? "model-option-icon-img-static" : "model-option-icon-img-themed"}`}
      style={{ width: 16, height: 16 }}
      onError={() => setFailed(true)}
    />
  );
};

const SOURCE_LOGO_PROVIDERS = new Set<AIProvider>([
  "onedocs",
  "openrouter",
  "comp_share",
  "302_ai",
  "pony",
  "siliconflow",
  "xinghe",
  "ppio",
  "modelscope",
  "oneapi",
]);

function getModelLogoSrc(
  provider: AIProvider | null,
  model: ModelOption
) {
  if (!provider) return null;

  if (SOURCE_LOGO_PROVIDERS.has(provider)) {
    const source = model.value.split("/")[0].toLowerCase();
    const logo = MODEL_SOURCE_LOGOS[source as keyof typeof MODEL_SOURCE_LOGOS];
    return logo || null;
  }

  const providerConfig = MODEL_PROVIDERS[provider];
  return providerConfig?.icon || null;
}

const PROVIDER_PRIORITY: AIProvider[] = [
  "onedocs",
  "openai",
  "gemini",
  "openrouter",
  "glm",
  "siliconflow",
  "xinghe",
];
const ORDERED_PROVIDER_KEYS: AIProvider[] = [
  ...PROVIDER_PRIORITY.filter((key) =>
    Object.prototype.hasOwnProperty.call(MODEL_PROVIDERS, key)
  ),
  ...(Object.keys(MODEL_PROVIDERS) as AIProvider[]).filter(
    (key) => !PROVIDER_PRIORITY.includes(key)
  ),
];

export const ModelSelectionPanel: React.FC = () => {

  const {
    currentProvider,
    setCurrentProvider,
    theme,
    providerSettings,
    updateProviderSettings,
    providerCustomModels,
    customProviders,
    addCustomProvider,
    updateCustomProvider,
    deleteCustomProvider,
    addProviderCustomModel,
    removeProviderCustomModel,
    clearAllCache,
  } = useAppStore();

  const toast = useToast();
  const [view, setView] = useState<"grid" | "form">("grid");
  const [isTesting, setIsTesting] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const [localProvider, setLocalProvider] = useState<AllProviders>(currentProvider);
  const [localApiKey, setLocalApiKey] = useState("");
  const [localBaseUrl, setLocalBaseUrl] = useState("");
  const [localModel, setLocalModel] = useState("");

  const [customName, setCustomName] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [errors, setErrors] = useState({ apiKey: false, baseUrl: false, model: false });
  const [infoDismissed, setInfoDismissed] = useState(false);
  const [freeInfoDismissed, setFreeInfoDismissed] = useState(false);
  const sanitizeValue = (value?: string) => (value ?? "").trim();

  const isCustomProvider = typeof localProvider === "string" && localProvider.startsWith("custom_");
  const config = isCustomProvider ? null : MODEL_PROVIDERS[localProvider as AIProvider];
  const currentCustom = isCustomProvider ? customProviders[localProvider] : null;

  const providerModels = !isCustomProvider && config
    ? [...config.models, ...(providerCustomModels[localProvider as AIProvider] || [])]
    : [];

  const isCustomModelSelected = !isCustomProvider
    ? providerCustomModels[localProvider as AIProvider]?.some((m) => m.value === localModel)
    : false;

  const requiresApiKey = isCustomProvider ? true : config?.requiresApiKey !== false;
  const requiresBaseUrl = isCustomProvider ? true : config?.requiresBaseUrl !== false;
  const showApiKeyField = isCustomProvider ? true : config?.showApiKeyField !== false;
  const showBaseUrlField = isCustomProvider ? true : config?.showBaseUrlField !== false;
  const allowModelCustomization = isCustomProvider ? true : config?.allowModelCustomization !== false;
  const hasManagedCredentials = !isCustomProvider && !!config?.credentialsReadOnly;
  const missingManagedCredentials = hasManagedCredentials && (!localApiKey || !localBaseUrl);
  const isFreeProvider = !isCustomProvider && localProvider === "onedocs";

  useEffect(() => {
    setLocalProvider(currentProvider);
    setView("grid");
    setIsCreatingCustom(false);
    setIsAddingModel(false);
    setErrors({ apiKey: false, baseUrl: false, model: false });
    setInfoDismissed(false);
    setFreeInfoDismissed(false);
  }, [currentProvider]);

  useEffect(() => {
    setErrors({ apiKey: false, baseUrl: false, model: false });
    setInfoDismissed(false);
    setFreeInfoDismissed(false);
    if (typeof localProvider === "string" && localProvider.startsWith("custom_")) {
      const settings = customProviders[localProvider];
      if (settings) {
        setLocalApiKey(settings.apiKey);
        setLocalBaseUrl(settings.baseUrl);
        setLocalModel(settings.model);
      } else {
        setLocalApiKey("");
        setLocalBaseUrl("");
        setLocalModel("");
      }
    } else {
      const settings = providerSettings[localProvider as AIProvider];
      setLocalApiKey(settings?.apiKey || config?.defaultApiKey || "");
      setLocalBaseUrl(settings?.baseUrl || config?.baseUrl || "");
      setLocalModel(settings?.model || config?.defaultModel || "");
    }
  }, [localProvider, providerSettings, customProviders, config]);

  useEffect(() => {
    if (!isCustomProvider && config?.credentialsReadOnly) {
      if (config.baseUrl && config.baseUrl !== localBaseUrl) {
        setLocalBaseUrl(config.baseUrl);
      }
      if (config.defaultApiKey && config.defaultApiKey !== localApiKey) {
        setLocalApiKey(config.defaultApiKey);
      }
    }
  }, [isCustomProvider, config, localBaseUrl, localApiKey]);

  const handleProviderSelect = (provider: AllProviders | "create_custom") => {
    if (provider === "create_custom") {
      setIsCreatingCustom(true);
      setView("form");
      return;
    }

    setLocalProvider(provider as AllProviders);
    setView("form");
  };

  const saveSettings = () => {
    if (typeof localProvider === "string" && localProvider.startsWith("custom_")) {
      updateCustomProvider(localProvider, {
        apiKey: localApiKey,
        baseUrl: localBaseUrl,
        model: localModel,
        name: customProviders[localProvider]?.name || "自定义模型",
      });
    } else {
      updateProviderSettings(localProvider as AIProvider, {
        apiKey: localApiKey,
        baseUrl: localBaseUrl,
        model: localModel,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {
      apiKey: requiresApiKey && !localApiKey,
      baseUrl: requiresBaseUrl && !localBaseUrl,
      model: !localModel,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.show("请填写所有必填项");
      return;
    }
    saveSettings();
    toast.show("设置已保存");
  };

  const handleUse = () => {
    if (!validateForm()) {
      toast.show("请填写所有必填项");
      return;
    }
    saveSettings();
    setCurrentProvider(localProvider);
    toast.show("已切换至该模型");
    setView("grid");
    setIsCreatingCustom(false);
  };

  const handleCreateCustomProvider = () => {
    if (!customName || !customBaseUrl || !customModel) {
      toast.show("请填写完整的自定义模型信息");
      return;
    }

    const newId = addCustomProvider(customName, customBaseUrl, customModel, customApiKey);
    setLocalProvider(newId as AllProviders);
    setIsCreatingCustom(false);
    setView("form");

    setCustomName("");
    setCustomBaseUrl("");
    setCustomModel("");
    setCustomApiKey("");

    toast.show("自定义模型已创建");
  };

  const handleAddModel = () => {
    if (!newModelId || !newModelName) {
      toast.show("请填写完整的模型信息");
      return;
    }
    addProviderCustomModel(localProvider as AIProvider, {
      value: newModelId,
      name: newModelName,
    });
    setLocalModel(newModelId);
    setNewModelId("");
    setNewModelName("");
    setIsAddingModel(false);
    toast.show("模型添加成功");
  };

  const handleDeleteModel = (modelValue: string) => {
    removeProviderCustomModel(localProvider as AIProvider, modelValue);
    if (localModel === modelValue) {
      setLocalModel("");
    }
    toast.show("模型已删除");
  };

  const handleTestConnection = async () => {
    const providerId = localProvider.toString();
    const isLocalProvider = providerId.includes("ollama") || providerId.includes("lmstudio");
    if (!localApiKey && requiresApiKey && !isLocalProvider) {
      toast.show("请先输入 API Key");
      return;
    }

    setIsTesting(true);
    try {
      if (typeof localProvider === "string" && localProvider.startsWith("custom_")) {
        await APIService.testCustomConnection(localApiKey, localBaseUrl, localModel);
      } else {
        await APIService.testConnection(
          localProvider as AIProvider,
          localApiKey,
          localBaseUrl,
          localModel
        );
      }
      toast.show("连接测试成功！");
    } catch (error: any) {
      if (error.message === "BALANCE_WARNING" && error.isWarning) {
        toast.show(`✅ ${error.originalMessage}`, 5000);
      } else {
        toast.show(`连接测试失败：${error.message}`, 5000);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearCache = () => setShowClearConfirm(true);

  const confirmClear = () => {
    clearAllCache();
    setShowClearConfirm(false);
    toast.show("所有模型缓存已清除");
  };

  const closeClearConfirm = () => setShowClearConfirm(false);

  const getProviderIcon = (key: string) => {
    const provider = MODEL_PROVIDERS[key as AIProvider];
    if (provider?.icon) {
      const staticIcon = key === "onedocs";
      return (
        <img
          src={provider.icon}
          alt={provider.name}
          className={`provider-icon-img ${staticIcon ? "provider-icon-img-static" : "provider-icon-img-themed"}`}
        />
      );
    }
    return key.charAt(0).toUpperCase();
  };

  const renderModelTags = (model: ModelOption) => {
    if (model.tags?.length) {
      return model.tags.map((tag, index) => (
        <span
          key={`${model.value}-${tag.label}-${index}`}
          className={`model-tag ${tag.variant ? `model-tag-${tag.variant}` : ""}`.trim()}
        >
          {tag.label}
        </span>
      ));
    }

    if (model.tag) {
      return <span className="model-tag">{model.tag}</span>;
    }

    return null;
  };

  return (
    <div className="tool-panel">
      {view === "grid" ? (
        <div className="provider-grid">
          {ORDERED_PROVIDER_KEYS.map((key) => {
            const providerConfig = MODEL_PROVIDERS[key];
            const settings = providerSettings[key];
            const requiresApiKey = providerConfig.requiresApiKey !== false;
            const requiresBaseUrl = providerConfig.requiresBaseUrl !== false;
            const hasApiKey = Boolean(
              sanitizeValue(settings?.apiKey) || sanitizeValue(providerConfig.defaultApiKey)
            );
            const hasBaseUrl = Boolean(
              sanitizeValue(settings?.baseUrl) || sanitizeValue(providerConfig.baseUrl)
            );
            const isConfigured = (!requiresApiKey || hasApiKey) && (!requiresBaseUrl || hasBaseUrl);
            const showPrimaryBadge = key === "onedocs" && providerConfig.badgeText;
            return (
              <div
                key={key}
                className={`provider-card ${currentProvider === key ? "active" : ""} ${
                  isConfigured ? "configured" : ""
                }`}
                onClick={() => handleProviderSelect(key)}
              >
                {showPrimaryBadge && (
                  <span
                    className={`provider-tag provider-tag-${
                      providerConfig.badgeVariant || "info"
                    } provider-tag-left`}
                  >
                    {providerConfig.badgeText}
                  </span>
                )}
                <div className="provider-badges">
                  {currentProvider === key ? (
                    <span className="current-badge">当前使用</span>
                  ) : isConfigured ? (
                    <span className="available-badge">可用</span>
                  ) : null}
                </div>
                <div className="provider-icon">{getProviderIcon(key)}</div>
                <div className="provider-name">{MODEL_PROVIDERS[key].name}</div>
              </div>
            );
          })}

          {Object.entries(customProviders).map(([id, provider]) => {
            const isConfigured = !!(
              sanitizeValue(provider.apiKey) &&
              sanitizeValue(provider.baseUrl) &&
              sanitizeValue(provider.model)
            );
            return (
              <div
                key={id}
                className={`provider-card custom ${currentProvider === id ? "active" : ""} ${
                  isConfigured ? "configured" : ""
                }`}
                onClick={() => handleProviderSelect(id as AllProviders)}
              >
                <div className="provider-badges">
                  {currentProvider === id ? (
                    <span className="current-badge">当前使用</span>
                  ) : isConfigured ? (
                    <span className="available-badge">可用</span>
                  ) : null}
                </div>
                <div className="provider-icon custom">{getProviderIcon(provider.name)}</div>
                <div className="provider-name">{provider.name}</div>
                <div className="custom-badge">自定义</div>
              </div>
            );
          })}

          <div className="provider-card add-new" onClick={() => handleProviderSelect("create_custom")}>
            <div className="provider-icon add">+</div>
            <div className="provider-name">新建自定义模型</div>
          </div>

          <div
            className="provider-card clear-cache"
            onClick={handleClearCache}
          >
            <div className="provider-icon clear-cache-icon">
              🗑️
            </div>
            <div className="provider-name">
              清除所有模型缓存
            </div>
          </div>
        </div>
      ) : (
        <div className="provider-form">
          <div className="form-top-bar">
            <button className="back-button" onClick={() => {
              setView("grid");
              setIsCreatingCustom(false);
            }}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h3>
                {isCreatingCustom
                  ? "新建自定义模型"
                  : isCustomProvider
                  ? currentCustom?.name
                  : config?.name}
              </h3>
              <p className="form-subtitle">
                {isCreatingCustom
                  ? "将第三方兼容 OpenAI 接口的服务统一纳管"
                  : "为当前服务配置凭证与模型"}
              </p>
            </div>
          </div>

          {isCreatingCustom ? (
            <>
              <div className="setting-item">
                <label htmlFor="customName">模型名称</label>
                <input
                  type="text"
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="为您的自定义模型起个名字"
                />
                <small>自定义模型的显示名称</small>
              </div>

              <div className="setting-item">
                <label htmlFor="customBaseUrl">API Base URL</label>
                <input
                  type="text"
                  id="customBaseUrl"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                />
                <small>OpenAI 格式 API 的基础 URL</small>
              </div>

              <div className="setting-item">
                <label htmlFor="customApiKey">API Key</label>
                <input
                  type="password"
                  id="customApiKey"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="输入您的 API 密钥"
                />
                <small>您的 API 访问密钥</small>
              </div>

              <div className="setting-item">
                <label htmlFor="customModelId">Model ID</label>
                <input
                  type="text"
                  id="customModelId"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
                <small>模型的标识符，如 gpt-3.5-turbo</small>
              </div>
            </>
          ) : (
            <>
              {!isCustomProvider && config?.description && !infoDismissed && (
                <div className="provider-info-banner">
                  <button
                    type="button"
                    className="provider-info-close"
                    aria-label="关闭提示"
                    onClick={() => setInfoDismissed(true)}
                  >
                    ×
                  </button>
                  <p>{config.description}</p>
                  {hasManagedCredentials && <small>无需配置 URL 与 API Key</small>}
                </div>
              )}

              {isFreeProvider && !freeInfoDismissed && (
                <div className="provider-info-banner">
                  <button
                    type="button"
                    className="provider-info-close"
                    aria-label="关闭提示"
                    onClick={() => setFreeInfoDismissed(true)}
                  >
                    ×
                  </button>
                  <p>
                    免费模型输入输出以及分析能力有限，有概率出现格式错乱的问题，若遇到问题请输出后请自行导出修改源码，感谢理解！
                  </p>
                </div>
              )}

              {missingManagedCredentials && (
                <div className="provider-alert warning">
                  ⚠️ 未检测到 {config?.name} 内置凭证，请在部署流程中注入 VITE_ONEDOCS_API_URL 与 VITE_ONEDOCS_API_KEY。
                </div>
              )}

              {isCustomProvider && currentCustom && (
                <div className="setting-item">
                  <label>自定义模型信息</label>
                  <div className="custom-summary">
                    <div>
                      <strong>名称:</strong> {currentCustom.name}
                    </div>
                    <div>
                      <strong>Base URL:</strong> {currentCustom.baseUrl}
                    </div>
                    <div>
                      <strong>Model ID:</strong> {currentCustom.model}
                    </div>
                  </div>
                  <button
                    className="btn btn-delete"
                    onClick={() => {
                      deleteCustomProvider(localProvider as string);
                      setView("grid");
                    }}
                  >
                    🗑️ 删除此自定义模型
                  </button>
                </div>
              )}

              {showBaseUrlField && (
                <div className="setting-item">
                  <label htmlFor="baseUrl">API Base URL</label>
                  <input
                    type="text"
                    id="baseUrl"
                    value={localBaseUrl}
                    onChange={(e) => {
                      setLocalBaseUrl(e.target.value);
                      if (e.target.value) setErrors((prev) => ({ ...prev, baseUrl: false }));
                    }}
                    className={errors.baseUrl ? "input-error" : ""}
                    placeholder={isCustomProvider ? currentCustom?.baseUrl : config?.baseUrl}
                    disabled={hasManagedCredentials}
                  />
                  <small>{isCustomProvider ? "自定义API服务器地址" : config?.baseUrlHint}</small>
                </div>
              )}

              {showApiKeyField && (
                <div className="setting-item">
                  <label htmlFor="apiKey">{isCustomProvider ? "API Key" : config?.keyLabel}</label>
                  <input
                    type="password"
                    id="apiKey"
                    value={localApiKey}
                    onChange={(e) => {
                      setLocalApiKey(e.target.value);
                      if (e.target.value) setErrors((prev) => ({ ...prev, apiKey: false }));
                    }}
                    className={errors.apiKey ? "input-error" : ""}
                    placeholder="输入 API Key"
                    disabled={hasManagedCredentials}
                  />
                  <small>{isCustomProvider ? "API 访问密钥" : config?.keyHint}</small>
                </div>
              )}

              <div className="setting-item">
                <label htmlFor="modelSelect">选择模型</label>
                {isCustomProvider ? (
                  <input
                    type="text"
                    value={localModel}
                    onChange={(e) => {
                      setLocalModel(e.target.value);
                      if (e.target.value) setErrors((prev) => ({ ...prev, model: false }));
                    }}
                    className={errors.model ? "input-error" : ""}
                    placeholder="输入模型ID"
                  />
                ) : (
                  <>
                    <select
                      id="modelSelect"
                      value={localModel}
                      onChange={(e) => {
                        setLocalModel(e.target.value);
                        if (e.target.value) setErrors((prev) => ({ ...prev, model: false }));
                      }}
                      className="sr-only"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      {providerModels.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.name}
                        </option>
                      ))}
                    </select>

                    <div className={`model-options ${errors.model ? "input-error" : ""}`}>
                      <div
                        className="model-options-list"
                        role="listbox"
                        aria-label="模型列表"
                      >
                        {providerModels.map((model) => (
                          <button
                            key={model.value}
                            type="button"
                            className={`model-option ${localModel === model.value ? "active" : ""}`}
                            onClick={() => {
                              setLocalModel(model.value);
                              if (model.value) setErrors((prev) => ({ ...prev, model: false }));
                            }}
                            role="option"
                            aria-selected={localModel === model.value}
                          >
                            <span
                              className="model-option-icon"
                              style={{
                                display: "inline-flex",
                                width: 16,
                                height: 16,
                                marginRight: 8,
                                flexShrink: 0,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {getModelLogoSrc(
                                isCustomProvider ? null : (localProvider as AIProvider),
                                  model
                              ) ? (
                                <ModelIcon
                                  src={getModelLogoSrc(
                                    isCustomProvider ? null : (localProvider as AIProvider),
                                    model
                                  )}
                                  staticIcon={localProvider === "onedocs"}
                                />
                              ) : (
                                <ModelLogo />
                              )}
                            </span>
                            <span className="model-option-name">{model.name}</span>
                            {renderModelTags(model)}
                          </button>
                        ))}
                      </div>

                      {!isAddingModel && allowModelCustomization && (
                        <div className="model-options-actions">
                          {isCustomModelSelected && (
                            <button
                              className="btn-text btn-text-danger"
                              onClick={() => handleDeleteModel(localModel)}
                              title="删除此自定义模型"
                            >
                              <span>-</span> 删除当前自定义模型
                            </button>
                          )}
                          <button
                            className="btn-text btn-text-primary"
                            onClick={() => setIsAddingModel(true)}
                          >
                            <span>+</span> 添加自定义模型
                          </button>
                        </div>
                      )}
                    </div>

                    {allowModelCustomization && isAddingModel && (
                      <div className="custom-model-form">
                          <div className="custom-model-title">添加新模型</div>
                          <input
                            type="text"
                            placeholder="模型 ID (如 gpt-4-32k)"
                            value={newModelId}
                            onChange={(e) => setNewModelId(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="显示名称 (如 GPT-4 32K)"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                          />
                          <div className="custom-model-actions">
                            <button className="btn btn-secondary" onClick={() => setIsAddingModel(false)}>
                              取消
                            </button>
                            <button className="btn btn-primary" onClick={handleAddModel}>
                              确认添加
                            </button>
                          </div>
                        </div>
                    )}
                  </>
                )}
                <small>选择要使用的具体模型</small>
              </div>
            </>
          )}
        </div>
      )}

      {view === "form" && (
        <div className="tool-panel-footer">
          <div className="footer-left">
            {!isCreatingCustom && (
              <button className="btn btn-test" onClick={() => handleTestConnection()} disabled={isTesting}>
                {isTesting ? "测试中..." : "⚡ 测试连接"}
              </button>
            )}
          </div>
          <div className="footer-right">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setView("grid");
                setIsCreatingCustom(false);
              }}
            >
              返回
            </button>
            {!isCreatingCustom ? (
              <>
                <button className="btn btn-secondary" onClick={handleSave}>
                  保存
                </button>
                <button className="btn btn-primary" onClick={handleUse}>
                  启用
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleCreateCustomProvider}>
                创建
              </button>
            )}
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="tool-panel-dialog">
          <div className="tool-panel-dialog-content">
            <h3>
              <span role="img" aria-label="warning">
                ⚠️
              </span>
              确认清除缓存
            </h3>
            <p>确认要删除所有模型缓存吗？若删除将会：</p>
            <ul>
              <li>恢复所有 API Base URL 至默认值</li>
              <li>清空已填写的 API Key</li>
              <li>移除所有自定义模型</li>
              <li>移除所有自定义服务商</li>
            </ul>
            <div className="tool-panel-dialog-actions">
              <button className="btn btn-secondary" onClick={closeClearConfirm}>
                取消
              </button>
              <button className="btn btn-primary danger" onClick={confirmClear}>
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
