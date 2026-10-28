import { apiRequest } from './api';

export const getMyReconciliation = (date) =>
  apiRequest(`/reconciliation/me?date=${encodeURIComponent(date)}`);

export const getOwnerReconciliation = ({ date, vendorId } = {}) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (vendorId) params.set('vendor_id', vendorId);
  return apiRequest(`/reconciliation?${params.toString()}`);
};