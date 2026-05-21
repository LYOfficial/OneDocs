import React from 'react';
import { useTranslation } from 'react-i18next';
import { NAV_ICONS, FUNCTION_ICONS, SETTINGS_ICONS, ABOUT_ICONS, ARCHIVE_ICON } from '@/config/uiIcons';
import appIcon from '../../app-icon.png';
import TagIcon from '@/assets/icons/tag.svg';

type TabKey = 'analysis' | 'archive' | 'about' | 'discover' | 'settings';

interface MobileNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  activeSubTab,
  onSubTabChange,
}) => {
  const { t } = useTranslation();

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'analysis', label: t('app.titleBar.tabs.analysis'), icon: NAV_ICONS.analysis },
    { key: 'archive', label: t('app.titleBar.tabs.archive'), icon: NAV_ICONS.archive },
    { key: 'about', label: t('app.titleBar.tabs.about'), icon: NAV_ICONS.about },
    { key: 'discover', label: t('app.titleBar.tabs.discover'), icon: NAV_ICONS.discover },
    { key: 'settings', label: t('app.titleBar.tabs.settings'), icon: NAV_ICONS.settings },
  ];

  // Sub-tab definitions for each page
  const subTabsMap: Record<string, { key: string; label: string; icon: string }[]> = {
    analysis: [
      { key: 'news', label: t('function.news.name'), icon: FUNCTION_ICONS.news },
      { key: 'data', label: t('function.data.name'), icon: FUNCTION_ICONS.data },
      { key: 'science', label: t('function.science.name'), icon: FUNCTION_ICONS.science },
      { key: 'liberal', label: t('function.liberal.name'), icon: FUNCTION_ICONS.liberal },
    ],
    about: [
      { key: 'version', label: t('about.sections.version'), icon: ABOUT_ICONS.version },
      { key: 'intro', label: t('about.sections.intro'), icon: ABOUT_ICONS.intro },
      { key: 'features', label: t('about.sections.features'), icon: ABOUT_ICONS.features },
      { key: 'help', label: t('about.sections.help'), icon: ABOUT_ICONS.help },
    ],
    settings: [
      { key: 'general', label: t('settings.sections.general.label'), icon: SETTINGS_ICONS.general },
      { key: 'appearance', label: t('settings.sections.appearance.label'), icon: SETTINGS_ICONS.appearance },
      { key: 'model', label: t('settings.sections.model.label'), icon: SETTINGS_ICONS.model },
    ],
    archive: [
      { key: 'list', label: t('archive.title'), icon: ARCHIVE_ICON },
      { key: 'detail', label: t('archive.result.emptyTitle'), icon: TagIcon },
    ],
    discover: [
      { key: 'list', label: t('discover.title'), icon: NAV_ICONS.discover },
      { key: 'detail', label: t('discover.emptyTitle'), icon: TagIcon },
    ],
  };

  const currentSubTabs = subTabsMap[activeTab] || [];

  return (
    <>
      {/* Mobile Top Bar — logo + sub-tabs */}
      <div className="mobile-topbar">
        <img className="mobile-topbar-logo" src={appIcon} alt="OneDocs" />
        {currentSubTabs.length > 0 && onSubTabChange && (
          <div className="mobile-subbar">
            {currentSubTabs.map((sub) => (
              <button
                key={sub.key}
                className={`mobile-subbar-item ${activeSubTab === sub.key ? 'active' : ''}`}
                onClick={() => onSubTabChange(sub.key)}
              >
                <img className="mobile-subbar-icon" src={sub.icon} alt="" />
                <span className="mobile-subbar-label">{sub.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom page tab bar */}
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
