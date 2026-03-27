'use client';

export default function TopBar({
  modelName,
  modelStatus = 'connected',
  onHistoryClick,
  onSettingsClick,
}) {
  return (
    <div
      className="flex items-center h-12 px-4 flex-shrink-0 border-b"
      style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      {/* Left: Logo + Product Name */}
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14.5 2.5l3 3-10 10H4.5v-3l10-10z" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 5l3 3" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          className="font-semibold text-base"
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Smart Drawio
        </span>
      </div>

      {/* Center: Model status */}
      <div className="flex-1 flex justify-center">
        {modelName && (
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: modelStatus === 'connected' ? 'var(--color-success)' : 'var(--color-error)',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {modelName}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* History */}
        <button
          onClick={onHistoryClick}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md touch-target focus-ring transition-colors hover:bg-[var(--color-bg-input)]"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="历史记录"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 1112 0A6 6 0 012 8z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs">历史</span>
        </button>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md touch-target focus-ring transition-colors hover:bg-[var(--color-bg-input)]"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="设置"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs">设置</span>
        </button>
      </div>
    </div>
  );
}
