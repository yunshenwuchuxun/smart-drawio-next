import { useEffect } from 'react';

const TYPE_STYLES = {
  success: {
    container: 'bg-green-50 border-green-200',
    title: 'text-green-800',
    message: 'text-green-700',
    icon: '✓',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    title: 'text-red-800',
    message: 'text-red-700',
    icon: '✕',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    icon: '!',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    title: 'text-blue-800',
    message: 'text-blue-700',
    icon: 'ℹ',
  },
};

export default function Notification({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  autoClose = true,
  duration = 3000,
}) {
  useEffect(() => {
    if (!isOpen || !autoClose) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [autoClose, duration, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const styles = TYPE_STYLES[type] || TYPE_STYLES.info;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20" role="status" aria-live="polite">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} role="presentation" />
      <div className={`relative min-w-0 w-full max-w-xs rounded-lg border p-4 shadow-lg ${styles.container}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className={`flex-shrink-0 text-xl ${styles.title}`}>{styles.icon}</span>
            <div className="min-w-0 flex-1">
              {title ? (
                <h3 className={`break-words text-xs font-semibold ${styles.title}`}>{title}</h3>
              ) : null}
              {message ? (
                <p className={`mt-1 break-words whitespace-pre-wrap text-xs ${styles.message}`}>{message}</p>
              ) : null}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`text-gray-400 transition-colors hover:text-gray-600 ${styles.title}`}
            aria-label="关闭通知"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
