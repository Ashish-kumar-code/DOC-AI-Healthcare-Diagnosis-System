import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', loading }) {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        {message && <p className="text-sm text-text-secondary mb-6">{message}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-outline" disabled={loading}>{cancelLabel}</button>
          <button onClick={onConfirm} className={btnClass} disabled={loading}>
            {loading && <span className="spinner spinner-sm mr-2" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
