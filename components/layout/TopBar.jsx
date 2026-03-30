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
        {/* GitHub */}
        <a
          href="https://github.com/yunshenwuchuxun/smart-drawio-next"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md touch-target focus-ring transition-colors hover:bg-[var(--color-bg-input)]"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="text-xs">GitHub</span>
        </a>

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
