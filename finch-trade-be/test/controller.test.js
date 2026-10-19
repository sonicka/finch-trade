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
  updateTrade,
});
mockModule('../src/helpers/itemHelpers.js', { deleteItem });

const { postFinishGifting, postFinishTrade, postRequestTrade } =
  await import('../src/controllers/tradeController.js');
const { deleteItemFromDB, postItemToDB } =
  await import('../src/controllers/itemController.js');

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

  assert.equal(response.statusCode, 500);
  assert.match(response.body.message, /Trade items do not match/);
  assert.equal(calls.updateTrade.length, 0);
});

test('only trade participants can mark a confirmed trade complete', async () => {
  behavior.queryOne = async () => confirmedTrade();
  const response = createResponse();

  await postFinishTrade({ userId: '3', params: { tradeId: '42' } }, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    error: 'You are not a party to this trade.',
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
    message: 'You are not a party to this gift.',
  });
  assert.equal(calls.transactions.length, 0);
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
