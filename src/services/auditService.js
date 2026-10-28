import { apiRequest } from './api';

export const getAuditLogs = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')).toString();
  return apiRequest(`/audit${query ? `?${query}` : ''}`);
};
