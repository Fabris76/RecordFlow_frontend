import { API_URL, apiRequest } from './api';

export const getBackups = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')).toString();
  return apiRequest(`/backups${query ? `?${query}` : ''}`);
};

export const createBackup = () => apiRequest('/backups', { method: 'POST' });
export const restoreBackup = (id) => apiRequest(`/backups/${id}/restore`, { method: 'POST', body: { confirmation: 'RESTORE_DATABASE' } });

export const downloadBackup = async (id, filename) => {
  const token = sessionStorage.getItem('momo_token');
  const response = await fetch(`${API_URL}/backups/${id}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error('Backup download is unavailable.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
