'use client';

import { useCallback, useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  const dialogRef = useRef(null);
  const backdropMouseDownRef = useRef(false);

  const shouldIgnoreBackdropClose = useCallback(() => {
    if (!dialogRef.current || typeof window === 'undefined') {
      return false;
    }

    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        return true;
      }
    }

    const selection = window.getSelection?.();
    if (!selection || selection.isCollapsed) {
      return false;
    }

    const normalizeNode = (node) => (node?.nodeType === Node.TEXT_NODE ? node.parentNode : node);
    const anchor = normalizeNode(selection.anchorNode);
    const focus = normalizeNode(selection.focusNode);

    return Boolean(
      (anchor && dialogRef.current.contains(anchor)) ||
      (focus && dialogRef.current.contains(focus))
    );
  }, []);

  const handleBackdropMouseDown = useCallback((event) => {
    backdropMouseDownRef.current = event.target === event.currentTarget;
  }, []);

  const handleBackdropClick = useCallback(() => {
    const shouldClose = backdropMouseDownRef.current;
    backdropMouseDownRef.current = false;

    if (!shouldClose) {
      return;
    }

    if (shouldIgnoreBackdropClose()) {
      return;
    }

    onClose();
  }, [onClose, shouldIgnoreBackdropClose]);
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-auto rounded-lg bg-white shadow-xl`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || '弹窗'}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
              aria-label="关闭弹窗"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
