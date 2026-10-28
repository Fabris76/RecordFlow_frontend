import { apiRequest } from './api';

export const getDashboard = () => apiRequest('/analytics/dashboard');
export const getActivitySummary = () => apiRequest('/analytics/activity-summary');
export const getUnreadCount = () => apiRequest('/notifications/unread/count');
export const getRecentNotifications = () => apiRequest('/notifications?limit=5&sort_order=desc');
export const getTransactionTypes = (start, end) => apiRequest(`/analytics/transaction-types?start_date=${start}&end_date=${end}`);
export const getTransactionTrend = (start, end) => apiRequest(`/analytics/transaction-trend?start_date=${start}&end_date=${end}`);
export const getVendorPerformance = (start, end) => apiRequest(`/analytics/vendor-performance?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&sort_by=transaction_amount&sort_order=desc`);
export const getAnalyticsComparison = (params) => apiRequest(`/analytics/comparison?${new URLSearchParams(params).toString()}`);
