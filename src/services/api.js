const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, payload = {}) { super(message); this.name = 'ApiError'; this.status = status; this.payload = payload; }
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...requestOptions } = options;
  const token = sessionStorage.getItem('momo_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  let payload = {};
  try { payload = await response.json(); } catch { /* Empty response bodies are valid for some HTTP errors. */ }
  if (!response.ok) {
    const messages = { 401: 'Your session has expired. Please log in again.', 403: 'You do not have permission to perform this action.', 404: 'The requested resource was not found.', 409: 'This request conflicts with existing data.', 429: 'Too many requests. Please try again later.', 500: 'Something went wrong. Please try again.' };
    throw new ApiError(payload.message || messages[response.status] || 'Unable to complete the request.', response.status, payload);
  }
  return payload;
}

export { API_URL };
