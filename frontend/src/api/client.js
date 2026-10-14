const API_BASE = '/api';

export async function apiRequest(path, options = {}) {
  const { token, body, headers: customHeaders, ...rest } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...(customHeaders || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Помилка запиту');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
