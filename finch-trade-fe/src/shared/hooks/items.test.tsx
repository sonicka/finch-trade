import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addItem, deleteItem } from '../../api/api';
import { useManageItem } from './items';

const mocks = vi.hoisted(() => ({
  getAllItems: vi.fn(),
  user: { id: 1 },
}));

vi.mock('../../api/api', () => ({
  addItem: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock('../context/UserProvider', () => ({
  useUser: () => mocks.user,
  userDataQueryKeys: {
    items: (userId: number) => ['userData', userId, 'items'],
    trades: (userId: number) => ['userData', userId, 'trades'],
  },
}));

vi.mock('../context/DataProvider', () => ({
  useItems: () => [[], mocks.getAllItems],
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
};

describe('useManageItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addItem).mockResolvedValue({ message: 'Item added' });
    vi.mocked(deleteItem).mockResolvedValue({ message: 'Item removed' });
    mocks.getAllItems.mockResolvedValue(undefined);
  });

  it('exposes mutation failures and clears them after a successful retry', async () => {
    const { result } = renderHook(() => useManageItem(), {
      wrapper: createWrapper(),
    });
    vi.mocked(addItem).mockRejectedValueOnce(new Error('Could not add item'));

    await act(async () => {
      await result.current.addNewItem('Leaf', 4, 'wishlist');
    });

    await waitFor(() =>
      expect(result.current.error).toBe('Could not add item'),
    );

    await act(async () => {
      await result.current.addNewItem('Leaf', 4, 'wishlist');
    });

    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it('clears the mutation error with clearMessage', async () => {
    const { result } = renderHook(() => useManageItem(), {
      wrapper: createWrapper(),
    });
    vi.mocked(deleteItem).mockRejectedValueOnce(new Error('Could not remove item'));

    await act(async () => {
      await result.current.removeItem(1, 4, 'wishlist');
    });

    await waitFor(() =>
      expect(result.current.error).toBe('Could not remove item'),
    );

    act(() => result.current.clearMessage());

    expect(result.current.error).toBeNull();
  });
});
