import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const calls = [];
let results = [];

const runQuery = async (...args) => {
  calls.push(args);
  return results.shift() ?? { lastID: 42, changes: 1 };
};

mock.module(new URL('../src/utils.js', import.meta.url).href, {
  namedExports: {
    queryAll: async () => [],
    queryOne: async () => null,
    runQuery,
  },
});
mock.module(new URL('../src/models/db.js', import.meta.url).href, {
  defaultExport: {
    all() {},
    transaction() {},
  },
});

const { insertItemTransaction } =
  await import('../src/helpers/tradeHelpers.js');
const client = {};

const chosenItems = {
  my: { id: 2, colorId: 6 },
  their: { id: 1, colorId: 11 },
};

test('trade reservations require the expected list and an unreserved item', async () => {
  calls.length = 0;
  results = [];

  await insertItemTransaction('1', '2', chosenItems, client);

  assert.equal(calls.length, 5);
  assert.deepEqual(
    calls.slice(0, 4).map(([query, params]) => [query, params]),
    [
      [expectReservationQuery, [2, 2, 1, 6, 'tradelist']],
      [expectReservationQuery, [1, 1, 2, 11, 'tradelist']],
      [expectReservationQuery, [1, 2, 2, 6, 'wishlist']],
      [expectReservationQuery, [2, 1, 1, 11, 'wishlist']],
    ],
  );
  assert.match(calls[0][0], /list_type = \$5 AND in_trade_with_user IS NULL/);
});

test('trade creation fails if the selected offer was already reserved', async () => {
  calls.length = 0;
  results = [{ changes: 0 }];

  await assert.rejects(
    insertItemTransaction('1', '2', chosenItems, client),
    (error) => error.code === 'TRADE_ITEM_UNAVAILABLE',
  );

  assert.equal(calls.length, 1);
});

test('wishlist reservations fall back to an unreserved any-color item', async () => {
  calls.length = 0;
  results = [
    { changes: 1 },
    { changes: 1 },
    { changes: 0 },
    { changes: 1 },
    { changes: 1 },
    { lastID: 42, changes: 1 },
  ];

  await insertItemTransaction('1', '2', chosenItems, client);

  assert.equal(calls.length, 6);
  assert.match(calls[3][0], /color_id = 1/);
  assert.match(calls[3][0], /list_type = \$4 AND in_trade_with_user IS NULL/);
  assert.deepEqual(calls[3][1], [1, 2, 2, 'wishlist']);
});

const expectReservationQuery = `UPDATE user_items
     SET in_trade_with_user = $1
     WHERE item_id = $2 AND user_id = $3 AND color_id = $4
       AND list_type = $5 AND in_trade_with_user IS NULL`;
