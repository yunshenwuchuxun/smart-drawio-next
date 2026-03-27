import LoadingOverlay from '@/components/LoadingOverlay';
import {
  FILE_STATUS,
  SUPPORTED_TEXT_FILE_EXTENSIONS,
} from '@/lib/chat-panel-utils';

import ChatSelectors from './ChatSelectors';

function FileStatusCard({ fileState, isGenerating }) {
  if (!fileState.file) {
    return null;
  }

  const toneClassName = fileState.status === FILE_STATUS.SUCCESS
    ? 'bg-green-50 border-green-200'
    : fileState.status === FILE_STATUS.ERROR
      ? 'bg-red-50 border-red-200'
      : 'bg-blue-50 border-blue-200';

  return (
    <div className={`mt-6 w-full max-w-md p-4 rounded border ${toneClassName}`}>
      <div className="flex items-center space-x-3">
        {fileState.status === FILE_STATUS.PARSING ? (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : null}

        {fileState.status === FILE_STATUS.SUCCESS ? (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : null}

        {fileState.status === FILE_STATUS.ERROR ? (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : null}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{fileState.file.name}</p>

          {fileState.status === FILE_STATUS.SUCCESS && !isGenerating ? (
            <p className="text-xs text-green-600 mt-1">文件已解析完成，可以开始生成。</p>
          ) : null}

          {fileState.status === FILE_STATUS.SUCCESS && isGenerating ? (
            <p className="text-xs text-blue-600 mt-1">正在根据文件内容生成图表…</p>
          ) : null}

          {fileState.status === FILE_STATUS.ERROR ? (
            <p className="text-xs text-red-600 mt-1">{fileState.error}</p>
          ) : null}

          {fileState.status === FILE_STATUS.PARSING ? (
            <p className="text-xs text-blue-600 mt-1">正在解析文件…</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function FileUploadPanel({
  chartType,
  fileInputRef,
  fileState,
  isGenerating,
  onChartTypeChange,
  onFileChange,
  onGenerate,
  onOpenFilePicker,
  onStop,
  onThemeChange,
  theme,
  themes,
}) {
  const isBusy = isGenerating || fileState.status === FILE_STATUS.PARSING;
  const canGenerate = fileState.status === FILE_STATUS.SUCCESS && Boolean(fileState.content);

  return (
    <div className="flex-1 flex flex-col items-center p-4 relative">
      <ChatSelectors
        chartType={chartType}
        onChartTypeChange={onChartTypeChange}
        theme={theme}
        onThemeChange={onThemeChange}
        themes={themes}
        includeTheme
        chartTypeId="chart-type-file"
        themeId="theme-select-file"
        disabled={isBusy}
        className="w-full max-w-md mb-6"
      />

      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-2">上传 Markdown 或文本文件</p>
        <p className="text-xs text-gray-400">
          支持 {SUPPORTED_TEXT_FILE_EXTENSIONS.join(', ')}，最大 10MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_TEXT_FILE_EXTENSIONS.join(',')}
        onChange={onFileChange}
        className="hidden"
        disabled={isBusy}
      />

      <button
        type="button"
        onClick={onOpenFilePicker}
        disabled={isBusy}
        className="px-6 py-3 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
      >
        {isBusy ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}

        <span>
          {fileState.status === FILE_STATUS.PARSING ? '解析中…' : isGenerating ? '生成中…' : '选择文件'}
        </span>
      </button>

      <FileStatusCard fileState={fileState} isGenerating={isGenerating} />

      {fileState.status === FILE_STATUS.SUCCESS ? (
        <div className="mt-4 w-full max-w-md">
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>停止生成</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>开始生成</span>
            </button>
          )}
        </div>
      ) : null}

      <LoadingOverlay
        isVisible={isGenerating || fileState.status === FILE_STATUS.PARSING}
        message={fileState.status === FILE_STATUS.PARSING ? '正在解析文件…' : '正在生成图表…'}
      />
    </div>
  );
}