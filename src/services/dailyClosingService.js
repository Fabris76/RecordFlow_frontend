import { apiRequest } from './api';

// Daily Closing Service
export const getTodayStatus = () =>
  apiRequest('/daily-closing/today', { method: 'GET' });

export const createClosing = (closingDate) =>
  apiRequest('/daily-closing', { method: 'POST', body: { closing_date: closingDate } });
export const reopenClosing = (closingId) =>
  apiRequest(`/daily-closing/${closingId}/reopen`, { method: 'POST' });

export const getMyClosings = (params = {}) =>
  apiRequest('/daily-closing/my', { method: 'GET', query: params });

export const getAllClosings = (params = {}) =>
  apiRequest('/daily-closing', { method: 'GET', query: params });

export const getClosingById = (id) =>
  apiRequest(`/daily-closing/${id}`, { method: 'GET' });
