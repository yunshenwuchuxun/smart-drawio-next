'use client';

import SidebarCard from '@/components/layout/SidebarCard';

function SectionTitle({ children }) {
  return (
    <div className="text-section-label mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
      {children}
    </div>
  );
}

function ToggleChip({ active, label, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className="px-3 py-1.5 text-xs rounded-full transition-colors focus-ring"
      style={{
        background: active ? 'var(--color-accent)' : 'var(--color-bg-input)',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
      }}
    >
      {label}
    </button>
  );
}

function ActionChip({ label, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-3 py-1.5 text-xs rounded transition-colors focus-ring"
      style={{
        background: 'var(--color-bg-input)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {label}
    </button>
  );
}

export default function ToolsCard({
  isExpanded,
  onToggle,
  presets,
  stylePresets,
  textStyleTools,
  stylePacks,
  tricks,
  onPresetToggle,
  onApplyTextTool,
  onApplyStylePack,
  onApplyTrick,
}) {
  const activePresetCount = Object.values(presets).filter(Boolean).length;

  return (
    <SidebarCard
      id="tools"
      name="TOOLS"
      isExpanded={isExpanded}
      onToggle={onToggle}
      summary={activePresetCount > 0 ? `${activePresetCount} 活跃` : null}
    >
      <div className="p-4 space-y-4">
        <div>
          <SectionTitle>样式预设</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stylePresets).map(([id, preset]) => (
              <ToggleChip
                key={id}
                active={Boolean(presets[id])}
                label={preset.name}
                title={preset.description}
                onClick={() => onPresetToggle(id, !presets[id])}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>文字工具</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.entries(textStyleTools).map(([id, tool]) => (
              <ActionChip
                key={id}
                label={tool.name}
                title={tool.description}
                onClick={() => onApplyTextTool(id)}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>风格包</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stylePacks).map(([id, pack]) => (
              <ActionChip
                key={id}
                label={pack.name}
                title={pack.description}
                onClick={() => onApplyStylePack(id)}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>高级技巧</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tricks).map(([id, trick]) => (
              <ActionChip
                key={id}
                label={trick.name}
                title={trick.description}
                onClick={() => onApplyTrick(id)}
              />
            ))}
          </div>
        </div>

      </div>
    </SidebarCard>
  );
}
