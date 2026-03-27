'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'warning',
}) {
  const typeStyles = {
    warning: { message: 'text-yellow-700', variant: 'primary' },
    danger: { message: 'text-red-700', variant: 'danger' },
    info: { message: 'text-blue-700', variant: 'primary' },
  };

  const styles = typeStyles[type] || typeStyles.warning;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className={`mb-6 text-sm ${styles.message}`}>{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={styles.variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
