import assert from 'node:assert/strict';
import test from 'node:test';
import { runTransaction } from '../src/models/transaction.js';

const fakePool = (client) => ({
  connect: async () => client,
});

const fakeClient = (queries = []) => ({
  query: async (sql) => {
    queries.push(sql);
  },
  release: () => queries.push('RELEASE'),
});

test('commits work and releases the client after success', async () => {
  const queries = [];
  const result = await runTransaction(
    fakePool(fakeClient(queries)),
    async (client) => {
      await client.query('UPDATE items');
      return 'done';
    },
  );

  assert.equal(result, 'done');
  assert.deepEqual(queries, ['BEGIN', 'UPDATE items', 'COMMIT', 'RELEASE']);
});

test('rolls back and releases the client after callback failure', async () => {
  const queries = [];
  const expectedError = new Error('item update failed');

  await assert.rejects(
    runTransaction(fakePool(fakeClient(queries)), async () => {
      throw expectedError;
    }),
    expectedError,
  );

  assert.deepEqual(queries, ['BEGIN', 'ROLLBACK', 'RELEASE']);
});

test('preserves the original error if rollback fails', async () => {
  const queries = [];
  const originalError = new Error('transaction failed');
  const client = {
    query: async (sql) => {
      queries.push(sql);
      if (sql === 'ROLLBACK') throw new Error('rollback failed');
    },
    release: () => queries.push('RELEASE'),
  };

  await assert.rejects(
    runTransaction(fakePool(client), async () => {
      throw originalError;
    }),
    originalError,
  );

  assert.deepEqual(queries, ['BEGIN', 'ROLLBACK', 'RELEASE']);
});

test('waits for readiness before acquiring a client', async () => {
  const events = [];
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const client = fakeClient(events);
  const pool = {
    connect: async () => {
      events.push('CONNECT');
      return client;
    },
  };

  const transaction = runTransaction(pool, async () => 'ready', ready);
  await Promise.resolve();
  assert.deepEqual(events, []);

  resolveReady();
  assert.equal(await transaction, 'ready');
  assert.deepEqual(events, ['CONNECT', 'BEGIN', 'COMMIT', 'RELEASE']);
});
