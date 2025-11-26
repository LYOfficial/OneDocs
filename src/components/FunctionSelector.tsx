import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FUNCTION_INFO } from '@/config/providers';
import { useToast } from './Toast';
import type { PromptType } from '@/types';

export const FunctionSelector: React.FC = () => {
  const { selectedFunction, setSelectedFunction, isSidebarCollapsed, toggleSidebar } = useAppStore();
  const toast = useToast();

  const handleFunctionSelect = (func: PromptType) => {
    setSelectedFunction(func);
    const info = FUNCTION_INFO[func];
    toast.show(`已选择功能: ${info.name}`);
  };

  return (
    <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" onClick={toggleSidebar}>
        <span className="sidebar-title">功能选择</span>
        <span className="collapse-icon">
          <i className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
        </span>
      </div>
      <div className="sidebar-content">
        <div className="function-buttons">
          {(Object.keys(FUNCTION_INFO) as PromptType[]).map((key) => {
            const info = FUNCTION_INFO[key];
            return (
              <button
                key={key}
                className={`function-btn ${selectedFunction === key ? 'active' : ''}`}
                onClick={() => handleFunctionSelect(key)}
              >
                <div className="function-icon">{info.icon}</div>
                <div className="function-content">
                  <div className="function-name">{info.name}</div>
                  <div className="function-desc">{info.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
