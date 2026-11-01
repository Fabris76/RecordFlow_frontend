import { apiRequest } from './api';

const buildQuery = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  return query ? `?${query}` : '';
};

// Daily Closing Service
export const getTodayStatus = () =>
  apiRequest('/daily-closing/today', { method: 'GET' });

export const createClosing = (closingDate) =>
  apiRequest('/daily-closing', { method: 'POST', body: { closing_date: closingDate } });
export const reopenClosing = (closingId) =>
  apiRequest(`/daily-closing/${closingId}/reopen`, { method: 'POST' });

export const getMyClosings = (params = {}) =>
  apiRequest(`/daily-closing/my${buildQuery(params)}`, { method: 'GET' });

export const getAllClosings = (params = {}) =>
  apiRequest(`/daily-closing${buildQuery(params)}`, { method: 'GET' });

export const getClosingById = (id) =>
  apiRequest(`/daily-closing/${id}`, { method: 'GET' });
