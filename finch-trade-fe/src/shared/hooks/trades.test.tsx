import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useManageTrade } from './trades';
import {
  deleteItem,
  finishGifting,
  finishTrade,
  requestTrade,
} from '../../api/api';

const getUserItems = vi.fn();
const refetchTrades = vi.fn();

vi.mock('../../api/api', () => ({
  deleteItem: vi.fn(),
  finishGifting: vi.fn(),
  finishTrade: vi.fn(),
  requestTrade: vi.fn(),
}));

vi.mock('../context/UserProvider', () => ({
  useUserItems: () => [[], getUserItems],
  useTrades: () => ({ getTrades: refetchTrades }),
}));

describe('useManageTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requestTrade).mockResolvedValue({});
    vi.mocked(finishTrade).mockResolvedValue({});
    vi.mocked(finishGifting).mockResolvedValue({});
    vi.mocked(deleteItem).mockResolvedValue({ message: 'removed' });
  });

  it('requests a trade and refreshes related data', async () => {
    const { result } = renderHook(() => useManageTrade());
    const chosenItems = { my: { id: 1, colorId: 2 }, their: null };

    await act(async () => {
      await result.current.requestTrade(7, chosenItems);
    });

    expect(requestTrade).toHaveBeenCalledWith(7, chosenItems);
    expect(refetchTrades).toHaveBeenCalledOnce();
    expect(getUserItems).toHaveBeenCalledOnce();
    expect(result.current.error).toBeNull();
  });

  it('finishes a gift with all gift details', async () => {
    const { result } = renderHook(() => useManageTrade());

    await act(async () => {
      await result.current.finishGifting(1, 2, 3, 4);
    });

    expect(finishGifting).toHaveBeenCalledWith(1, 2, 3, 4);
    expect(refetchTrades).toHaveBeenCalledOnce();
    expect(getUserItems).toHaveBeenCalledOnce();
  });
});
