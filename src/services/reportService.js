import { apiRequest } from './api';

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, value);
  });
  return search.toString();
};

export const getDailyReport = (date) => apiRequest(`/reports/daily?${query({ date })}`);
export const getTransactionTypesReport = (start_date, end_date) => apiRequest(`/reports/transaction-types?${query({ start_date, end_date })}`);
export const getVendorPerformanceReport = (start_date, end_date) => apiRequest(`/reports/vendors?${query({ start_date, end_date })}`);
export const getDailyTrendReport = (start_date, end_date) => apiRequest(`/reports/daily-trend?${query({ start_date, end_date })}`);
export const getClosingReport = (start_date, end_date) => apiRequest(`/reports/closing?${query({ start_date, end_date })}`);
