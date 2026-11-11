import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const calls = {
  archiveTrade: [],
  clientQuery: [],
  deleteItem: [],
  deleteTrade: [],
  getTradeByUsers: [],
  insertItemTransaction: [],
  queryAll: [],
  queryOne: [],
  releaseTradeItems: [],
  runQuery: [],
  transactions: [],
  updateTrade: [],
};

const client = {
  query: async (...args) => {
    calls.clientQuery.push(args);
    return { rows: [] };
  },
};

const defaults = {
  archiveTrade: async () => {},
  deleteItem: async () => {},
  deleteTrade: async () => {},
  getTradeByUsers: async () => null,
  insertItemTransaction: async () => ({ lastID: 42 }),
  queryAll: async () => [],
  queryOne: async () => null,
  releaseTradeItems: async () => {},
  runQuery: async () => ({ lastID: 42, changes: 1 }),
  transaction: async (callback) => callback(client),
  updateTrade: async () => {},
};
let behavior = { ...defaults };

const record = (name, args) => {
  calls[name].push(args);
  return behavior[name](...args);
};

const queryAll = (...args) => record('queryAll', args);
const queryOne = (...args) => record('queryOne', args);
const releaseTradeItems = (...args) => record('releaseTradeItems', args);
const runQuery = (...args) => record('runQuery', args);
const archiveTrade = (...args) => record('archiveTrade', args);
const deleteTrade = (...args) => record('deleteTrade', args);
const getTradeByUsers = (...args) => record('getTradeByUsers', args);
const insertItemTransaction = (...args) =>
  record('insertItemTransaction', args);
const updateTrade = (...args) => record('updateTrade', args);
const deleteItem = (...args) => record('deleteItem', args);
const db = {
  transaction: (...args) => {
    calls.transactions.push(args);
    return behavior.transaction(...args);
  },
};

const mockModule = (path, namedExports) =>
  mock.module(new URL(path, import.meta.url).href, { namedExports });

mockModule('../src/utils.js', { queryAll, queryOne, runQuery });
mock.module(new URL('../src/models/db.js', import.meta.url).href, {
  defaultExport: db,
});
mockModule('../src/helpers/tradeHelpers.js', {
  archiveTrade,
  deleteTrade,
  findTrades: async () => [],
  getTradeByUsers,
  insertItemTransaction,
  releaseTradeItems,
  updateTrade,
});
mockModule('../src/helpers/itemHelpers.js', { deleteItem });

const {
  deletePendingTrade,
  getPastTradesFromDB,
  postFinishGifting,
  postFinishTrade,
  postRequestTrade,
} = await import('../src/controllers/tradeController.js');
const { deleteItemFromDB, postItemToDB } =
  await import('../src/controllers/itemController.js');
process.env.JWT_SECRET = 'backend-test-secret';
const { editUser, signUp } =
  await import('../src/controllers/userController.js');
const { MAX_ITEM_NAME_LENGTH } =
  await import('../../shared/src/constants/limits.js');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const confirmedTrade = (finishedBy = '[]') => ({
  id: 42,
  status: 'confirmed',
  requested_by: '["1"]',
  finished_by: finishedBy,
  user_id1: 1,
  item_id1: 2,
  color_id1: 6,
  user_id2: 2,
  item_id2: 1,
  color_id2: 11,
});

const pendingTrade = () => ({ ...confirmedTrade(), status: 'pending' });

beforeEach(() => {
  behavior = { ...defaults };
  for (const entries of Object.values(calls)) entries.length = 0;
});

test('trade request validates required data before opening a transaction', async () => {
  const response = createResponse();

  await postRequestTrade({ userId: '1', query: {}, body: {} }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls.transactions.length, 0);
});

test('trade request rejects self-trades and invalid item ids', async () => {
  const cases = [
    { userId2: '1', itemId: 2 },
    { userId2: '2', itemId: 0 },
  ];

  for (const { userId2, itemId } of cases) {
    const response = createResponse();
    await postRequestTrade(
      {
        userId: '1',
        query: { userId2 },
        body: {
          chosenItems: {
            my: { id: itemId, colorId: 6 },
            their: { id: 1, colorId: 11 },
          },
        },
      },
      response,
    );

    assert.equal(response.statusCode, 400);
  }
  assert.equal(calls.transactions.length, 0);
});

test('trade request creates a pending trade and locks the user pair', async () => {
  const response = createResponse();

  await postRequestTrade(
    {
      userId: '1',
      query: { userId2: '2' },
      body: {
        chosenItems: {
          my: { id: 2, colorId: 6 },
          their: { id: 1, colorId: 11 },
        },
      },
    },
    response,
  );

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    message: 'Trade created',
    tradeId: 42,
    status: 'pending',
  });
  assert.deepEqual(calls.clientQuery[0], [
    'SELECT pg_advisory_xact_lock($1, $2)',
    [1, 2],
  ]);
  assert.deepEqual(calls.insertItemTransaction[0].slice(0, 3), [
    '1',
    '2',
    {
      my: { id: 2, colorId: 6 },
      their: { id: 1, colorId: 11 },
    },
  ]);
});

test('reciprocal trade request confirms only matching item selections', async () => {
  behavior.getTradeByUsers = async () => pendingTrade();
  const response = createResponse();

  await postRequestTrade(
    {
      userId: '2',
      query: { userId2: '1' },
      body: {
        chosenItems: {
          my: { id: 1, colorId: 11 },
          their: { id: 2, colorId: 6 },
        },
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    message: 'Trade updated',
    tradeId: 42,
    status: 'confirmed',
  });
  assert.deepEqual(calls.updateTrade[0].slice(0, 3), [
    42,
    'confirmed',
    ['1', '2'],
  ]);
});

test('reciprocal trade request rejects changed item selections', async () => {
  behavior.getTradeByUsers = async () => pendingTrade();
  const response = createResponse();

  await postRequestTrade(
    {
      userId: '2',
      query: { userId2: '1' },
      body: {
        chosenItems: {
          my: { id: 1, colorId: 4 },
          their: { id: 2, colorId: 6 },
        },
      },
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /Trade items do not match/);
  assert.equal(calls.updateTrade.length, 0);
});

test('trade request returns conflict when an item is already reserved', async () => {
  behavior.insertItemTransaction = async () => {
    const error = new Error('Trade item is no longer available.');
    error.code = 'TRADE_ITEM_UNAVAILABLE';
    throw error;
  };
  const response = createResponse();
  let forwardedError;

  await postRequestTrade(
    {
      userId: '1',
      query: { userId2: '2' },
      body: {
        chosenItems: {
          my: { id: 2, colorId: 6 },
          their: { id: 1, colorId: 11 },
        },
      },
    },
    response,
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError.statusCode, 409);
  assert.equal(forwardedError.code, 'TRADE_ITEM_UNAVAILABLE');
});

test('either trade participant can cancel a pending trade and release its items', async () => {
  const trade = pendingTrade();
  behavior.queryOne = async () => trade;

  for (const userId of ['1', '2']) {
    const response = createResponse();
    await deletePendingTrade({ userId, params: { tradeId: '42' } }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { message: 'Pending trade cancelled' });
  }

  assert.equal(calls.transactions.length, 2);
  assert.match(
    calls.queryOne[1][0],
    /SELECT \* FROM trades WHERE id = \$1 FOR UPDATE/,
  );
  assert.deepEqual(calls.releaseTradeItems[0], [trade, client]);
  assert.deepEqual(calls.deleteTrade[0], [42, client]);
  assert.deepEqual(calls.releaseTradeItems[1], [trade, client]);
  assert.deepEqual(calls.deleteTrade[1], [42, client]);
});

test('pending trade cancellation rejects non-participants', async () => {
  behavior.queryOne = async () => pendingTrade();
  const response = createResponse();

  await deletePendingTrade(
    { userId: '3', params: { tradeId: '42' } },
    response,
  );

  assert.equal(response.statusCode, 403);
  assert.equal(calls.releaseTradeItems.length, 0);
  assert.equal(calls.deleteTrade.length, 0);
});

test('pending trade cancellation returns not found when the trade is gone', async () => {
  const response = createResponse();

  await deletePendingTrade(
    { userId: '1', params: { tradeId: '42' } },
    response,
  );

  assert.equal(response.statusCode, 404);
  assert.equal(calls.releaseTradeItems.length, 0);
  assert.equal(calls.deleteTrade.length, 0);
});

test('pending trade cancellation explains when the trade was already accepted', async () => {
  behavior.queryOne = async () => confirmedTrade();
  const response = createResponse();

  await deletePendingTrade(
    { userId: '1', params: { tradeId: '42' } },
    response,
  );

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, {
    message: 'This trade has already been accepted and cannot be cancelled.',
  });
  assert.equal(calls.clientQuery.length, 0);
  assert.equal(calls.releaseTradeItems.length, 0);
  assert.equal(calls.deleteTrade.length, 0);
});

test('pending trade cancellation detects acceptance while waiting for the pair lock', async () => {
  let queryCount = 0;
  behavior.queryOne = async () => {
    queryCount += 1;
    return queryCount === 1 ? pendingTrade() : confirmedTrade();
  };
  const response = createResponse();

  await deletePendingTrade(
    { userId: '1', params: { tradeId: '42' } },
    response,
  );

  assert.equal(response.statusCode, 409);
  assert.match(response.body.message, /already been accepted/);
  assert.equal(calls.releaseTradeItems.length, 0);
  assert.equal(calls.deleteTrade.length, 0);
});

test('only trade participants can mark a confirmed trade complete', async () => {
  behavior.queryOne = async () => confirmedTrade();
  const response = createResponse();

  await postFinishTrade({ userId: '3', params: { tradeId: '42' } }, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    message: 'You are not a party to this trade.',
  });
  assert.equal(calls.runQuery.length, 0);
  assert.equal(calls.deleteItem.length, 0);
});

test('first trade completion waits; second completion archives and removes items', async () => {
  behavior.queryOne = async () => confirmedTrade();
  const firstResponse = createResponse();

  await postFinishTrade(
    { userId: '1', params: { tradeId: '42' } },
    firstResponse,
  );

  assert.equal(firstResponse.statusCode, 200);
  assert.deepEqual(firstResponse.body, {
    message: 'Trade updated',
    tradeId: 42,
    status: 'confirmed',
  });
  assert.equal(calls.deleteItem.length, 0);
  assert.equal(calls.archiveTrade.length, 0);

  behavior.queryOne = async () => confirmedTrade('["1"]');
  const secondResponse = createResponse();

  await postFinishTrade(
    { userId: '2', params: { tradeId: '42' } },
    secondResponse,
  );

  assert.equal(secondResponse.statusCode, 200);
  assert.equal(secondResponse.body.status, 'archived');
  assert.equal(calls.deleteItem.length, 4);
  assert.equal(calls.archiveTrade.length, 1);
  assert.equal(calls.deleteTrade.length, 1);
});

test('past trade history validates limits and returns cursor pages', async () => {
  const firstGift = {
    id: 12,
    trade_id: null,
    user_id1: 1,
    user_id2: 2,
    status: 'archived',
    item_id1: 3,
    color_id1: 4,
    item_id2: null,
    color_id2: null,
    archived_at: new Date('2026-10-30T12:00:00.000Z'),
  };
  const secondTrade = {
    ...firstGift,
    id: 11,
    trade_id: 7,
    status: 'archived',
    item_id2: 8,
    color_id2: 9,
    archived_at: new Date('2026-10-29T12:00:00.000Z'),
  };
  behavior.queryAll = async () => [firstGift, secondTrade];
  const firstResponse = createResponse();

  await getPastTradesFromDB(
    { userId: '1', query: { limit: '1' } },
    firstResponse,
  );

  assert.equal(firstResponse.statusCode, 200);
  assert.deepEqual(firstResponse.body.data[0], {
    id: 12,
    itemId: 3,
    colorId: 4,
    archivedAt: '2026-10-30T12:00:00.000Z',
    type: 'giftGiven',
    userId: 2,
  });
  assert.ok(firstResponse.body.nextCursor);
  assert.match(calls.queryAll[0][0], /ORDER BY archived_at DESC, id DESC/);
  assert.equal(calls.queryAll[0][1][3], 2);

  behavior.queryAll = async () => [secondTrade];
  const secondResponse = createResponse();
  await getPastTradesFromDB(
    {
      userId: '1',
      query: { limit: '1', cursor: firstResponse.body.nextCursor },
    },
    secondResponse,
  );

  assert.equal(secondResponse.body.data[0].type, 'trade');
  assert.equal(secondResponse.body.nextCursor, null);
  assert.deepEqual(calls.queryAll[1][1].slice(1, 3), [
    '2026-10-30T12:00:00.000Z',
    12,
  ]);
});

test('past trade history rejects invalid pagination before querying', async () => {
  const response = createResponse();

  await getPastTradesFromDB({ userId: '1', query: { limit: '101' } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls.queryAll.length, 0);
});

test('gifting rejects users who are not one of the gift participants', async () => {
  const response = createResponse();

  await postFinishGifting(
    {
      userId: '3',
      body: { giftedBy: 1, giftedTo: 2, itemId: 9, colorId: 4 },
    },
    response,
  );

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    message: 'Only the gift giver can complete this gift.',
  });
  assert.equal(calls.transactions.length, 0);
});

test('gifting rejects a recipient attempting to complete the gift', async () => {
  const response = createResponse();

  await postFinishGifting(
    {
      userId: '2',
      body: { giftedBy: 1, giftedTo: 2, itemId: 9, colorId: 4 },
    },
    response,
  );

  assert.equal(response.statusCode, 403);
  assert.equal(calls.transactions.length, 0);
});

test('gift completion only removes the giver offer and recipient wish', async () => {
  const response = createResponse();

  await postFinishGifting(
    {
      userId: '1',
      body: { giftedBy: 1, giftedTo: 2, itemId: 9, colorId: 4 },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    calls.deleteItem.map((args) => args.slice(0, 3).concat(args[5])),
    [
      [2, 9, 4, 'wishlist'],
      [1, 9, 4, 'tradelist'],
    ],
  );
});

test('item creation rejects missing fields and any-color tradelist entries', async () => {
  const missingFieldsResponse = createResponse();
  await postItemToDB(
    { userId: '1', body: { name: '   ', color: 4, listType: 'wishlist' } },
    missingFieldsResponse,
  );
  assert.equal(missingFieldsResponse.statusCode, 400);

  const anyColorResponse = createResponse();
  await postItemToDB(
    { userId: '1', body: { name: 'Leaf', color: 1, listType: 'tradelist' } },
    anyColorResponse,
  );
  assert.equal(anyColorResponse.statusCode, 400);
  assert.match(anyColorResponse.body.message, /specific color/);
  assert.equal(calls.runQuery.length, 0);
});

test('item creation rejects an invalid list type before database access', async () => {
  const response = createResponse();

  await postItemToDB(
    { userId: '1', body: { name: 'Leaf', color: 4, listType: 'other' } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(calls.runQuery.length, 0);
});

test('item creation enforces the shared maximum item-name length', async () => {
  const response = createResponse();

  await postItemToDB(
    {
      userId: '1',
      body: {
        name: 'a'.repeat(MAX_ITEM_NAME_LENGTH + 1),
        color: 4,
        listType: 'wishlist',
      },
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(calls.runQuery.length, 0);
});

test('item deletion is scoped to the authenticated user', async () => {
  const response = createResponse();

  await deleteItemFromDB(
    {
      userId: '17',
      body: { itemId: 9, colorId: 4, listType: 'wishlist' },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls.runQuery[0][1], [9, 4, 'wishlist', '17']);
});

test('item deletion reports a missing item', async () => {
  behavior.runQuery = async () => ({ lastID: undefined, changes: 0 });
  const response = createResponse();

  await deleteItemFromDB(
    {
      userId: '17',
      body: { itemId: 9, colorId: 4, listType: 'wishlist' },
    },
    response,
  );

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, { message: 'Item not found' });
});

test('signup validates account fields before database access', async () => {
  const response = createResponse();

  await signUp(
    {
      body: {
        email: 'invalid-email',
        username: 'Finch',
        birbName: 'Pip',
        friendCode: 'PIP123',
        password: 'short',
      },
    },
    response,
    (error) => {
      throw error;
    },
  );

  assert.equal(response.statusCode, 400);
  assert.equal(calls.queryOne.length, 0);
  assert.equal(calls.runQuery.length, 0);
});

test('signup maps unique-constraint races to a safe conflict', async () => {
  behavior.runQuery = async () => {
    const error = new Error('duplicate key value');
    error.code = '23505';
    throw error;
  };
  const response = createResponse();
  let forwardedError;

  await signUp(
    {
      body: {
        email: 'NEW@EXAMPLE.COM',
        username: 'Finch',
        birbName: 'Pip',
        friendCode: 'PIP123',
        password: 'secure-password',
      },
    },
    response,
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError.statusCode, 409);
  assert.equal(forwardedError.code, 'ACCOUNT_CONFLICT');
  assert.equal(calls.runQuery[0][1][0], 'new@example.com');
});

test('account edits validate passwords and map duplicate emails to conflict', async () => {
  const invalidResponse = createResponse();
  await editUser(
    {
      userId: '1',
      params: { userId: '1' },
      body: { password: 'short', passwordAgain: 'short' },
    },
    invalidResponse,
    (error) => {
      throw error;
    },
  );
  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(calls.queryOne.length, 0);

  behavior.queryOne = async (query) =>
    query.includes('LOWER(email)')
      ? null
      : {
          id: 1,
          email: 'user@example.com',
          password: 'existing-hash',
        };
  behavior.runQuery = async () => {
    const error = new Error('duplicate key value');
    error.code = '23505';
    throw error;
  };
  const response = createResponse();
  let forwardedError;
  await editUser(
    {
      userId: '1',
      params: { userId: '1' },
      body: { email: 'taken@example.com' },
    },
    response,
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError.statusCode, 409);
  assert.equal(forwardedError.code, 'EMAIL_CONFLICT');
});
