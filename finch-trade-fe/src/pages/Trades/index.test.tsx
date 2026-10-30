import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Trades from './index';
import { PastGift, Trader, User } from '../../shared/types';

const mocks = vi.hoisted(() => ({
  finishGifting: vi.fn(),
  finishTrade: vi.fn(),
  pastTrades: [] as PastGift[],
  requestTrade: vi.fn(),
  tradeError: null as string | null,
  trades: [] as Trader[],
  trader: undefined as User | undefined,
  user: {
    id: 1,
    username: 'Maya',
    birbName: 'Pip',
    friendCode: 'MAYA123',
    email: 'maya@example.com',
  },
}));

vi.mock('../../shared/context/UserProvider', () => ({
  useUser: () => mocks.user,
  useTrades: () => ({
    trades: mocks.trades,
    pastTrades: mocks.pastTrades,
  }),
}));

vi.mock('../../shared/context/DataProvider', () => ({
  useColors: () => [
    { id: 4, color: 'white' },
    { id: 6, color: 'orange' },
  ],
  useItems: () => [
    [
      { id: 1, name: 'Leaf' },
      { id: 2, name: 'Mushroom' },
    ],
    vi.fn(),
  ],
}));

vi.mock('../../shared/hooks/users', () => ({
  useUserById: () => mocks.trader,
}));

vi.mock('../../shared/hooks/trades', () => ({
  useManageTrade: () => ({
    requestTrade: mocks.requestTrade,
    finishTrade: mocks.finishTrade,
    finishGifting: mocks.finishGifting,
    error: mocks.tradeError,
  }),
}));

const traderProfile: User = {
  id: 2,
  username: 'Noah',
  birbName: 'Juniper',
  friendCode: 'NOAH456',
};

const makeTrader = (overrides: Partial<Trader> = {}): Trader => ({
  tradeId: 42,
  userId: 2,
  wants: [{ userId: 1, itemId: 1, colorId: 4 }],
  has: [{ userId: 2, itemId: 2, colorId: 6 }],
  recentlyTraded: false,
  ...overrides,
});

const renderTrades = () => render(<Trades />);

describe('Trades page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pastTrades = [];
    mocks.trader = traderProfile;
    mocks.trades = [makeTrader()];
    mocks.tradeError = null;
  });

  it('accepts an incoming request with the requested items', async () => {
    mocks.trades = [
      makeTrader({
        status: 'pending',
        requestedByMe: false,
        requestedTrade: {
          userId1: 1,
          itemId1: 2,
          colorId1: 6,
          userId2: 2,
          itemId2: 1,
          colorId2: 4,
        },
      }),
    ];
    renderTrades();

    expect(screen.getByText(/Noah requested a trade!/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Accept trade request' }),
    );

    await waitFor(() =>
      expect(mocks.requestTrade).toHaveBeenCalledWith(2, {
        my: { id: 1, colorId: 4 },
        their: { id: 2, colorId: 6 },
      }),
    );
  });

  it('finishes an accepted trade and refreshes past trades', async () => {
    mocks.trades = [
      makeTrader({
        status: 'confirmed',
        requestedByMe: true,
        requestedTrade: {
          userId1: 1,
          itemId1: 2,
          colorId1: 6,
          userId2: 2,
          itemId2: 1,
          colorId2: 4,
        },
      }),
    ];
    renderTrades();

    expect(screen.getByText(/NOAH456/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finish trade' }));

    await waitFor(() => {
      expect(mocks.finishTrade).toHaveBeenCalledWith(42, {
        my: { id: 2, colorId: 6 },
        their: { id: 1, colorId: 4 },
      });
    });
  });

  it('reveals the friend code before finishing a gift', async () => {
    mocks.trades = [makeTrader({ has: [] })];
    renderTrades();

    fireEvent.click(screen.getByRole('radio', { name: /Leaf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Show friend code' }));

    expect(screen.getByText(/NOAH456/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finish gifting' }));

    await waitFor(() => {
      expect(mocks.finishGifting).toHaveBeenCalledWith(1, 2, 1, 4);
    });
  });

  it('renders trade mutation errors in the relevant trader card', () => {
    mocks.tradeError = 'Could not finish the trade.';
    renderTrades();

    expect(screen.getByText('Could not finish the trade.')).toBeInTheDocument();
  });

  it('shows the empty state and toggles past trades', async () => {
    mocks.trades = [];
    mocks.pastTrades = [
      {
        id: 8,
        userId: 2,
        itemId: 1,
        colorId: 4,
        archivedAt: '2026-10-01T12:00:00.000Z',
        type: 'giftGiven',
      },
    ];
    renderTrades();

    expect(
      screen.getByText('No trades available at the moment.'),
    ).toBeInTheDocument();
    expect(screen.getByText('You gifted')).toBeInTheDocument();

    const pastTradesButton = screen.getByRole('button', {
      name: 'Past trades',
    });
    expect(pastTradesButton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(pastTradesButton);
    expect(pastTradesButton).toHaveAttribute('aria-expanded', 'false');
  });
});
