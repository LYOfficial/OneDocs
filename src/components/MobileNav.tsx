import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NAV_ICONS } from '@/config/uiIcons';
import appIcon from '../../app-icon.png';

type TabKey = 'analysis' | 'archive' | 'about' | 'discover' | 'settings';

interface MobileNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      onTabChange(tab);
      setDrawerOpen(false);
    },
    [onTabChange],
  );

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'analysis', label: t('app.titleBar.tabs.analysis'), icon: NAV_ICONS.analysis },
    { key: 'archive', label: t('app.titleBar.tabs.archive'), icon: NAV_ICONS.archive },
    { key: 'about', label: t('app.titleBar.tabs.about'), icon: NAV_ICONS.about },
    { key: 'discover', label: t('app.titleBar.tabs.discover'), icon: NAV_ICONS.discover },
    { key: 'settings', label: t('app.titleBar.tabs.settings'), icon: NAV_ICONS.settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <button
          className="mobile-hamburger"
          onClick={toggleDrawer}
          aria-label="Menu"
        >
          <span className={`hamburger-line ${drawerOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${drawerOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${drawerOpen ? 'open' : ''}`} />
        </button>
        <div className="mobile-topbar-brand">
          <img className="mobile-topbar-logo" src={appIcon} alt="OneDocs" />
          <span className="mobile-topbar-name">OneDocs</span>
        </div>
        <div className="mobile-topbar-spacer" />
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Side Drawer */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <img className="mobile-drawer-logo" src={appIcon} alt="OneDocs" />
          <span className="mobile-drawer-brand">OneDocs</span>
          <button className="mobile-drawer-close" onClick={() => setDrawerOpen(false)}>
            ✕
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`mobile-drawer-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <img className="mobile-drawer-icon" src={tab.icon} alt="" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Tab Bar */}
      <div className="mobile-bottombar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`mobile-bottombar-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <img className="mobile-bottombar-icon" src={tab.icon} alt="" />
            <span className="mobile-bottombar-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
