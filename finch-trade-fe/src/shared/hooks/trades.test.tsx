import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useManageTrade } from './trades';
import {
  cancelTrade,
  deleteItem,
  finishGifting,
  finishTrade,
  requestTrade,
} from '../../api/api';

vi.mock('../../api/api', () => ({
  cancelTrade: vi.fn(),
  deleteItem: vi.fn(),
  finishGifting: vi.fn(),
  finishTrade: vi.fn(),
  requestTrade: vi.fn(),
}));

vi.mock('../context/UserProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../context/UserProvider')>()),
  useUser: () => ({ id: 1 }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateQueries };
};

describe('useManageTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cancelTrade).mockResolvedValue({});
    vi.mocked(requestTrade).mockResolvedValue({});
    vi.mocked(finishTrade).mockResolvedValue({});
    vi.mocked(finishGifting).mockResolvedValue({});
    vi.mocked(deleteItem).mockResolvedValue({ message: 'removed' });
  });

  it('requests a trade and invalidates the trades query', async () => {
    const { wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useManageTrade(), { wrapper });
    const chosenItems = { my: { id: 1, colorId: 2 }, their: null };

    await act(async () => {
      await result.current.requestTrade(7, chosenItems);
    });

    it('cancels a pending trade and refreshes the trade and item queries', async () => {
      const { wrapper, invalidateQueries } = createWrapper();
      const { result } = renderHook(() => useManageTrade(), { wrapper });

      await act(async () => {
        await result.current.cancelTrade(42);
      });

      expect(cancelTrade).toHaveBeenCalledWith(42);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['userData', 1, 'trades'],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['userData', 1, 'items'],
      });
    });

    expect(requestTrade).toHaveBeenCalledWith(7, chosenItems);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['userData', 1, 'trades'],
    });
    expect(result.current.error).toBeNull();
  });

  it('finishes a gift with all gift details', async () => {
    const { wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useManageTrade(), { wrapper });

    await act(async () => {
      await result.current.finishGifting(1, 2, 3, 4);
    });

    expect(finishGifting).toHaveBeenCalledWith(1, 2, 3, 4);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['userData', 1, 'trades'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['userData', 1, 'items'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['userData', 1, 'pastTrades'],
    });
  });

  it('exposes mutation failures and clears them after a successful retry', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useManageTrade(), { wrapper });
    vi.mocked(requestTrade).mockRejectedValueOnce(new Error('Trade failed'));
    const chosenItems = { my: { id: 1, colorId: 2 }, their: null };

    await act(async () => {
      await result.current.requestTrade(7, chosenItems);
    });

    await waitFor(() => expect(result.current.error).toBe('Trade failed'));

    await act(async () => {
      await result.current.requestTrade(7, chosenItems);
    });

    await waitFor(() => expect(result.current.error).toBeNull());
  });
});
