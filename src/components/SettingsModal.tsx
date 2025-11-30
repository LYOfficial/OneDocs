import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MODEL_PROVIDERS } from '@/config/providers';
import { APIService } from '@/services/api';
import { useToast } from './Toast';
import type { AIProvider, AllProviders } from '@/types';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    currentProvider,
    setCurrentProvider,
    providerSettings,
    updateProviderSettings,
    customProviders,
    addCustomProvider,
    updateCustomProvider,
    deleteCustomProvider,
    providerCustomModels,
    addProviderCustomModel,
    removeProviderCustomModel,
    clearAllCache,
  } = useAppStore();

  const toast = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [view, setView] = useState<'grid' | 'form'>('grid');

  // 本地状态用于表单
  const [localProvider, setLocalProvider] = useState<AllProviders>(currentProvider);
  const [localApiKey, setLocalApiKey] = useState('');
  const [localBaseUrl, setLocalBaseUrl] = useState('');
  const [localModel, setLocalModel] = useState('');
  
  // 新建自定义模型的状态
  const [customName, setCustomName] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');

  // 添加模型的状态
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  
  // 清除缓存确认弹窗状态
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 当打开设置时，重置视图
  useEffect(() => {
    if (isSettingsOpen) {
      setView('grid');
      setLocalProvider(currentProvider);
      setIsAddingModel(false);
    }
  }, [isSettingsOpen, currentProvider]);

  // 当选择提供商时，加载对应的设置
  useEffect(() => {
    if (typeof localProvider === 'string' && localProvider.startsWith('custom_')) {
      // 自定义提供商
      const settings = customProviders[localProvider];
      if (settings) {
        setLocalApiKey(settings.apiKey);
        setLocalBaseUrl(settings.baseUrl);
        setLocalModel(settings.model);
      }
    } else {
      // 内置提供商
      const settings = providerSettings[localProvider as AIProvider];
      if (settings) {
        setLocalApiKey(settings.apiKey);
        setLocalBaseUrl(settings.baseUrl);
        setLocalModel(settings.model);
      }
    }
  }, [localProvider, providerSettings, customProviders]);

  const handleProviderSelect = (provider: AllProviders | 'create_custom') => {
    if (provider === 'create_custom') {
      setIsCreatingCustom(true);
      setView('form');
      return;
    }
    
    setLocalProvider(provider as AllProviders);
    setView('form');
  };

  const handleSave = () => {
    if (typeof localProvider === 'string' && localProvider.startsWith('custom_')) {
      // 保存自定义提供商设置
      updateCustomProvider(localProvider, {
        apiKey: localApiKey,
        baseUrl: localBaseUrl,
        model: localModel,
        name: customProviders[localProvider]?.name || '自定义模型',
      });
    } else {
      // 保存内置提供商设置
      updateProviderSettings(localProvider as AIProvider, {
        apiKey: localApiKey,
        baseUrl: localBaseUrl,
        model: localModel,
      });
    }

    // 如果提供商发生变化，也要更新
    if (localProvider !== currentProvider) {
      setCurrentProvider(localProvider);
    }

    toast.show('设置已保存');
    setSettingsOpen(false);
  };

  const handleCreateCustomProvider = () => {
    if (!customName || !customBaseUrl || !customModel) {
      toast.show('请填写完整的自定义模型信息');
      return;
    }

    const newId = addCustomProvider(customName, customBaseUrl, customModel, customApiKey);
    setLocalProvider(newId as AllProviders);
    setIsCreatingCustom(false);
    
    // 清空自定义模型表单
    setCustomName('');
    setCustomBaseUrl('');
    setCustomModel('');
    setCustomApiKey('');
    
    toast.show('自定义模型已创建');
  };

  const handleAddModel = () => {
    if (!newModelId || !newModelName) {
      toast.show('请填写完整的模型信息');
      return;
    }
    addProviderCustomModel(localProvider as AIProvider, {
      value: newModelId,
      name: newModelName,
    });
    setLocalModel(newModelId);
    setNewModelId('');
    setNewModelName('');
    setIsAddingModel(false);
    toast.show('模型添加成功');
  };

  const handleDeleteModel = (modelValue: string) => {
    removeProviderCustomModel(localProvider as AIProvider, modelValue);
    if (localModel === modelValue) {
      setLocalModel('');
    }
    toast.show('模型已删除');
  };

  const handleClearCache = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    clearAllCache();
    setShowClearConfirm(false);
    toast.show('所有模型缓存已清除');
  };

  const handleTestConnection = async () => {
    if (!localApiKey && !localProvider.toString().includes('ollama') && !localProvider.toString().includes('lmstudio')) {
      toast.show('请先输入 API Key');
      return;
    }

    setIsTesting(true);
    try {
      if (typeof localProvider === 'string' && localProvider.startsWith('custom_')) {
        // 测试自定义提供商连接
        await APIService.testCustomConnection(
          localApiKey,
          localBaseUrl,
          localModel
        );
      } else {
        // 测试内置提供商连接
        await APIService.testConnection(
          localProvider as AIProvider,
          localApiKey,
          localBaseUrl,
          localModel
        );
      }
      toast.show('连接测试成功！');
    } catch (error: any) {
      // 检查是否是余额不足的警告（连接正常但有余额问题）
      if (error.message === 'BALANCE_WARNING' && error.isWarning) {
        toast.show(`✅ ${error.originalMessage}`, 5000);
      } else {
        toast.show(`连接测试失败：${error.message}`, 5000);
      }
    } finally {
      setIsTesting(false);
    }
  };

  if (!isSettingsOpen) return null;

  const isCustomProvider = typeof localProvider === 'string' && localProvider.startsWith('custom_');
  const config = isCustomProvider ? null : MODEL_PROVIDERS[localProvider as AIProvider];
  const currentCustom = isCustomProvider ? customProviders[localProvider] : null;
  
  // 合并内置模型和自定义模型
  const providerModels = !isCustomProvider && config 
    ? [...config.models, ...(providerCustomModels[localProvider as AIProvider] || [])]
    : [];

  // 获取提供商首字母或图标
  const getProviderIcon = (key: string) => {
    const provider = MODEL_PROVIDERS[key as AIProvider];
    if (provider?.icon) {
      return <img src={provider.icon} alt={provider.name} className="provider-icon-img" />;
    }
    return key.charAt(0).toUpperCase();
  };

  return (
    <div className="modal">
      <div className={`modal-content ${view === 'grid' ? 'modal-large' : ''}`}>
        <div className="modal-header">
          <div className="header-title-area">
            {view === 'form' && (
              <button className="back-button" onClick={() => {
                setView('grid');
                setIsCreatingCustom(false);
              }}>
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <h3>
              {view === 'grid' ? '选择模型服务商' : 
               isCreatingCustom ? '新建自定义模型' : 
               isCustomProvider ? currentCustom?.name : config?.name}
            </h3>
          </div>
          <button className="modal-close" onClick={() => {
            setSettingsOpen(false);
            setIsCreatingCustom(false);
          }}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {view === 'grid' ? (
            <div className="provider-grid">
              {(Object.keys(MODEL_PROVIDERS) as AIProvider[]).map((key) => (
                <div 
                  key={key} 
                  className={`provider-card ${currentProvider === key ? 'active' : ''}`}
                  onClick={() => handleProviderSelect(key)}
                >
                  <div className="provider-icon">
                    {getProviderIcon(key)}
                  </div>
                  <div className="provider-name">{MODEL_PROVIDERS[key].name}</div>
                  {currentProvider === key && <div className="current-badge">当前使用</div>}
                </div>
              ))}
              
              {Object.entries(customProviders).map(([id, provider]) => (
                <div 
                  key={id} 
                  className={`provider-card custom ${currentProvider === id ? 'active' : ''}`}
                  onClick={() => handleProviderSelect(id as AllProviders)}
                >
                  <div className="provider-icon custom">
                    {getProviderIcon(provider.name)}
                  </div>
                  <div className="provider-name">{provider.name}</div>
                  <div className="custom-badge">自定义</div>
                  {currentProvider === id && <div className="current-badge">当前使用</div>}
                </div>
              ))}

              <div 
                className="provider-card add-new"
                onClick={() => handleProviderSelect('create_custom')}
              >
                <div className="provider-icon add">+</div>
                <div className="provider-name">新建自定义模型</div>
              </div>

              <div 
                className="provider-card clear-cache"
                onClick={handleClearCache}
                style={{ borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}
              >
                <div className="provider-icon" style={{ fontSize: '20px' }}>🗑️</div>
                <div className="provider-name" style={{ color: '#ef4444' }}>清除所有模型缓存</div>
              </div>
            </div>
          ) : (
            // 表单视图
            <>
              {isCreatingCustom ? (
                // 新建自定义模型表单
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
                // 正常设置表单
                <>
                  {isCustomProvider && currentCustom && (
                    <div className="setting-item">
                      <label>自定义模型信息</label>
                      <div style={{ 
                        background: '#f5f5f5', 
                        padding: '12px', 
                        borderRadius: '4px', 
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <div><strong>名称:</strong> {currentCustom.name}</div>
                        <div><strong>Base URL:</strong> {currentCustom.baseUrl}</div>
                        <div><strong>Model ID:</strong> {currentCustom.model}</div>
                      </div>
                      <button 
                        className="btn btn-delete"
                        onClick={() => {
                          deleteCustomProvider(localProvider as string);
                          setView('grid');
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        🗑️ 删除此自定义模型
                      </button>
                    </div>
                  )}

                  <div className="setting-item">
                    <label htmlFor="baseUrl">API Base URL</label>
                    <input
                      type="text"
                      id="baseUrl"
                      value={localBaseUrl}
                      onChange={(e) => setLocalBaseUrl(e.target.value)}
                      placeholder={isCustomProvider ? currentCustom?.baseUrl : config?.baseUrl}
                    />
                    <small>{isCustomProvider ? '自定义API服务器地址' : config?.baseUrlHint}</small>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="apiKey">{isCustomProvider ? 'API Key' : config?.keyLabel}</label>
                    <input
                      type="password"
                      id="apiKey"
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      placeholder="输入 API Key"
                    />
                    <small>{isCustomProvider ? 'API 访问密钥' : config?.keyHint}</small>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="modelSelect">选择模型</label>
                    {isCustomProvider ? (
                      <input
                        type="text"
                        value={localModel}
                        onChange={(e) => setLocalModel(e.target.value)}
                        placeholder="输入模型ID"
                      />
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <select
                            id="modelSelect"
                            value={localModel}
                            onChange={(e) => setLocalModel(e.target.value)}
                            style={{ flex: 1 }}
                          >
                            {providerModels.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.name}
                              </option>
                            ))}
                          </select>
                          {/* 如果当前选中的是自定义模型，显示删除按钮 */}
                          {providerCustomModels[localProvider as AIProvider]?.some(m => m.value === localModel) && (
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '0 10px', color: '#ef4444' }}
                              onClick={() => handleDeleteModel(localModel)}
                              title="删除此自定义模型"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        
                        {/* 添加自定义模型区域 */}
                        {isAddingModel ? (
                          <div style={{ 
                            background: '#f9fafb', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #e5e7eb',
                            marginTop: '8px' 
                          }}>
                            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>添加新模型</div>
                            <input
                              type="text"
                              placeholder="模型 ID (如 gpt-4-32k)"
                              value={newModelId}
                              onChange={(e) => setNewModelId(e.target.value)}
                              style={{ marginBottom: '8px', width: '100%', padding: '6px' }}
                            />
                            <input
                              type="text"
                              placeholder="显示名称 (如 GPT-4 32K)"
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value)}
                              style={{ marginBottom: '8px', width: '100%', padding: '6px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 12px', fontSize: '12px' }}
                                onClick={() => setIsAddingModel(false)}
                              >
                                取消
                              </button>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '4px 12px', fontSize: '12px' }}
                                onClick={handleAddModel}
                              >
                                确认添加
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="btn-text" 
                            style={{ 
                              color: 'var(--accent-color)', 
                              fontSize: '13px', 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer',
                              padding: '4px 0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => setIsAddingModel(true)}
                          >
                            <span>+</span> 添加自定义模型
                          </button>
                        )}
                      </>
                    )}
                    <small>选择要使用的具体模型</small>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {view === 'form' && (
          <div className="modal-footer">
            <div className="footer-left">
              {!isCreatingCustom && (
                <button 
                  className="btn btn-test"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? '测试中...' : '⚡ 测试连接'}
                </button>
              )}
            </div>
            <div className="footer-right">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSettingsOpen(false);
                  setIsCreatingCustom(false);
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary" 
                onClick={isCreatingCustom ? handleCreateCustomProvider : handleSave}
              >
                {isCreatingCustom ? '创建' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {showClearConfirm && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> 确认清除缓存
            </h3>
            <p style={{ marginBottom: '12px', color: '#374151' }}>确认要删除所有模型缓存吗？若删除：</p>
            <ul style={{ 
              marginBottom: '24px', 
              paddingLeft: '20px',
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.6',
              listStyleType: 'disc'
            }}>
              <li>所有API Base URL将恢复至默认</li>
              <li>所有已填写的API Key将被清空</li>
              <li>所有添加的自定义模型将被清空</li>
              <li>所有添加的自定义模型服务商将被清空</li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
                style={{ padding: '8px 16px' }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', padding: '8px 16px' }}
                onClick={confirmClear}
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
