import React, { useEffect } from 'react';

interface MobileSidebarDrawerProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
  title,
  isOpen,
  onClose,
  children,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="mobile-sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar Drawer */}
      <div className={`mobile-sidebar-drawer ${isOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-drawer-header">
          <h2>{title}</h2>
          <button className="mobile-sidebar-drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mobile-sidebar-drawer-body">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * A toggle button for the sidebar on mobile.
 * Renders a floating button that opens the sidebar drawer.
 */
export const MobileSidebarToggle: React.FC<{
  onClick: () => void;
  label?: string;
}> = ({ onClick, label }) => {
  return (
    <button className="mobile-sidebar-toggle" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
      {label && <span className="mobile-sidebar-toggle-label">{label}</span>}
    </button>
  );
};
