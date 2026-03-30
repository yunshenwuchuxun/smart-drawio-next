'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import Spine from './Spine';

export default function Sidebar({
  children,
  status = 'ready', // 'ready' | 'generating' | 'error'
  onCollapseChange,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobileOverlay, setIsMobileOverlay] = useState(false);
  const [isMobileHidden, setIsMobileHidden] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const persistedCollapsed = storage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    setCollapsed(persistedCollapsed);
    onCollapseChange?.(persistedCollapsed);
  }, [onCollapseChange]);

  // Handle responsive breakpoints
  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setIsMobileOverlay(width < 1024);
      setIsMobileHidden(width < 768);
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsAnimating(true);
    setCollapsed(prev => {
      const next = !prev;
      storage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      onCollapseChange?.(next);
      return next;
    });
  }, [onCollapseChange]);

  const handleTransitionEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + \
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  // Mobile hamburger state
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobileHidden) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-[25] p-2 rounded-md touch-target focus-ring"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          aria-label="打开菜单"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Full-screen drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[25]">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <div
              className="absolute inset-y-0 left-0 w-[320px] max-w-[85vw] flex flex-col"
              style={{
                background: 'var(--color-bg-surface)',
                boxShadow: 'var(--shadow-sidebar)',
              }}
            >
              <div className="flex items-center justify-between h-12 px-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Smart Drawio</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-md touch-target focus-ring"
                  aria-label="关闭菜单"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const sidebarWidth = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';

  if (isMobileOverlay) {
    return (
      <>
        {/* Collapsed spine always visible */}
        <div
          className="fixed inset-y-0 left-0 flex flex-col"
          style={{
            width: 'var(--sidebar-width-collapsed)',
            zIndex: 'var(--z-sidebar)',
            background: 'var(--color-bg-surface)',
            borderRight: '1px solid var(--color-border-subtle)',
          }}
        >
          <Spine status={status} onExpand={() => setCollapsed(false)} />
        </div>

        {/* Overlay drawer when expanded */}
        {!collapsed && (
          <div className="fixed inset-0" style={{ zIndex: 'var(--z-sidebar)' }}>
            <div
              className="absolute inset-0 bg-black/30"
              onClick={toggleCollapsed}
            />
            <div
              className="absolute inset-y-0 left-0 w-[320px] flex flex-col"
              style={{
                background: 'var(--color-bg-surface)',
                boxShadow: 'var(--shadow-sidebar)',
                transition: `transform 300ms var(--animation-spring)`,
              }}
            >
              {children}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop layout
  return (
    <div
      ref={sidebarRef}
      className="relative flex flex-col h-full flex-shrink-0"
      style={{
        width: sidebarWidth,
        transition: `width 300ms var(--animation-spring)`,
        background: 'var(--color-bg-surface)',
        boxShadow: 'var(--shadow-sidebar)',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {collapsed ? (
        <Spine status={status} onExpand={toggleCollapsed} />
      ) : (
        <>
          {/* Collapse button at top */}
          <div className="flex items-center justify-end h-12 px-2 flex-shrink-0">
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-md touch-target focus-ring"
              style={{ color: 'var(--color-text-tertiary)' }}
              aria-label="折叠侧边栏"
              title="折叠侧边栏 (Ctrl+\)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {/* Panel content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
