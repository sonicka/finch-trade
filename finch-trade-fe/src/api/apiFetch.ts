const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Wraps fetch to:
 *  - automatically attach the Authorization header from the stored token
 *  - automatically set Content-Type for JSON bodies
 *  - throw a normalized Error on non-2xx responses
 */
export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // some endpoints may not return a JSON body
  }

  if (!response.ok) {
    const message =
      (data as { message?: string; error?: string })?.message ??
      (data as { message?: string; error?: string })?.error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};
