export default function JsonErrorBanner({ error, onClear }) {
  if (!error) {
    return null;
  }

  return (
    <div className="absolute bottom-0 z-10 border-b border-red-200 px-4 py-3 flex items-start justify-between bg-white">
      <div className="flex items-start space-x-2">
        <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-red-700 mt-1 font-mono text-xs">{error}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-red-600 hover:text-red-800 transition-colors ml-2"
        aria-label="Dismiss JSON error"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}