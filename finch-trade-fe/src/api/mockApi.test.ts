import { beforeEach, describe, expect, it } from 'vitest';
import type { Trader } from '../shared/types';
import { mockApiFetch, resetMockState } from './mockApi';

describe('mock trade flow', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('lets the requester and recipient complete the same trade', async () => {
    const login = async (email: string) => {
      const response = (await mockApiFetch('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'demo123' }),
      })) as { token: string };
      localStorage.setItem('authToken', response.token);
    };

    await login('demo1@finchtrade.local');
    const requesterTrade = ((await mockApiFetch('/api/trades')) as Trader[])[0];
    expect(requesterTrade.recentlyTraded).toBe(false);

    await login('demo2@finchtrade.local');
    const noahTradelist = (await mockApiFetch(
      '/api/items/tradelist',
    )) as Array<{
      item_id: number;
      color: number;
    }>;
    expect(noahTradelist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ item_id: 1, color: 11 }),
        expect.objectContaining({ item_id: 8, color: 4 }),
      ]),
    );
    expect(noahTradelist.some((item) => item.color === 1)).toBe(false);
    const recipientTrade = ((await mockApiFetch('/api/trades')) as Trader[])[0];
    expect(recipientTrade.recentlyTraded).toBe(false);

    await mockApiFetch('/api/trades/requestTrade?userId2=1', {
      method: 'POST',
      body: JSON.stringify({
        chosenItems: {
          my: { id: 1, colorId: 11 },
          their: { id: 2, colorId: 6 },
        },
      }),
    });
    const confirmedTrade = ((await mockApiFetch('/api/trades')) as Trader[])[0];
    expect(confirmedTrade.status).toBe('pending');

    await mockApiFetch('/api/trades/finishTrade/1', { method: 'POST' });
    const waitingTrade = ((await mockApiFetch('/api/trades')) as Trader[])[0];
    expect(waitingTrade.finishedByMe).toBe(true);

    await login('demo1@finchtrade.local');
    await mockApiFetch('/api/trades/finishTrade/1', { method: 'POST' });
    expect(
      ((await mockApiFetch('/api/trades')) as Trader[]).some(
        (trade) => trade.tradeId === 1,
      ),
    ).toBe(false);
    expect(await mockApiFetch('/api/trades/past')).toHaveLength(1);
  });

  it('allows different colors for the same item', async () => {
    const loginResponse = (await mockApiFetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'demo1@finchtrade.local',
        password: 'demo123',
      }),
    })) as { token: string };
    localStorage.setItem('authToken', loginResponse.token);

    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Classic Diner Sundae',
        color: 2,
        listType: 'wishlist',
      }),
    });
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Classic Diner Sundae',
        color: 3,
        listType: 'wishlist',
      }),
    });

    const wishlist = (await mockApiFetch('/api/items/wishlist')) as Array<{
      item_id: number;
      color: number;
    }>;
    expect(
      wishlist.filter((item) => item.item_id === 2).map((item) => item.color),
    ).toEqual([2, 3]);

    await expect(
      mockApiFetch('/api/items/add', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Preppy Vintage Dress',
          color: 1,
          listType: 'tradelist',
        }),
      }),
    ).rejects.toThrow('Tradelist items must have a specific color.');
  });

  it('returns user lists alphabetically after adding an item', async () => {
    const loginResponse = (await mockApiFetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'demo1@finchtrade.local',
        password: 'demo123',
      }),
    })) as { token: string };
    localStorage.setItem('authToken', loginResponse.token);

    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Classic Diner Visor',
        color: 2,
        listType: 'tradelist',
      }),
    });

    const tradelist = (await mockApiFetch('/api/items/tradelist')) as Array<{
      name: string;
    }>;
    const names = tradelist.map((item) => item.name);
    expect(names[0]).toBe('Classic Diner Sundae');
    expect(names).toEqual(
      [...names].sort((first, second) =>
        first.localeCompare(second, undefined, { sensitivity: 'base' }),
      ),
    );
  });

  it('returns item options alphabetically after adding an item', async () => {
    const loginResponse = (await mockApiFetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'demo1@finchtrade.local',
        password: 'demo123',
      }),
    })) as { token: string };
    localStorage.setItem('authToken', loginResponse.token);

    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Classic Diner Visor',
        color: 2,
        listType: 'wishlist',
      }),
    });

    const allItems = (await mockApiFetch('/api/items')) as Array<{
      name: string;
    }>;
    const names = allItems.map((item) => item.name);
    expect(names[0]).toBe('Classic Diner Roller Skates');
    expect(names).toEqual(
      [...names].sort((first, second) =>
        first.localeCompare(second, undefined, { sensitivity: 'base' }),
      ),
    );
  });

  it('shows a new potential trade from reciprocal list matches', async () => {
    const signUp = async (email: string) => {
      const response = (await mockApiFetch('/api/users/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          username: email.split('@')[0],
          birbName: 'Demo birb',
          friendCode: 'DEMO123',
          password: 'demo123',
        }),
      })) as { token: string };
      localStorage.setItem('authToken', response.token);
    };

    await signUp('potential1@finchtrade.local');
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Neck Ribbon',
        color: 2,
        listType: 'wishlist',
      }),
    });
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Heels',
        color: 2,
        listType: 'tradelist',
      }),
    });
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Dress',
        color: 2,
        listType: 'wishlist',
      }),
    });

    await signUp('potential2@finchtrade.local');
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Heels',
        color: 2,
        listType: 'wishlist',
      }),
    });
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Neck Ribbon',
        color: 2,
        listType: 'tradelist',
      }),
    });

    const potentialTrades = (await mockApiFetch('/api/trades')) as Trader[];
    const reciprocalTrade = potentialTrades.find((trade) => trade.userId === 3);
    expect(reciprocalTrade).toMatchObject({
      userId: 3,
      tradeId: 0,
      recentlyTraded: false,
    });
    expect(reciprocalTrade?.wants).toEqual([
      { userId: 3, itemId: 9, colorId: 2 },
    ]);
    expect(reciprocalTrade?.has).toEqual([
      { userId: 3, itemId: 8, colorId: 2 },
    ]);
  });

  it('shows a wishlist match as a gifting opportunity', async () => {
    const signUp = async (email: string, username: string) => {
      const response = (await mockApiFetch('/api/users/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          username,
          birbName: 'Demo birb',
          friendCode: 'GIFT123',
          password: 'demo123',
        }),
      })) as { token: string };
      localStorage.setItem('authToken', response.token);
    };

    await signUp('recipient@finchtrade.local', 'recipient');
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Neck Ribbon',
        color: 2,
        listType: 'wishlist',
      }),
    });

    await signUp('gifting@finchtrade.local', 'gifting');
    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Neck Ribbon',
        color: 2,
        listType: 'tradelist',
      }),
    });

    const giftingTrades = (await mockApiFetch('/api/trades')) as Trader[];
    const giftingOpportunity = giftingTrades.find(
      (trade) => trade.userId === 3,
    );
    expect(giftingOpportunity).toMatchObject({
      tradeId: 0,
      has: [],
      recentlyTraded: false,
    });
    expect(giftingOpportunity?.wants).toEqual([
      { userId: 3, itemId: 9, colorId: 2 },
    ]);

    await mockApiFetch('/api/trades/finishGifting', {
      method: 'POST',
      body: JSON.stringify({
        giftedBy: 4,
        giftedTo: 3,
        itemId: 9,
        colorId: 2,
      }),
    });

    const pastTrades = (await mockApiFetch('/api/trades/past')) as Array<{
      itemId?: number;
      type: string;
      userId?: number;
    }>;
    expect(pastTrades).toContainEqual(
      expect.objectContaining({
        itemId: 9,
        type: 'giftGiven',
        userId: 3,
      }),
    );
    expect(await mockApiFetch('/api/items/tradelist')).toEqual([]);

    await mockApiFetch('/api/items/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Preppy Vintage Dress',
        color: 2,
        listType: 'tradelist',
      }),
    });
  });
});
