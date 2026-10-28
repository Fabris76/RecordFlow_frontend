export const formatMoney = (value) => `GH₵${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatNumber = (value) => Number(value || 0).toLocaleString('en-GH');
export const formatDateLabel = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
export const todayLabel = () => new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const dateDaysAgo = (days) => { const date = new Date(); date.setDate(date.getDate() - days); return localDate(date); };
// New utility: format a date string/value to a readable Ghanaian date format
export const formatDate = (value) => {
  if (!value) return '';
  // Accept ISO string or timestamp
  const date = new Date(value);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
};
