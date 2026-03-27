'use client';

export default function Spine({ status = 'ready', onExpand }) {
  const statusColor = {
    ready: 'var(--color-success)',
    generating: 'var(--color-accent)',
    error: 'var(--color-error)',
  }[status] || 'var(--color-success)';

  const statusLabel = {
    ready: '就绪',
    generating: '生成中',
    error: '错误',
  }[status] || '就绪';

  return (
    <div className="flex flex-col items-center h-full py-3 gap-4">
      {/* Logo (dimmed) */}
      <div
        className="w-8 h-8 flex items-center justify-center rounded-lg opacity-40"
        title="Smart Drawio"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14.5 2.5l3 3-10 10H4.5v-3l10-10z" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 5l3 3" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Expand button */}
      <button
        onClick={onExpand}
        className="p-2 rounded-md touch-target focus-ring"
        style={{ color: 'var(--color-text-tertiary)' }}
        aria-label="展开侧边栏"
        title="展开侧边栏 (Ctrl+\)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicator */}
      <div title={statusLabel}>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: statusColor,
            animation: status === 'generating' ? 'blink 1s infinite' : 'none',
          }}
        />
      </div>
    </div>
  );
}
