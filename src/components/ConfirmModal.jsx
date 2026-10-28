import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * Simple accessible confirmation modal.
 * Props:
 *  - isOpen: boolean – whether the modal is visible
 *  - title: string – header text
 *  - children: ReactNode – body content (usually summary)
 *  - onCancel: () => void – called when user clicks Cancel or closes the modal
 *  - onConfirm: () => void – called when user clicks Confirm
 *  - confirmLabel?: string – button text for confirm (default "Confirm")
 *  - cancelLabel?: string – button text for cancel (default "Cancel")
 */
export default function ConfirmModal({
  isOpen,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  className = '',
  overlayClassName = '',
  confirmDisabled = false,
}) {
  const overlayRef = useRef(null);
  const previouslyFocused = useRef(null);

  // trap focus when opened
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement;
    const focusable = overlayRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable && focusable.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previouslyFocused.current && previouslyFocused.current.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`bg-white rounded shadow-lg max-w-lg w-full p-6 ${className}`}>
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          {title}
        </h2>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onConfirm}
            disabled={confirmDisabled}
            aria-busy={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
