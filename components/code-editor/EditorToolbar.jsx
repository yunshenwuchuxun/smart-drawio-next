function Spinner({ className = 'w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' }) {
  return <div className={className} />;
}

function ActionButton({
  children,
  className,
  disabled,
  onClick,
  style,
  title,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium rounded transition-colors duration-200 flex items-center gap-2 ${className}`}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({
  canContinue,
  hasCode,
  isApplyingCode,
  isGenerating,
  isOptimizingCode,
  isTruncated,
  onAdvancedOptimize,
  onApply,
  onClear,
  onContinue,
  onOptimize,
}) {
  const isBusy = isGenerating || isApplyingCode || isOptimizingCode;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700">生成的代码</h3>

      <div className="flex space-x-2">
        <ActionButton
          onClick={onClear}
          disabled={isBusy}
          className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="清空当前代码"
        >
          <span>清除</span>
          {isGenerating ? <Spinner className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : null}
        </ActionButton>

        {isTruncated ? (
          <ActionButton
            onClick={onContinue}
            disabled={!canContinue || isGenerating}
            className="text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="继续生成剩余代码"
          >
            {isGenerating ? (
              <>
                <Spinner />
                <span>生成中…</span>
              </>
            ) : (
              <>
                <span>继续生成</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                </svg>
              </>
            )}
          </ActionButton>
        ) : null}

        <ActionButton
          onClick={onOptimize}
          disabled={isBusy || !hasCode}
          className="text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          style={{
            background: (isBusy || !hasCode) ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
          title="优化图表布局和连线"
        >
          {isOptimizingCode ? (
            <>
              <Spinner />
              <span>优化中…</span>
            </>
          ) : (
            <span>优化</span>
          )}
        </ActionButton>

        <ActionButton
          onClick={onAdvancedOptimize}
          disabled={isBusy || !hasCode}
          className="text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          style={{
            background: isBusy ? '#d1d5db' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
          title="打开高级优化面板"
        >
          <span>高级优化</span>
        </ActionButton>

        <ActionButton
          onClick={onApply}
          disabled={isBusy || !hasCode}
          className="text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          title="应用当前代码到画布"
        >
          {isApplyingCode ? (
            <>
              <Spinner />
              <span>应用中…</span>
            </>
          ) : (
            <>
              <span>应用</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </ActionButton>
      </div>
    </div>
  );
}
