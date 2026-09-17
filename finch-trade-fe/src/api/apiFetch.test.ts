import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './apiFetch';

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('adds the auth and JSON headers and returns the response body', async () => {
    localStorage.setItem('authToken', 'token-123');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    await expect(
      apiFetch('/api/items/add', {
        method: 'POST',
        body: JSON.stringify({ name: 'Leaf' }),
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/items/add`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
      }),
    );
  });

  it('uses the API error message for failed responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Item already exists' }), {
        status: 400,
      }),
    );

    await expect(apiFetch('/api/items/add')).rejects.toThrow(
      'Item already exists',
    );
  });

  it('clears an expired token and redirects to login', async () => {
    localStorage.setItem('authToken', 'expired-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
      }),
    );

    await expect(apiFetch('/api/trades')).rejects.toThrow(
      'Token expired. Please log in again.',
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
