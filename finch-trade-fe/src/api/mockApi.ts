import {
  Color,
  Item,
  ListType,
  PastTrades,
  Trader,
  User,
  UserItem,
} from '../shared/types';

const STORAGE_KEY = 'finch-trade-demo-state';
const IGNORE_RECENT_TRADE_LIMIT =
  import.meta.env.VITE_DEMO_IGNORE_RECENT_TRADE_LIMIT === 'true';

interface DemoUser extends User {
  email: string;
  password: string;
}

interface DemoTrade {
  id: number;
  userId1: number;
  itemId1: number;
  colorId1: number;
  userId2: number;
  itemId2: number;
  colorId2: number;
  status: 'pending' | 'confirmed'; // todo check
  requestedBy: number[];
  finishedBy: number[];
}

interface DemoGift {
  id: number;
  giftedBy: number;
  giftedTo: number;
  itemId: number;
  colorId: number;
  archivedAt: string;
}

interface DemoState {
  users: DemoUser[];
  colors: Color[];
  items: Item[];
  userItems: (UserItem & { listType: ListType })[];
  trades: DemoTrade[];
  pastTrades: PastTrades;
  gifts: DemoGift[];
}

const colors: Color[] = [
  'any',
  'black',
  'brown',
  'white',
  'gray',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'blue',
  'green',
].map((color, index) => ({ id: index + 1, color }));

const items: Item[] = [
  'Classic Diner Roller Skates',
  'Classic Diner Sundae',
  'Classic Diner Uniform',
  'Classic Diner Visor',
  'Preppy Vintage Dress',
  'Preppy Vintage Eyeglasses',
  'Preppy Vintage Headband',
  'Preppy Vintage Heels',
  'Preppy Vintage Neck Ribbon',
  'Quirky Vintage Pants',
  'Quirky Vintage Polo',
  'Vintage Drive-in Bed',
  'Vintage Drive-in Clock',
  'Vintage Drive-in Counter',
  'Vintage Drive-in Doormat',
  'Vintage Drive-in Door',
  'Vintage Drive-in Gumball Machine',
  'Vintage Drive-in Lamp',
  'Vintage Drive-in Milkshake Maker',
  'Vintage Drive-in Rug',
  'Vintage Drive-in Sign',
  'Vintage Drive-in Ticket Machine',
  'Vintage Drive-in Wall',
  'Vintage Drive-in Window',
  'Vintage Movie Ticket',
  'Vintage Saddle Shoes',
  'Vintage Soda',
].map((name, index) => ({ id: index + 1, name }));

const seedItems: Array<[number, number, number, ListType, boolean]> = [
  [1, 1, 1, 'wishlist', false],
  [1, 6, 1, 'wishlist', false],
  [1, 4, 11, 'wishlist', false],
  [1, 2, 6, 'tradelist', false],
  [1, 3, 3, 'tradelist', false],
  [1, 7, 11, 'tradelist', false],
  [2, 2, 6, 'wishlist', false],
  [2, 7, 11, 'wishlist', false],
  [2, 5, 1, 'wishlist', false],
  [2, 1, 11, 'tradelist', false],
  [2, 4, 11, 'tradelist', false],
  [2, 8, 4, 'tradelist', false],
];

const createInitialState = (): DemoState => ({
  users: [
    {
      id: 1,
      email: 'demo1@finchtrade.local',
      password: 'demo123',
      username: 'Maya',
      birbName: 'Pip',
      friendCode: 'DEMO1A7Q2',
    },
    {
      id: 2,
      email: 'demo2@finchtrade.local',
      password: 'demo123',
      username: 'Noah',
      birbName: 'Juniper',
      friendCode: 'DEMO2P9R5',
    },
  ],
  colors,
  items,
  userItems: [...seedItems].map(
    ([user_id, item_id, color, listType, isInTrade]) => ({
      user_id,
      item_id,
      color,
      name: items.find((item) => item.id === item_id)?.name ?? '',
      listType,
      isInTrade,
    }),
  ),
  trades: [],
  pastTrades: [],
  gifts: [],
});

const getState = (): DemoState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createInitialState();
  try {
    const parsed = JSON.parse(saved) as DemoState;
    parsed.gifts ??= [];
    if (parsed.trades.length === 0 && parsed.pastTrades.length === 0) {
      parsed.trades = [];
    }
    return parsed;
  } catch {
    return createInitialState();
  }
};

let state = getState();
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

export const resetMockState = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('authToken');
  state = createInitialState();
};

const getUserId = () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Please log in to continue');
  const payload = JSON.parse(atob(token.split('.')[1])) as { id?: number };
  if (!payload.id) throw new Error('Please log in to continue');
  return Number(payload.id);
};

const createToken = (user: DemoUser) => {
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      birbName: user.birbName,
      friendCode: user.friendCode,
    }),
  );
  return `demo.${payload}.token`;
};

interface MockRequestBody {
  email?: string;
  password?: string;
  username?: string;
  birbName?: string;
  friendCode?: string;
  name?: string;
  color?: number;
  listType?: ListType;
  itemId?: number;
  colorId?: number;
  giftedBy?: number;
  giftedTo?: number;
  chosenItems?: {
    my: { id: number; colorId: number };
    their: { id: number; colorId: number };
  };
}

const getBody = (options: RequestInit) =>
  options.body ? (JSON.parse(String(options.body)) as MockRequestBody) : {};

const getUserItems = (userId: number, listType: ListType): UserItem[] =>
  state.userItems
    .filter((item) => item.user_id === userId && item.listType === listType)
    .sort((first, second) => {
      const nameOrder = first.name.localeCompare(second.name, undefined, {
        sensitivity: 'base',
      });
      if (nameOrder !== 0) return nameOrder;
      if (first.item_id !== second.item_id) {
        return first.item_id - second.item_id;
      }
      return first.color - second.color;
    })
    .map(({ user_id, item_id, color, name, isInTrade }) => ({
      user_id,
      item_id,
      color,
      name,
      isInTrade,
    }));

const getSortedItems = () =>
  [...state.items].sort((first, second) => {
    const nameOrder = first.name.localeCompare(second.name, undefined, {
      sensitivity: 'base',
    });
    return nameOrder || first.id - second.id;
  });

const colorsMatch = (first: number, second: number) =>
  first === second || first === 1 || second === 1;

const matchedColor = (first: number, second: number) => {
  if (first === 1) return second;
  return first;
};

const toTradeItem = (item: UserItem) => ({
  userId: item.user_id,
  itemId: item.item_id,
  colorId: item.color,
});

const getRecentlyTradedUserIds = (userId: number) => {
  if (IGNORE_RECENT_TRADE_LIMIT) return new Set<number>();

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recentUserIds = new Set<number>();

  state.pastTrades.forEach((trade) => {
    if (new Date(trade.archivedAt).getTime() < cutoff) return;
    if (trade.type !== 'trade') return;
    if (trade.userId1 === userId) recentUserIds.add(trade.userId2);
    if (trade.userId2 === userId) recentUserIds.add(trade.userId1);
  });

  state.gifts.forEach((gift) => {
    if (new Date(gift.archivedAt).getTime() < cutoff) return;
    if (gift.giftedBy === userId) recentUserIds.add(gift.giftedTo);
    if (gift.giftedTo === userId) recentUserIds.add(gift.giftedBy);
  });

  return recentUserIds;
};

const getPotentialTrades = (userId: number): Trader[] => {
  const myWishlist = getUserItems(userId, 'wishlist');
  const myTradelist = getUserItems(userId, 'tradelist');
  const activePartnerIds = new Set(
    state.trades
      .filter(
        (trade) => trade.status === 'pending' || trade.status === 'confirmed',
      )
      .flatMap((trade) => {
        if (trade.userId1 === userId) return [trade.userId2];
        if (trade.userId2 === userId) return [trade.userId1];
        return [];
      }),
  );
  const recentlyTradedUserIds = getRecentlyTradedUserIds(userId);

  return state.users
    .filter(
      (candidate) =>
        candidate.id !== userId && !activePartnerIds.has(candidate.id),
    )
    .flatMap((candidate) => {
      const candidateWishlist = getUserItems(candidate.id, 'wishlist');
      const candidateTradelist = getUserItems(candidate.id, 'tradelist');
      const wants = candidateWishlist.filter((wanted) =>
        myTradelist.some(
          (offer) =>
            offer.item_id === wanted.item_id &&
            colorsMatch(offer.color, wanted.color),
        ),
      );
      const has = candidateTradelist.filter((offer) =>
        myWishlist.some(
          (wanted) =>
            wanted.item_id === offer.item_id &&
            colorsMatch(wanted.color, offer.color),
        ),
      );

      if (!wants.length) return [];

      return [
        {
          tradeId: 0,
          userId: candidate.id,
          wants: wants.map((item) => ({
            ...toTradeItem(item),
            colorId: matchedColor(
              item.color,
              myTradelist.find(
                (offer) =>
                  offer.item_id === item.item_id &&
                  colorsMatch(offer.color, item.color),
              )?.color ?? item.color,
            ),
          })),
          has: has.map((item) => ({
            ...toTradeItem(item),
            colorId: matchedColor(
              item.color,
              myWishlist.find(
                (wanted) =>
                  wanted.item_id === item.item_id &&
                  colorsMatch(wanted.color, item.color),
              )?.color ?? item.color,
            ),
          })),
          recentlyTraded: recentlyTradedUserIds.has(candidate.id),
        },
      ];
    });
};

const removeTradeItem = (
  userId: number,
  itemId: number,
  colorId: number,
  allowAnyColor: boolean,
) => {
  const index = state.userItems.findIndex(
    (item) =>
      item.user_id === userId &&
      item.item_id === itemId &&
      (item.color === colorId || (allowAnyColor && item.color === 1)),
  );
  if (index >= 0) state.userItems.splice(index, 1);
};

const formatTrade = (trade: DemoTrade, userId: number): Trader => {
  const isUser1 = trade.userId1 === userId;
  const myItem = isUser1
    ? { userId: trade.userId1, itemId: trade.itemId1, colorId: trade.colorId1 }
    : { userId: trade.userId2, itemId: trade.itemId2, colorId: trade.colorId2 };
  const theirItem = isUser1
    ? { userId: trade.userId2, itemId: trade.itemId2, colorId: trade.colorId2 }
    : { userId: trade.userId1, itemId: trade.itemId1, colorId: trade.colorId1 };

  return {
    tradeId: trade.id,
    userId: isUser1 ? trade.userId2 : trade.userId1,
    wants: [myItem],
    has: [theirItem],
    recentlyTraded: false,
    status: trade.status,
    requestedByMe: trade.requestedBy.includes(userId),
    finishedByMe: trade.finishedBy.includes(userId),
    requestedTrade: {
      userId1: trade.userId1,
      itemId1: trade.itemId1,
      colorId1: trade.colorId1,
      userId2: trade.userId2,
      itemId2: trade.itemId2,
      colorId2: trade.colorId2,
    },
  };
};

export const mockApiFetch = async (
  path: string,
  options: RequestInit = {},
): Promise<unknown> => {
  const body = getBody(options);
  const method = options.method ?? 'GET';

  if (path === '/api/users/login' && method === 'POST') {
    const user = state.users.find(
      (candidate) =>
        candidate.email === body.email && candidate.password === body.password,
    );
    if (!user) throw new Error('Invalid email or password');
    return { token: createToken(user) };
  }

  if (path === '/api/users/signup' && method === 'POST') {
    if (
      !body.email ||
      !body.password ||
      !body.username ||
      !body.birbName ||
      !body.friendCode
    ) {
      throw new Error('All fields are required');
    }
    if (state.users.some((user) => user.email === body.email)) {
      throw new Error('Email already taken');
    }
    const user: DemoUser = {
      id: Math.max(...state.users.map(({ id }) => id), 0) + 1,
      email: body.email,
      password: body.password,
      username: body.username,
      birbName: body.birbName,
      friendCode: body.friendCode,
    };
    state.users.push(user);
    save();
    return { token: createToken(user) };
  }

  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch && method === 'GET') {
    const user = state.users.find(({ id }) => id === Number(userMatch[1]));
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      username: user.username,
      birbName: user.birbName,
      friendCode: user.friendCode,
    };
  }

  if (path === '/api/items/colors') return state.colors;
  if (path === '/api/items' && method === 'GET') return getSortedItems();

  const itemListMatch = path.match(/^\/api\/items\/(wishlist|tradelist)$/);
  if (itemListMatch)
    return getUserItems(getUserId(), itemListMatch[1] as ListType);

  if (path === '/api/items/add' && method === 'POST') {
    const userId = getUserId();
    if (!body.name || !body.color || !body.listType) {
      throw new Error('All fields are required');
    }
    if (body.listType === 'tradelist' && body.color === 1) {
      throw new Error('Tradelist items must have a specific color.');
    }
    const normalizedName = String(body.name).trim();
    let item = state.items.find(
      (candidate) =>
        candidate.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (!item) {
      item = {
        id: Math.max(...state.items.map(({ id }) => id), 0) + 1,
        name: normalizedName,
      };
      state.items.push(item);
    }
    const existingItem = state.userItems.some(
      (candidate) =>
        candidate.user_id === userId &&
        candidate.item_id === item?.id &&
        (body.color === 1 ||
          candidate.color === 1 ||
          candidate.color === body.color),
    );
    const existingListItem = state.userItems.find(
      (candidate) =>
        candidate.user_id === userId &&
        candidate.item_id === item?.id &&
        candidate.listType === body.listType &&
        (candidate.color === 1 || candidate.color === body.color),
    );
    if (existingItem && body.color === 1) {
      const existingListType = state.userItems.find(
        (candidate) =>
          candidate.user_id === userId && candidate.item_id === item?.id,
      )?.listType;
      if (existingListType === body.listType) {
        throw new Error(
          'If you want this item in any color, remove specific colors from your list first.',
        );
      }
      throw new Error(
        'You cannot add the item in any color to this list if it is already in the other list.',
      );
    }
    if (existingListItem?.color === 1 && body.color !== 1) {
      throw new Error(
        'Remove the any-color version of this item before adding a specific color.',
      );
    }
    if (existingListItem && existingListItem.color === body.color)
      throw new Error(`This item is already in your ${body.listType}.`);
    state.userItems.push({
      user_id: userId,
      item_id: item.id,
      color: body.color,
      name: item.name,
      listType: body.listType,
      isInTrade: false,
    });
    save();
    return { message: `Item added to ${body.listType}`, itemId: item.id };
  }

  if (path === '/api/items/remove' && method === 'DELETE') {
    const userId = getUserId();
    const index = state.userItems.findIndex(
      (candidate) =>
        candidate.user_id === userId &&
        candidate.item_id === body.itemId &&
        candidate.color === body.colorId &&
        candidate.listType === body.listType,
    );
    if (index < 0) throw new Error('Item not found');
    state.userItems.splice(index, 1);
    save();
    return { message: `Item removed from ${body.listType}` };
  }

  if (path === '/api/trades' && method === 'GET') {
    const userId = getUserId();
    return [
      ...state.trades.map((trade) => formatTrade(trade, userId)),
      ...getPotentialTrades(userId),
    ];
  }
  if (path === '/api/trades/past' && method === 'GET') {
    const userId = getUserId();
    const pastGifts = state.gifts.map((gift) => ({
      id: gift.id,
      itemId: gift.itemId,
      colorId: gift.colorId,
      archivedAt: gift.archivedAt,
      type:
        gift.giftedBy === userId
          ? ('giftGiven' as const)
          : ('giftReceived' as const),
      userId: gift.giftedBy === userId ? gift.giftedTo : gift.giftedBy,
    }));
    return [...state.pastTrades, ...pastGifts].sort(
      (first, second) =>
        new Date(second.archivedAt).getTime() -
        new Date(first.archivedAt).getTime(),
    );
  }

  const requestMatch = path.match(
    /^\/api\/trades\/requestTrade\?userId2=(\d+)$/,
  );
  if (requestMatch && method === 'POST') {
    const userId = getUserId();
    const userId2 = Number(requestMatch[1]);
    if (!body.chosenItems?.my || !body.chosenItems.their) {
      throw new Error('Missing required trade data');
    }
    let trade = state.trades.find(
      (candidate) =>
        (candidate.userId1 === userId && candidate.userId2 === userId2) ||
        (candidate.userId1 === userId2 && candidate.userId2 === userId),
    );
    if (trade) {
      trade.requestedBy = [...new Set([...trade.requestedBy, userId])];
      if (trade.requestedBy.length === 2) trade.status = 'confirmed';
      save();
      return {
        message: 'Trade updated',
        tradeId: trade.id,
        status: trade.status,
      };
    }
    trade = {
      id: Math.max(...state.trades.map(({ id }) => id), 0) + 1,
      userId1: userId,
      itemId1: body.chosenItems.my.id,
      colorId1: body.chosenItems.my.colorId,
      userId2,
      itemId2: body.chosenItems.their.id,
      colorId2: body.chosenItems.their.colorId,
      status: 'pending',
      requestedBy: [userId],
      finishedBy: [],
    };
    state.trades.push(trade);
    save();
    return {
      message: 'Trade created',
      tradeId: trade.id,
      status: trade.status,
    };
  }

  const finishMatch = path.match(/^\/api\/trades\/finishTrade\/(\d+)$/);
  if (finishMatch && method === 'POST') {
    const userId = getUserId();
    const trade = state.trades.find(({ id }) => id === Number(finishMatch[1]));
    if (!trade || trade.status !== 'pending')
      throw new Error('Trade not found or not pending'); // todo check what
    trade.finishedBy = [...new Set([...trade.finishedBy, userId])];
    if (trade.finishedBy.length === 2) {
      removeTradeItem(trade.userId1, trade.itemId1, trade.colorId1, true);
      removeTradeItem(trade.userId2, trade.itemId2, trade.colorId2, true);
      removeTradeItem(trade.userId1, trade.itemId2, trade.colorId2, false);
      removeTradeItem(trade.userId2, trade.itemId1, trade.colorId1, false);
      state.pastTrades.unshift({
        id: Date.now(),
        tradeId: trade.id,
        userId1: trade.userId1,
        itemId1: trade.itemId1,
        colorId1: trade.colorId1,
        userId2: trade.userId2,
        itemId2: trade.itemId2,
        colorId2: trade.colorId2,
        archivedAt: new Date().toISOString(),
        status: 'archived', // todo check
        type: 'trade',
      });
      state.trades.splice(state.trades.indexOf(trade), 1);
    }
    save();
    return {
      message: 'Trade updated',
      tradeId: trade.id,
      status: trade.status,
    };
  }

  if (path === '/api/trades/finishGifting' && method === 'POST') {
    const userId = getUserId();
    if (!body.itemId || !body.colorId || !body.giftedBy || !body.giftedTo) {
      throw new Error('All fields are required');
    }
    if (userId !== body.giftedBy && userId !== body.giftedTo) {
      throw new Error('You are not a party to this gift.');
    }
    removeTradeItem(body.giftedTo, body.itemId, body.colorId, true);
    removeTradeItem(body.giftedBy, body.itemId, body.colorId, false);
    state.gifts.unshift({
      id: Date.now(),
      giftedBy: body.giftedBy,
      giftedTo: body.giftedTo,
      itemId: body.itemId,
      colorId: body.colorId,
      archivedAt: new Date().toISOString(),
    });
    save();
    return {
      message: 'Gifting archived and items successfully deleted.',
    };
  }

  throw new Error(`Demo mode does not support ${method} ${path}`);
};
