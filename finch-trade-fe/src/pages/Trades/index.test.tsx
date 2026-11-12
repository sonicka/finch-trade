import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Trades from './index';
import { PendingGiftProvider } from '../../shared/context/PendingGiftProvider';
import { PastGift, Trader, User } from '../../shared/types';

const mocks = vi.hoisted(() => ({
  cancelTrade: vi.fn(),
  finishGifting: vi.fn(),
  finishTrade: vi.fn(),
  hasMorePastTrades: false,
  isLoadingMorePastTrades: false,
  loadMorePastTrades: vi.fn(),
  tradesLoading: false,
  tradesError: null as string | null,
  retryTrades: vi.fn(),
  pastTradesLoading: false,
  pastTradesError: null as string | null,
  retryPastTrades: vi.fn(),
  tradeLoading: false,
  pendingAction: undefined as
    | 'request'
    | 'finish-trade'
    | 'finish-gifting'
    | 'cancel-trade'
    | undefined,
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
    tradesLoading: mocks.tradesLoading,
    tradesError: mocks.tradesError,
    retryTrades: mocks.retryTrades,
    pastTradesLoading: mocks.pastTradesLoading,
    pastTradesError: mocks.pastTradesError,
    retryPastTrades: mocks.retryPastTrades,
    hasMorePastTrades: mocks.hasMorePastTrades,
    isLoadingMorePastTrades: mocks.isLoadingMorePastTrades,
    loadMorePastTrades: mocks.loadMorePastTrades,
  }),
}));

vi.mock('../../shared/context/DataProvider', () => ({
  useCatalogStatus: () => ({ isLoading: false, error: null }),
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
    cancelTrade: mocks.cancelTrade,
    requestTrade: mocks.requestTrade,
    finishTrade: mocks.finishTrade,
    finishGifting: mocks.finishGifting,
    error: mocks.tradeError,
    loading: mocks.tradeLoading,
    pendingAction: mocks.pendingAction,
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
  ...overrides,
});

const renderTrades = () =>
  render(
    <PendingGiftProvider>
      <Trades />
    </PendingGiftProvider>,
  );

describe('Trades page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pastTrades = [];
    mocks.hasMorePastTrades = false;
    mocks.isLoadingMorePastTrades = false;
    mocks.tradesLoading = false;
    mocks.tradesError = null;
    mocks.retryTrades = vi.fn();
    mocks.pastTradesLoading = false;
    mocks.pastTradesError = null;
    mocks.retryPastTrades = vi.fn();
    mocks.tradeLoading = false;
    mocks.pendingAction = undefined;
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

  it('shows cancellation beside an incoming request and cancels that trade', async () => {
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

    expect(
      screen.getByRole('button', { name: 'Accept trade request' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel trade' }));

    await waitFor(() => expect(mocks.cancelTrade).toHaveBeenCalledWith(42));
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

  it('keeps a pending gift and friend code visible after leaving and returning', () => {
    mocks.trades = [makeTrader({ has: [] })];
    const { rerender } = renderTrades();

    fireEvent.click(screen.getByRole('radio', { name: /Leaf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Show friend code' }));

    rerender(
      <PendingGiftProvider>
        <div />
      </PendingGiftProvider>,
    );
    rerender(
      <PendingGiftProvider>
        <Trades />
      </PendingGiftProvider>,
    );

    expect(screen.getByRole('radio', { name: /Leaf/ })).toBeChecked();
    expect(screen.getByText(/NOAH456/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Finish gifting' }),
    ).toBeInTheDocument();
  });

  it('shows a regular trade if tradelist items become available after selecting a gift', () => {
    mocks.trades = [makeTrader({ has: [] })];
    const { rerender } = renderTrades();

    fireEvent.click(screen.getByRole('radio', { name: /Leaf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Show friend code' }));

    mocks.trades = [makeTrader()];
    rerender(
      <PendingGiftProvider>
        <Trades />
      </PendingGiftProvider>,
    );

    expect(screen.getByText('Juniper can give you:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Request trade' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NOAH456/)).not.toBeInTheDocument();
  });

  it('renders trade mutation errors in the relevant trader card', () => {
    mocks.tradeError = 'Could not finish the trade.';
    renderTrades();

    expect(screen.getByText('Could not finish the trade.')).toBeInTheDocument();
  });

  it('shows loading and retry states instead of a false empty-trades message', () => {
    mocks.tradesLoading = true;
    const { rerender } = renderTrades();

    expect(
      screen.getByRole('status', { name: 'Loading trades' }),
    ).toBeVisible();
    expect(
      screen.queryByText('No trades available at the moment.'),
    ).not.toBeInTheDocument();

    mocks.tradesLoading = false;
    mocks.tradesError = 'Could not load trades.';
    rerender(
      <PendingGiftProvider>
        <Trades />
      </PendingGiftProvider>,
    );

    expect(screen.getByText('Could not load trades.')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry loading trades' }),
    );
    expect(mocks.retryTrades).toHaveBeenCalledOnce();
    expect(
      screen.queryByText('No trades available at the moment.'),
    ).not.toBeInTheDocument();
  });

  it('does not show the empty-trades message while initial past trades are loading', () => {
    mocks.trades = [];
    mocks.pastTradesLoading = true;
    renderTrades();

    expect(
      screen.getByRole('status', { name: 'Loading trades' }),
    ).toBeVisible();
    expect(
      screen.queryByText('No trades available at the moment.'),
    ).not.toBeInTheDocument();
  });

  it('disables trade actions while a request is pending', () => {
    mocks.tradeLoading = true;
    mocks.pendingAction = 'request';
    renderTrades();

    const requestButton = screen.getByRole('button', {
      name: /Request trade/,
    });
    expect(requestButton).toBeDisabled();
    expect(
      screen.getByRole('status', { name: 'Updating trade' }),
    ).toBeVisible();
  });

  it('keeps gifting radio selections independent for different traders', () => {
    mocks.trades = [
      makeTrader({ has: [] }),
      makeTrader({
        tradeId: 43,
        userId: 3,
        has: [],
        wants: [{ userId: 1, itemId: 2, colorId: 6 }],
      }),
    ];
    renderTrades();

    const leafOption = screen.getByRole('radio', { name: /Leaf/ });
    const mushroomOption = screen.getByRole('radio', { name: /Mushroom/ });
    fireEvent.click(leafOption);
    fireEvent.click(mushroomOption);

    expect(leafOption).toBeChecked();
    expect(mushroomOption).toBeChecked();
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
    const pastTradesList = screen
      .getByText('You gifted')
      .closest('#past-trades-list');
    expect(pastTradesList).toHaveAttribute('aria-hidden', 'false');
    expect(pastTradesList).not.toHaveAttribute('inert');

    fireEvent.click(pastTradesButton);
    expect(pastTradesButton).toHaveAttribute('aria-expanded', 'false');
    expect(pastTradesList).toHaveAttribute('aria-hidden', 'true');
    expect(pastTradesList).toHaveAttribute('inert', '');
  });

  it('loads the next past-trade page on demand', () => {
    mocks.trades = [];
    mocks.hasMorePastTrades = true;
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

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(mocks.loadMorePastTrades).toHaveBeenCalledOnce();
  });
});
