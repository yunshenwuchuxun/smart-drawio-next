'use client';

import { useRef, useCallback } from 'react';

export default function SidebarCard({
  name,
  icon,
  summary,
  isExpanded,
  onToggle,
  children,
  id,
}) {
  const contentRef = useRef(null);

  const handleClick = useCallback((e) => {
    onToggle?.(id, e.altKey);
  }, [id, onToggle]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle?.(id, e.altKey);
    }
  }, [id, onToggle]);

  return (
    <div
      className="flex flex-col"
      style={{
        flex: isExpanded ? '1' : '0 0 var(--panel-header-height)',
        minHeight: isExpanded ? 'var(--panel-header-height)' : undefined,
        transition: `flex var(--duration-panel) var(--animation-spring)`,
        overflow: 'hidden',
      }}
      role="tabpanel"
    >
      {/* Header */}
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="tab"
        tabIndex={0}
        aria-selected={isExpanded}
        className="flex items-center h-12 px-4 cursor-pointer select-none flex-shrink-0 focus-ring touch-target"
        style={{
          borderBottom: isExpanded ? '1px solid var(--color-border-subtle)' : 'none',
        }}
      >
        {/* Expand arrow */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="mr-2 flex-shrink-0"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: `transform var(--duration-fast) var(--animation-ease)`,
            color: 'var(--color-text-tertiary)',
          }}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Panel name (sectionLabel style) */}
        <span className="text-section-label flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {name}
        </span>

        {/* Summary (right aligned) */}
        {!isExpanded && summary && (
          <span
            className="ml-auto text-xs truncate"
            style={{ color: 'var(--color-text-tertiary)', maxWidth: '120px' }}
          >
            {summary}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
        style={{
          visibility: isExpanded ? 'visible' : 'hidden',
          height: isExpanded ? 'auto' : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
