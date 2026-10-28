import { apiRequest } from './api';

export const getVendorDashboard = () => apiRequest('/analytics/vendor-dashboard');
export const getRecentVendorTransactions = () => apiRequest('/transactions/my?limit=5&sort_by=created_at&sort_order=desc');
