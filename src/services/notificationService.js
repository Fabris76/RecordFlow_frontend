import { apiRequest } from './api';

export const getNotifications = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')).toString();
  return apiRequest(`/notifications${query ? `?${query}` : ''}`);
};

export const markNotificationRead = (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = () => apiRequest('/notifications/read-all', { method: 'PATCH' });
export const deleteNotification = (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' });
