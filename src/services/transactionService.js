import { apiRequest } from './api';

export const createTransaction = (data, idempotencyKey) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  return apiRequest('/transactions', {
    method: 'POST',
    body: data,
    signal: controller.signal,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  }).catch((error) => {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Transaction status could not be confirmed. Check transaction history before attempting another transaction.');
      timeoutError.code = 'TRANSACTION_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  }).finally(() => clearTimeout(timeout));
};

// Fetch the logged‑in vendor's transactions with optional filters, pagination, and sorting
export const getMyTransactions = (params = {}) => {
  // Params may include: type, status, start_date, end_date, sort_by, sort_order, page, limit, search
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')).toString();
  return apiRequest(`/transactions/my${query ? `?${query}` : ''}`).then((response) => ({
    rows: response.data || [],
    pagination: response.pagination
  }));
};

export const getAllTransactions = (params = {}) => {
  // Same query params as getMyTransactions, hits owner-wide endpoint
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')).toString();
  return apiRequest(`/transactions${query ? `?${query}` : ''}`).then((response) => ({
    rows: response.data || [],
    pagination: response.pagination
  }));
};

// Fetch a single transaction by its ID (vendor‑only ownership enforced by backend)
export const getTransactionById = (id) => {
  return apiRequest(`/transactions/${id}`, { method: 'GET' }).then((response) => response.data);
};

// Update a transaction (editable fields: type, amount, customer_reference)
export const updateTransaction = (id, data) => {
  return apiRequest(`/vendor/transactions/${id}`, { method: 'PUT', body: data });
};

// Retrieve edit history for a transaction
export const getTransactionHistory = (id) => {
  return apiRequest(`/transactions/${id}/history`, { method: 'GET' }).then((response) => response.data || []);
};
