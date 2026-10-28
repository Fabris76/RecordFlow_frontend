import React, { useEffect } from 'react';

/**
 * Simple notification component used by pages to show success / error messages.
 * It expects `type` ('success' | 'error') and `message` props. The component
 * renders a styled banner and automatically disappears after a short timeout.
 *
 * Static helper methods `Notification.success(msg)` and `Notification.error(msg)`
 * are provided for legacy usage; they simply invoke `alert(msg)`.
 */
function Notification({ type = 'success', message, onClose }) {
  const bgClass = type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  const borderClass = type === 'error' ? 'border-red-400' : 'border-green-400';

  // Auto‑close after 5 seconds if onClose is provided
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <div className={`border ${borderClass} ${bgClass} px-4 py-2 rounded mb-4`}>
      {message}
    </div>
  );
}

// Legacy static helpers used by closing pages
Notification.success = (msg) => alert(msg);
Notification.error = (msg) => alert(msg);

export default Notification;
