import { apiRequest } from './api';

export const getOwnBalance = () => apiRequest('/balances/me');

export const getOwnBalanceHistory = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/balances/me/history${query ? `?${query}` : ''}`);
};

export const getAllBalances = () => apiRequest('/balances');
export const getOwnerBalanceSummary = () => apiRequest('/balances/summary');
export const getOwnerFunds = () => apiRequest('/balances/owner-funds');
export const adjustOwnerFunds = (data) => apiRequest('/balances/owner-funds/add', { method: 'POST', body: data });
export const allocateOwnerFunds = (vendorId, data) => apiRequest(`/balances/${vendorId}/allocate`, { method: 'POST', body: data });

export const getVendorBalance = (vendorId) => apiRequest(`/balances/${vendorId}`);

export const adjustVendorBalance = (vendorId, data) => apiRequest(`/balances/${vendorId}/adjust`, { method: 'POST', body: data });

export const getAllBalanceHistory = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/balance-history${query ? `?${query}` : ''}`);
};
