import LoadingOverlay from '@/components/LoadingOverlay';

import ChatSelectors from './ChatSelectors';

export default function TextInputPanel({
  chartType,
  input,
  isGenerating,
  onChartTypeChange,
  onInputChange,
  onKeyDown,
  onStop,
  onSubmit,
  onThemeChange,
  textareaRef,
  theme,
  themes,
}) {
  return (
    <div className="flex-1 flex flex-col p-4 relative">
      <form onSubmit={onSubmit} className="flex-1 flex flex-col">
        <ChatSelectors
          chartType={chartType}
          onChartTypeChange={onChartTypeChange}
          theme={theme}
          onThemeChange={onThemeChange}
          themes={themes}
          includeTheme
          chartTypeId="chart-type-text"
          themeId="theme-select-text"
          disabled={isGenerating}
          className="mb-3"
        />

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="描述你想生成的图表、结构或信息层级…"
            className="w-full h-full pl-3 pr-12 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none text-sm scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            disabled={isGenerating}
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="absolute right-2 bottom-2 p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
              title="停止生成"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 bottom-2 p-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              title="发送请求"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </form>

      <LoadingOverlay isVisible={isGenerating} message="正在生成图表…" />
    </div>
  );
}