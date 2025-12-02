import React, { useCallback, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppStore } from '@/store/useAppStore';

type TabKey = 'landing' | 'analysis' | 'analysisResult' | 'settings';

interface TitleBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ activeTab, onTabChange }) => {
  const { theme, setTheme } = useAppStore();
  const appWindowRef = useRef(getCurrentWindow());

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
        const effectiveTheme = theme === 'system' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;
        
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('[data-tauri-drag-region="false"]')) return;

    appWindowRef.current
      .startDragging()
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('Window drag failed', error);
        }
      });
  }, []);

  return (
    <div 
      className="titlebar" 
      data-tauri-drag-region
      onPointerDown={handlePointerDown}
    >
      <div className="titlebar-left">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'landing' ? 'active' : ''}`}
            onClick={() => onTabChange('landing')}
            data-tauri-drag-region="false"
          >
            首页
          </button>
          <button 
            className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => onTabChange('analysis')}
            data-tauri-drag-region="false"
          >
            分析
          </button>
          <button
            className={`tab-button ${activeTab === 'analysisResult' ? 'active' : ''}`}
            onClick={() => onTabChange('analysisResult')}
            data-tauri-drag-region="false"
          >
            分析结果
          </button>
        </div>
      </div>

      <div style={{ flex: 1, height: '100%' }} data-tauri-drag-region></div>

      <div className="titlebar-right">
        <div className="control-group">
          <div className="theme-toggle">
            <button 
                className={`icon-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                title="浅色模式"
                data-tauri-drag-region="false"
            >
                <i className="fas fa-sun"></i>
            </button>
            <button 
                className={`icon-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
                title="深色模式"
                data-tauri-drag-region="false"
            >
                <i className="fas fa-moon"></i>
            </button>
            <button 
                className={`icon-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => setTheme('system')}
                title="跟随系统"
                data-tauri-drag-region="false"
            >
                <i className="fas fa-desktop"></i>
            </button>
          </div>

          <button
            className={`icon-btn settings-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
            title="设置"
            data-tauri-drag-region="false"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>

        <div className="window-controls">
          <button className="window-btn minimize" onClick={() => getCurrentWindow().minimize()} data-tauri-drag-region="false">
            <i className="fas fa-minus"></i>
          </button>
          <button className="window-btn maximize" onClick={() => getCurrentWindow().toggleMaximize()} data-tauri-drag-region="false">
            <i className="far fa-square"></i>
          </button>
          <button className="window-btn close" onClick={() => getCurrentWindow().close()} data-tauri-drag-region="false">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
