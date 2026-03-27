import { CHART_TYPES } from '@/lib/constants';

export default function ChatSelectors({
  chartType,
  onChartTypeChange,
  theme,
  onThemeChange,
  themes,
  includeTheme = false,
  chartTypeId = 'chat-chart-type',
  themeId = 'chat-theme',
  disabled = false,
  className = '',
}) {
  return (
    <div className={`flex gap-2 ${className}`.trim()}>
      <select
        id={chartTypeId}
        value={chartType}
        onChange={(event) => onChartTypeChange(event.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        disabled={disabled}
      >
        {Object.entries(CHART_TYPES).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {includeTheme && onThemeChange ? (
        <select
          id={themeId}
          value={theme}
          onChange={(event) => onThemeChange(event.target.value)}
          className="w-28 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          disabled={disabled}
        >
          {themes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}