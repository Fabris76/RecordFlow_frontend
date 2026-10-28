import { apiRequest } from './api';

export const getVendors = ({ status, search } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.set('status', status);
  if (search?.trim()) params.set('search', search.trim());
  const query = params.toString();
  return apiRequest(`/vendors${query ? `?${query}` : ''}`);
};
export const getVendor = (id) => apiRequest(`/vendors/${id}`);
export const createVendor = (data) => apiRequest('/vendors', { method: 'POST', body: data });
export const updateVendor = (id, data) => apiRequest(`/vendors/${id}`, { method: 'PUT', body: data });
export const updateVendorStatus = (id, status) => apiRequest(`/vendors/${id}/status`, { method: 'PATCH', body: { status } });
export const deleteAllVendors = () => apiRequest('/vendors/all', { method: 'DELETE', body: { confirmation: 'DELETE_ALL_VENDORS' } });
